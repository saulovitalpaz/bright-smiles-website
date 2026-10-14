import asyncio
import base64
import importlib
import io
import os
import secrets
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from asn1crypto import core
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID, ObjectIdentifier


def make_cpf():
    digits = [secrets.randbelow(10) for _ in range(9)]
    for count in (10, 11):
        value = (sum(digit * (count - index) for index, digit in enumerate(digits)) * 10) % 11
        digits.append(0 if value == 10 else value)
    return ''.join(map(str, digits))


class SigningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = importlib.import_module('engine')

    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.directory = Path(self.folder.name)
        self.cpf = make_cpf()
        self.password = secrets.token_urlsafe(24)
        self.now = datetime.now(timezone.utc)
        self.root_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.root_name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Synthetic test root')])
        self.root = (x509.CertificateBuilder().subject_name(self.root_name).issuer_name(self.root_name)
                     .public_key(self.root_key.public_key()).serial_number(x509.random_serial_number())
                     .not_valid_before(self.now - timedelta(days=1)).not_valid_after(self.now + timedelta(days=30))
                     .add_extension(x509.BasicConstraints(ca=True, path_length=1), critical=True)
                     .add_extension(x509.KeyUsage(False, False, False, False, False, True, True, False, False), critical=True)
                     .add_extension(x509.SubjectKeyIdentifier.from_public_key(self.root_key.public_key()), critical=False)
                     .sign(self.root_key, hashes.SHA256()))
        self.root_path = self.directory / 'root.pem'
        self.root_path.write_bytes(self.root.public_bytes(serialization.Encoding.PEM))
        self.write_crl()
        self.environment = patch.dict(os.environ, {
            'SIGNING_TRUST_ROOTS_PATH': str(self.root_path),
            'SIGNING_CA_BUNDLE_PATH': str(self.root_path),
            'SIGNING_CRL_PATH': str(self.directory / 'current.crl'),
            'SIGNING_ALLOWED_HOSTS': '',
        })
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def write_crl(self, revoked_serial=None):
        builder = (x509.CertificateRevocationListBuilder().issuer_name(self.root_name)
                   .last_update(self.now - timedelta(minutes=2)).next_update(self.now + timedelta(days=1)))
        if revoked_serial:
            revoked = (x509.RevokedCertificateBuilder().serial_number(revoked_serial)
                       .revocation_date(self.now - timedelta(minutes=1)).build())
            builder = builder.add_revoked_certificate(revoked)
        (self.directory / 'current.crl').write_bytes(builder.sign(self.root_key, hashes.SHA256()).public_bytes(serialization.Encoding.DER))

    def credential(self, expired=False, with_cpf=True, rg_tail='', corporate=False):
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Profissional de teste')])
        builder = (x509.CertificateBuilder().subject_name(subject).issuer_name(self.root.subject)
                   .public_key(key.public_key()).serial_number(x509.random_serial_number())
                   .not_valid_before(self.now - timedelta(days=3))
                   .not_valid_after(self.now - timedelta(days=1) if expired else self.now + timedelta(days=5))
                   .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
                   .add_extension(x509.KeyUsage(True, True, False, False, False, False, False, False, False), critical=True)
                   .add_extension(x509.AuthorityKeyIdentifier.from_issuer_public_key(self.root_key.public_key()), critical=False)
                   .add_extension(x509.CertificatePolicies([x509.PolicyInformation(ObjectIdentifier('2.16.76.1.2.1.4'), None)]), critical=False))
        if with_cpf:
            value = core.UTF8String('01011990' + self.cpf + '0' * 32 + rg_tail).dump()
            names = [
                x509.OtherName(ObjectIdentifier('2.16.76.1.3.1'), value)
            ]
            if corporate:
                names.append(x509.OtherName(ObjectIdentifier('2.16.76.1.3.3'), core.UTF8String('0' * 14).dump()))
            builder = builder.add_extension(x509.SubjectAlternativeName(names), critical=False)
        certificate = builder.sign(self.root_key, hashes.SHA256())
        pfx = pkcs12.serialize_key_and_certificates(None, key, certificate, [self.root],
                                                  serialization.BestAvailableEncryption(self.password.encode()))
        return {'pfxBase64': base64.b64encode(pfx).decode(), 'password': self.password, 'cpf': self.cpf}, certificate

    def run_operation(self, request):
        return asyncio.run(self.engine.handle(request))

    def test_inspection_validates_chain_and_only_returns_masked_identity(self):
        credential, _ = self.credential()
        result = self.run_operation({'operation': 'inspect', **credential})
        self.assertEqual(result['status'], 'VALID')
        self.assertTrue(result['certificate']['ready'])
        self.assertNotIn(self.cpf, str(result))
        self.assertNotIn(self.password, str(result))

    def test_wrong_password_and_cpf_are_rejected(self):
        credential, _ = self.credential()
        with self.assertRaises(self.engine.SigningError) as wrong_password:
            self.run_operation({'operation': 'inspect', **credential, 'password': secrets.token_urlsafe(20)})
        self.assertEqual(wrong_password.exception.code, 'INVALID_CERTIFICATE')
        with self.assertRaises(self.engine.SigningError) as wrong_cpf:
            self.run_operation({'operation': 'inspect', **credential, 'cpf': make_cpf()})
        self.assertEqual(wrong_cpf.exception.code, 'CPF_MISMATCH')

    def test_cpf_position_does_not_depend_on_rg_issuer_suffix(self):
        credential, _ = self.credential(rg_tail='SSP MG')
        self.assertEqual(self.run_operation({'operation': 'inspect', **credential})['status'], 'VALID')

    def test_corporate_identity_is_not_registered_as_personal_ecpf(self):
        credential, _ = self.credential(corporate=True)
        with self.assertRaises(self.engine.SigningError):
            self.run_operation({'operation': 'inspect', **credential})

    def test_expired_and_missing_identity_cannot_be_registered(self):
        credential, _ = self.credential(expired=True)
        with self.assertRaises(self.engine.SigningError) as error:
            self.run_operation({'operation': 'inspect', **credential})
        self.assertEqual(error.exception.code, 'CERTIFICATE_EXPIRED')
        credential, _ = self.credential(with_cpf=False)
        with self.assertRaises(self.engine.SigningError):
            self.run_operation({'operation': 'inspect', **credential})

    def test_revoked_certificate_and_absent_revocation_evidence_fail_closed(self):
        credential, cert = self.credential()
        self.write_crl(cert.serial_number)
        with self.assertRaises(self.engine.SigningError) as revoked:
            self.run_operation({'operation': 'inspect', **credential})
        self.assertEqual(revoked.exception.code, 'CERTIFICATE_REVOKED')
        self.write_crl()
        with patch.dict(os.environ, {'SIGNING_CRL_PATH': ''}):
            with self.assertRaises(self.engine.SigningError):
                self.run_operation({'operation': 'inspect', **credential})

    def test_roots_from_upload_are_not_trusted(self):
        credential, _ = self.credential()
        foreign_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        foreign_root = (x509.CertificateBuilder().subject_name(self.root_name).issuer_name(self.root_name)
                        .public_key(foreign_key.public_key()).serial_number(x509.random_serial_number())
                        .not_valid_before(self.now - timedelta(days=1)).not_valid_after(self.now + timedelta(days=1))
                        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
                        .sign(foreign_key, hashes.SHA256()))
        self.root_path.write_bytes(foreign_root.public_bytes(serialization.Encoding.PEM))
        with self.assertRaises(self.engine.SigningError):
            self.run_operation({'operation': 'inspect', **credential})

    def test_signed_pdf_validates_and_tampering_is_detected(self):
        credential, _ = self.credential()
        token = secrets.token_urlsafe(32)
        document = {'patientName': 'Paciente de teste', 'patientCpf': make_cpf(),
                    'professionalName': 'Profissional de teste', 'professionalCro': 'CRO/MG teste',
                    'content': '<p>Conteudo sintetico de homologacao.</p>', 'date': self.now.isoformat(),
                    'verificationUrl': 'https://example.invalid/validar-receita#token=' + token}
        signed = self.run_operation({'operation': 'sign', **credential, 'document': document})
        self.assertEqual(signed['validation']['status'], 'VALID')
        original = base64.b64decode(signed['pdfBase64'])
        result = self.run_operation({'operation': 'validate', 'pdfBase64': signed['pdfBase64']})
        self.assertEqual(result['status'], 'VALID')
        tampered = original.replace(b'%PDF-1.', b'%PDF-2.', 1)
        self.assertNotEqual(tampered, original)
        altered = self.run_operation({'operation': 'validate', 'pdfBase64': base64.b64encode(tampered).decode()})
        self.assertEqual(altered['status'], 'INVALID')

    def test_unsigned_and_malformed_pdf_never_validate(self):
        from reportlab.pdfgen import canvas
        output = io.BytesIO()
        pdf = canvas.Canvas(output)
        pdf.drawString(50, 50, 'Documento sintetico nao assinado')
        pdf.save()
        unsigned = self.run_operation({'operation': 'validate', 'pdfBase64': base64.b64encode(output.getvalue()).decode()})
        self.assertEqual(unsigned['status'], 'INVALID')
        with self.assertRaises(self.engine.SigningError):
            self.run_operation({'operation': 'validate', 'pdfBase64': base64.b64encode(b'not a pdf').decode()})

    def test_network_guard_denies_private_and_unapproved_targets(self):
        from network import validate_target
        with self.assertRaises(ValueError):
            validate_target('http://127.0.0.1/metadata', {'127.0.0.1'})
        with self.assertRaises(ValueError):
            validate_target('http://169.254.169.254/metadata', {'169.254.169.254'})
        with self.assertRaises(ValueError):
            validate_target('https://not-approved.invalid/crl', {'approved.invalid'})
        with self.assertRaises(ValueError):
            validate_target('ftp://approved.invalid/crl', {'approved.invalid'})


if __name__ == '__main__':
    unittest.main()
