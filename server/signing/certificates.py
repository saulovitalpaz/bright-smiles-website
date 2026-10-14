import base64
import hashlib
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from asn1crypto import core, keys, pem, x509 as asn1_x509
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID, ObjectIdentifier
from pyhanko.sign.signers import SimpleSigner
from pyhanko_certvalidator import CertificateValidator, ValidationContext
from pyhanko_certvalidator.errors import RevokedError
from pyhanko_certvalidator.fetchers.aiohttp_fetchers import AIOHttpFetcherBackend
from pyhanko_certvalidator.registry import SimpleCertificateStore

MAX_CERTIFICATE_BYTES = 1024 * 1024
TRUST_DIRECTORY = Path(__file__).parent / 'trust'


def allowed_hosts():
    value = os.environ.get('SIGNING_ALLOWED_HOSTS')
    if value is None:
        location = TRUST_DIRECTORY / 'allowed-hosts.txt'
        value = location.read_text().strip() if location.is_file() else ''
    return {host.strip().lower() for host in value.split(',') if host.strip()}


class SigningError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def decode_payload(value, limit):
    if not isinstance(value, str) or len(value) > ((limit + 2) // 3) * 4:
        raise SigningError('INVALID_UPLOAD', 'Arquivo ausente ou acima do limite permitido.')
    try:
        result = base64.b64decode(value, validate=True)
    except (ValueError, TypeError):
        raise SigningError('INVALID_UPLOAD', 'O arquivo informado é inválido.') from None
    if not result or len(result) > limit:
        raise SigningError('INVALID_UPLOAD', 'Arquivo ausente ou acima do limite permitido.')
    return result


def normalize_cpf(value):
    cpf = re.sub(r'\D', '', str(value or ''))
    if len(cpf) != 11 or len(set(cpf)) == 1:
        raise SigningError('INVALID_CPF', 'Informe um CPF válido.')
    for index in (9, 10):
        check = (sum(int(cpf[position]) * (index + 1 - position) for position in range(index)) * 10) % 11
        if int(cpf[index]) != (0 if check == 10 else check):
            raise SigningError('INVALID_CPF', 'Informe um CPF válido.')
    return cpf


def certificate_cpf(certificate):
    try:
        names = certificate.extensions.get_extension_for_class(x509.SubjectAlternativeName).value
        if any(isinstance(name, x509.OtherName) and name.type_id == ObjectIdentifier('2.16.76.1.3.3') for name in names):
            raise SigningError('CERTIFICATE_IDENTITY_MISSING', 'Utilize o certificado pessoal e-CPF do profissional.')
        for name in names:
            if isinstance(name, x509.OtherName) and name.type_id == ObjectIdentifier('2.16.76.1.3.1'):
                value = core.load(name.value).native
                if isinstance(value, bytes):
                    value = value.decode('utf-8', errors='strict')
                if not isinstance(value, str) or len(value) < 19 or not re.fullmatch(r'[0-9]{19}', value[:19]):
                    break
                return normalize_cpf(value[8:19])
    except (x509.ExtensionNotFound, ValueError, UnicodeError):
        pass
    raise SigningError('CERTIFICATE_IDENTITY_MISSING', 'O certificado não contém a identificação e-CPF esperada.')


def masked_cpf(cpf):
    return '***.***.' + cpf[6:9] + '-**'


def metadata(certificate):
    common = certificate.subject.get_attributes_for_oid(NameOID.COMMON_NAME)
    subject_name = common[0].value if common else 'Titular do certificado'
    subject_name = re.sub(r'\d{11}', '***', subject_name)[:240]
    issuer_common = certificate.issuer.get_attributes_for_oid(NameOID.COMMON_NAME)
    return {
        'subjectName': subject_name,
        'cpfMasked': masked_cpf(certificate_cpf(certificate)),
        'issuer': (issuer_common[0].value if issuer_common else 'Autoridade certificadora')[:240],
        'validFrom': certificate.not_valid_before_utc.isoformat(),
        'validUntil': certificate.not_valid_after_utc.isoformat(),
        'fingerprint': hashlib.sha256(certificate.public_bytes(serialization.Encoding.DER)).hexdigest(),
        'checkedAt': datetime.now(timezone.utc).isoformat(),
        'ready': True,
    }


def load_certificates(path):
    if not path or not Path(path).is_file():
        raise SigningError('SIGNING_NOT_CONFIGURED', 'A cadeia ICP-Brasil ainda não foi configurada no servidor.')
    raw = Path(path).read_bytes()
    if len(raw) > 16 * 1024 * 1024:
        raise SigningError('SIGNING_NOT_CONFIGURED', 'Configuração da cadeia ICP-Brasil inválida.')
    return [asn1_x509.Certificate.load(der) for kind, _, der in pem.unarmor(raw, multiple=True)
            if kind == 'CERTIFICATE'] if pem.detect(raw) else [asn1_x509.Certificate.load(raw)]


def context_for(session, additional=()):
    roots = load_certificates(os.environ.get('SIGNING_TRUST_ROOTS_PATH') or str(TRUST_DIRECTORY / 'roots.pem'))
    others = load_certificates(os.environ.get('SIGNING_CA_BUNDLE_PATH') or str(TRUST_DIRECTORY / 'authorities.pem'))
    if not roots:
        raise SigningError('SIGNING_NOT_CONFIGURED', 'A cadeia ICP-Brasil ainda não foi configurada no servidor.')
    crls = []
    location = os.environ.get('SIGNING_CRL_PATH')
    if location:
        path = Path(location)
        files = sorted(path.glob('*.crl')) if path.is_dir() else [path]
        for item in files:
            data = item.read_bytes()
            if len(data) > 8 * 1024 * 1024:
                raise SigningError('SIGNING_NOT_CONFIGURED', 'Lista de revogação acima do limite permitido.')
            crls.append(pem.unarmor(data)[2] if pem.detect(data) else data)
    return ValidationContext(
        trust_roots=roots, other_certs=[*others, *additional], crls=crls,
        allow_fetching=bool(allowed_hosts()),
        fetcher_backend=AIOHttpFetcherBackend(session=session, per_request_timeout=10),
        revocation_mode='require', weak_hash_algos={'md2', 'md5', 'sha1'},
    )


async def inspect_credential(request, session):
    password = request.get('password')
    if not isinstance(password, str) or not 1 <= len(password) <= 1024:
        raise SigningError('INVALID_CERTIFICATE', 'Informe a senha do certificado.')
    raw = decode_payload(request.get('pfxBase64'), MAX_CERTIFICATE_BYTES)
    try:
        key, certificate, chain = pkcs12.load_key_and_certificates(raw, password.encode('utf-8'))
    except (ValueError, TypeError):
        raise SigningError('INVALID_CERTIFICATE', 'Certificado ou senha inválidos. Confira o arquivo A1 e sua senha.') from None
    if key is None or certificate is None:
        raise SigningError('INVALID_CERTIFICATE', 'O arquivo não contém certificado e chave privada para assinatura.')
    cpf = normalize_cpf(request.get('cpf'))
    if certificate_cpf(certificate) != cpf:
        raise SigningError('CPF_MISMATCH', 'O CPF informado não corresponde ao titular do certificado.')
    now = datetime.now(timezone.utc)
    if not certificate.not_valid_before_utc <= now <= certificate.not_valid_after_utc:
        raise SigningError('CERTIFICATE_EXPIRED', 'O certificado está vencido ou ainda não está vigente.')
    try:
        policy = certificate.extensions.get_extension_for_class(x509.CertificatePolicies).value
        if not any(item.policy_identifier.dotted_string.startswith('2.16.76.1.2.1.') for item in policy):
            raise ValueError('Not an A1 policy')
        if isinstance(key, rsa.RSAPrivateKey) and key.key_size < 2048:
            raise ValueError('Weak signing key')
    except (x509.ExtensionNotFound, ValueError):
        raise SigningError('INVALID_CERTIFICATE', 'O certificado não possui política A1 ICP-Brasil aceita.') from None
    asn1_cert = asn1_x509.Certificate.load(certificate.public_bytes(serialization.Encoding.DER))
    additional = [asn1_x509.Certificate.load(item.public_bytes(serialization.Encoding.DER)) for item in chain]
    context = context_for(session, additional)
    try:
        await CertificateValidator(asn1_cert, intermediate_certs=additional, validation_context=context).async_validate_usage({'non_repudiation'})
    except RevokedError:
        raise SigningError('CERTIFICATE_REVOKED', 'O certificado foi revogado. Envie um certificado válido.') from None
    except Exception:
        raise SigningError('CERTIFICATE_UNTRUSTED', 'Não foi possível comprovar cadeia e revogação do certificado. Tente novamente ou verifique a configuração ICP-Brasil.') from None
    store = SimpleCertificateStore()
    store.register_multiple(additional)
    asn1_key = keys.PrivateKeyInfo.load(key.private_bytes(serialization.Encoding.DER, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    signer = SimpleSigner(asn1_cert, asn1_key, store, embed_roots=False)
    return signer, metadata(certificate), context
