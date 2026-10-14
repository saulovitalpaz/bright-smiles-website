import base64
import hashlib
import io
import os
from datetime import datetime, timezone

from cryptography import x509
from pyhanko.pdf_utils import generic
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.fields import MDPPerm, SigSeedSubFilter
from pyhanko.sign.signers import PdfSignatureMetadata, PdfSigner
from pyhanko.sign.validation import async_validate_pdf_signature
from pyhanko.sign.validation.status import SignatureCoverageLevel

from certificates import SigningError, context_for, decode_payload, inspect_credential, metadata, load_certificates, allowed_hosts, TRUST_DIRECTORY
from network import session_for
from pdf_document import render_document

MAX_PDF_BYTES = 10 * 1024 * 1024


def read_pdf(raw):
    if not raw.startswith(b'%PDF-'):
        raise SigningError('INVALID_PDF', 'Selecione um arquivo PDF válido.')
    try:
        reader = PdfFileReader(io.BytesIO(raw), strict=True)
        if reader.security_handler is not None or int(reader.root['/Pages']['/Count']) > 100:
            raise ValueError('Encrypted or excessive page count')
        inspect_pdf_objects(reader.root)
        return reader
    except SigningError:
        raise
    except Exception:
        raise SigningError('INVALID_PDF', 'O PDF não pôde ser analisado com segurança. Confira formato, proteção por senha e limite de páginas.') from None


def inspect_pdf_objects(root):
    seen = set()
    nodes = 0

    def visit(value, depth=0):
        nonlocal nodes
        nodes += 1
        if nodes > 100000 or depth > 80:
            raise ValueError('PDF structure limit')
        if isinstance(value, generic.IndirectObject):
            marker = (value.idnum, value.generation)
            if marker in seen:
                return
            seen.add(marker)
            value = value.get_object()
        if isinstance(value, generic.DictionaryObject):
            if any(key in value for key in ('/JavaScript', '/JS', '/OpenAction', '/AA', '/EmbeddedFiles')):
                raise ValueError('Active PDF content')
            if value.get('/S') in ('/JavaScript', '/Launch', '/GoToR', '/SubmitForm', '/ImportData'):
                raise ValueError('Active PDF action')
            for item in value.values():
                visit(item, depth + 1)
        elif isinstance(value, (list, tuple, generic.ArrayObject)):
            for item in value:
                visit(item, depth + 1)
    visit(root)


async def validate_pdf(raw, session):
    reader = read_pdf(raw)
    results = []
    context = context_for(session)
    signatures = reader.embedded_signatures
    if len(signatures) > 16:
        raise SigningError('INVALID_PDF', 'O PDF excede o limite de assinaturas para análise.')
    for embedded in signatures:
        reasons = []
        certificate = x509.load_der_x509_certificate(embedded.signer_cert.dump())
        try:
            info = metadata(certificate)
        except SigningError:
            info = {'subjectName': 'Signatário sem identificação e-CPF', 'cpfMasked': '',
                    'issuer': 'Autoridade certificadora', 'validUntil': certificate.not_valid_after_utc.isoformat()}
        try:
            status = await async_validate_pdf_signature(embedded, signer_validation_context=context, ts_validation_context=context)
            intact = bool(status.intact and status.valid)
            coverage_ok = status.coverage in (SignatureCoverageLevel.ENTIRE_FILE, SignatureCoverageLevel.ENTIRE_REVISION)
            modifications_ok = status.docmdp_ok and str(status.modification_level.name if status.modification_level else 'NONE') in ('NONE', 'LTA_UPDATES')
            if not intact or not coverage_ok or not modifications_ok:
                outcome = 'INVALID'
                reasons.append('O documento foi alterado ou a assinatura não protege o conteúdo apresentado.')
            elif not status.trusted:
                outcome = 'INDETERMINATE'
                reasons.append('Não foi possível comprovar confiança e revogação na data da verificação.')
            else:
                outcome = 'VALID'
            if status.timestamp_validity is None:
                reasons.append('Sem carimbo do tempo confiável; a data de assinatura é declarada pelo signatário.')
        except Exception:
            outcome = 'INDETERMINATE'
            reasons.append('As evidências da assinatura são insuficientes para concluir a validação.')
        results.append({'name': info['subjectName'], 'cpfMasked': info['cpfMasked'], 'issuer': info['issuer'],
                        'validUntil': info['validUntil'], 'status': outcome, 'reasons': reasons})
    outcomes = [item['status'] for item in results]
    overall = 'INVALID' if not results or 'INVALID' in outcomes else 'INDETERMINATE' if 'INDETERMINATE' in outcomes else 'VALID'
    return {'status': overall, 'signers': results, 'checkedAt': datetime.now(timezone.utc).isoformat(),
            'hash': hashlib.sha256(raw).hexdigest(), 'motor': 'pyHanko', 'scope': 'SIGNATURE_ONLY'}


async def handle(request):
    if not isinstance(request, dict):
        raise SigningError('INVALID_REQUEST', 'A solicitação de assinatura é inválida.')
    operation = request.get('operation')
    if operation == 'capabilities':
        try:
            if not load_certificates(os.environ.get('SIGNING_TRUST_ROOTS_PATH') or str(TRUST_DIRECTORY / 'roots.pem')):
                raise ValueError('Empty roots')
            load_certificates(os.environ.get('SIGNING_CA_BUNDLE_PATH') or str(TRUST_DIRECTORY / 'authorities.pem'))
            if not (allowed_hosts() or os.environ.get('SIGNING_CRL_PATH', '').strip()):
                raise ValueError('No revocation source')
            return {'available': True}
        except Exception:
            return {'available': False, 'message': 'Configure a cadeia ICP-Brasil e as fontes de revogação no servidor.'}
    allowed = allowed_hosts()
    async with session_for(allowed) as session:
        if operation == 'validate':
            return await validate_pdf(decode_payload(request.get('pdfBase64'), MAX_PDF_BYTES), session)
        if operation not in ('inspect', 'sign'):
            raise SigningError('INVALID_REQUEST', 'Operação de assinatura não reconhecida.')
        signer, certificate, context = await inspect_credential(request, session)
        if operation == 'inspect':
            return {'status': 'VALID', 'certificate': certificate}
        unsigned = render_document(request.get('document'), certificate)
        metadata_pdf = PdfSignatureMetadata(
            field_name='AssinaturaDigital', md_algorithm='sha256', subfilter=SigSeedSubFilter.PADES,
            certify=True, docmdp_permissions=MDPPerm.NO_CHANGES, validation_context=context,
            signer_key_usage={'non_repudiation'}, embed_validation_info=True,
            reason='Prescrição odontológica',
        )
        try:
            result = await PdfSigner(metadata_pdf, signer=signer).async_sign_pdf(IncrementalPdfFileWriter(io.BytesIO(unsigned)))
            signed = result.getvalue()
        except Exception:
            raise SigningError('SIGNING_FAILED', 'Não foi possível assinar o PDF. Nenhum documento foi emitido.') from None
        if len(signed) > MAX_PDF_BYTES:
            raise SigningError('INVALID_PDF', 'O PDF assinado excede o limite permitido.')
        validation = await validate_pdf(signed, session)
        if validation['status'] != 'VALID':
            raise SigningError('VALIDATION_FAILED', 'A assinatura não pôde ser confirmada. Nenhum documento foi emitido.')
        return {'pdfBase64': base64.b64encode(signed).decode(), 'hash': validation['hash'],
                'certificate': certificate, 'validation': validation,
                'signatureProfile': 'PAdES baseline, sem carimbo do tempo confiável', 'hasTrustedTimestamp': False}
