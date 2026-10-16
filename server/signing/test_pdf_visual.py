"""Run with requirements-qa.txt to verify the rendered QR, not just its input."""
import io
import secrets
import unittest
from importlib.util import find_spec

from pdf_document import render_document


@unittest.skipUnless(find_spec('pymupdf') and find_spec('zxingcpp'), 'Install requirements-qa.txt for rendered PDF checks')
class RenderedPrescriptionTests(unittest.TestCase):
    def test_rendered_qr_matches_clickable_link_and_printed_token(self):
        import pymupdf
        import zxingcpp
        from PIL import Image

        for lines in (1, 180):
            with self.subTest(lines=lines):
                token = secrets.token_urlsafe(32)
                url = 'https://www.odontoeharmonizacao.com.br/validar-receita#token=' + token
                document = dict(patientName='Paciente ficticio', patientCpf='CPF de teste',
                                professionalName='Profissional ficticio', professionalCro='CRO de teste',
                                content='Orientacao sintetica.\n' * lines, date='2026-10-15T12:00:00Z',
                                verificationUrl=url)
                pdf = pymupdf.open(stream=render_document(document, {'subjectName': 'Certificado ficticio'}), filetype='pdf')
                links = [link['uri'] for page in pdf for link in page.get_links() if 'uri' in link]
                self.assertIn(url, links)
                text = ''.join(page.get_text() for page in pdf)
                self.assertIn(token, text)
                self.assertIn('https://www.odontoeharmonizacao.com.br/validar-receita', text)
                for zoom in (1.5, 3):
                    codes = []
                    for page in pdf:
                        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
                        bitmap = Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)
                        codes.extend(code.text for code in zxingcpp.read_barcodes(bitmap))
                    self.assertEqual(codes, [url])
                pdf.close()


if __name__ == '__main__':
    unittest.main()
