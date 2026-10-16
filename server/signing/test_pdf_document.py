import io
import base64
import unittest

from pyhanko.pdf_utils.reader import PdfFileReader
from pdf_document import render_document


class PrescriptionLayoutTests(unittest.TestCase):
    def test_signature_illustration_is_embedded_before_cryptographic_signing(self):
        from PIL import Image
        image = io.BytesIO()
        Image.new('RGB', (180, 60), 'white').save(image, format='PNG')
        document = self.document()
        document.update(patientAddress='Endereco sintetico', patientPhone='Telefone sintetico',
                        clinic={'name': 'Clinica sintetica', 'address': 'Local sintetico', 'phone': 'Contato sintetico', 'cnpj': 'CNPJ sintetico'},
                        signatureImageBase64=base64.b64encode(image.getvalue()).decode())
        reader = PdfFileReader(io.BytesIO(render_document(document, {'subjectName': 'Certificado ficticio'})))
        page = reader.root['/Pages']['/Kids'][0].get_object()
        images = page['/Resources'].get('/XObject', {})
        self.assertGreaterEqual(sum(obj.get_object()['/Subtype'] == '/Image' for obj in images.values()), 2)

    def test_invalid_signature_bytes_fail_closed(self):
        from certificates import SigningError
        document = self.document()
        document['signatureImageBase64'] = base64.b64encode(b'not an image').decode()
        with self.assertRaises(SigningError):
            render_document(document, {'subjectName': 'Certificado ficticio'})

    def document(self, content='Orientacao sintetica para teste.'):
        return dict(patientName='Paciente ficticio', patientCpf='CPF de teste',
                    professionalName='Profissional ficticio', professionalCro='CRO de teste',
                    content=content, date='2026-10-15T12:00:00Z',
                    verificationUrl='https://example.invalid/validar-receita#token=synthetic-layout-test')

    def test_validation_link_is_clickable_and_contains_the_document_token(self):
        document = self.document()
        reader = PdfFileReader(io.BytesIO(render_document(document, {'subjectName': 'Certificado ficticio'})))
        links = [str(annotation.get_object()['/A']['/URI'])
                 for page in reader.root['/Pages']['/Kids']
                 for annotation in page.get_object().get('/Annots', [])
                 if annotation.get_object().get('/Subtype') == '/Link']
        self.assertIn(document['verificationUrl'], links)

    def test_official_logo_is_embedded_on_every_page(self):
        for content in ('Orientacao sintetica.', '\n'.join(['Linha de teste.'] * 180), 'Paragrafo longo. ' * 1800):
            with self.subTest(long_document=len(content) > 100):
                reader = PdfFileReader(io.BytesIO(render_document(self.document(content), {'subjectName': 'Certificado ficticio'})))
                pages = reader.root['/Pages']
                if len(content) > 100:
                    self.assertGreater(pages['/Count'], 1)
                else:
                    self.assertEqual(pages['/Count'], 1)
                for page in pages['/Kids']:
                    resources = page.get_object()['/Resources']
                    images = resources.get('/XObject', {})
                    self.assertTrue(any(obj.get_object()['/Subtype'] == '/Image' for obj in images.values()),
                                    'Official clinic logo missing from prescription page')


if __name__ == '__main__':
    unittest.main()
