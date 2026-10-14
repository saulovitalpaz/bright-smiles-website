import io
from datetime import datetime
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlsplit

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from certificates import SigningError


class PrescriptionText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)

    def handle_starttag(self, tag, _attributes):
        if tag == 'li':
            self.parts.append('\n• ')
        elif tag == 'br':
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if tag in ('p', 'div', 'li', 'h1', 'h2', 'h3', 'blockquote'):
            self.parts.append('\n')


def plain_text(value):
    parser = PrescriptionText()
    parser.feed(value)
    return ''.join(parser.parts).strip()


def render_document(document, certificate):
    fields = ('patientName', 'patientCpf', 'professionalName', 'professionalCro', 'content', 'date', 'verificationUrl')
    if (not isinstance(document, dict) or any(not isinstance(document.get(key), str) or not document[key].strip() for key in fields)
            or len(document['content']) > 100000
            or any(len(document[key]) > 1024 for key in fields if key != 'content')):
        raise SigningError('INVALID_DOCUMENT', 'Os dados da receita estão incompletos ou acima do limite permitido.')
    url = urlsplit(document['verificationUrl'])
    if url.scheme != 'https' or not url.hostname or not url.fragment.startswith('token='):
        raise SigningError('INVALID_DOCUMENT', 'O endereço de validação da receita é inválido.')
    try:
        issued = datetime.fromisoformat(document['date'].replace('Z', '+00:00')).strftime('%d/%m/%Y')
    except ValueError:
        raise SigningError('INVALID_DOCUMENT', 'A data de emissão é inválida.') from None
    text = plain_text(document['content'])
    if not text:
        raise SigningError('INVALID_DOCUMENT', 'Preencha o conteúdo da receita.')
    output = io.BytesIO()
    pdf = SimpleDocTemplate(output, pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm,
                            topMargin=18 * mm, bottomMargin=18 * mm, title='Receituário odontológico', author='')
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='ClinicTitle', fontSize=16, leading=21, alignment=TA_CENTER,
                              textColor=colors.HexColor('#0f172a'), spaceAfter=6 * mm))
    styles.add(ParagraphStyle(name='ClinicBody', fontSize=11, leading=17, spaceAfter=5 * mm))
    styles.add(ParagraphStyle(name='ClinicSmall', fontSize=8, leading=12, textColor=colors.HexColor('#475569')))
    story = [Paragraph('NÚCLEO ODONTOLÓGICO', styles['ClinicTitle']),
             Paragraph('Receituário odontológico', styles['Heading2']),
             Paragraph('<b>Paciente:</b> ' + escape(document['patientName']), styles['ClinicBody']),
             Paragraph('<b>CPF:</b> ' + escape(document['patientCpf']) + ' &nbsp; <b>Emissão:</b> ' + issued, styles['ClinicBody']),
             Spacer(1, 4 * mm)]
    for line in text.splitlines():
        story.append(Paragraph(escape(line) or '&nbsp;', styles['ClinicBody']))
    qr = QrCodeWidget(document['verificationUrl'])
    left, bottom, right, top = qr.getBounds()
    size = 25 * mm
    drawing = Drawing(size, size, transform=[size / (right - left), 0, 0, size / (top - bottom), 0, 0])
    drawing.add(qr)
    description = [Paragraph('<b>' + escape(document['professionalName']) + '</b>', styles['ClinicBody']),
                   Paragraph(escape(document['professionalCro']), styles['ClinicSmall']),
                   Paragraph('Titular do certificado: ' + escape(certificate['subjectName']), styles['ClinicSmall']),
                   Paragraph('Assinatura digital ICP-Brasil incorporada ao arquivo PDF.', styles['ClinicSmall']),
                   Paragraph('Consulte a autenticidade pelo QR Code ou código abaixo.', styles['ClinicSmall']),
                   Paragraph(escape(url.fragment[6:]), styles['ClinicSmall'])]
    footer = Table([[description, drawing]], colWidths=[135 * mm, 28 * mm])
    footer.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#cbd5e1')),
                               ('TOPPADDING', (0, 0), (-1, -1), 12)]))
    story.extend([Spacer(1, 10 * mm), KeepTogether(footer)])
    pdf.build(story)
    return output.getvalue()
