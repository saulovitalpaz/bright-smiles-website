import io
from datetime import datetime
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
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
    page_width, page_height = A4
    margin = 40
    width = page_width - 2 * margin
    logo = ImageReader(str(Path(__file__).resolve().parent / 'assets' / 'logo-oficial.png'))

    def page_branding(canvas, _doc):
        canvas.saveState()
        logo_width, logo_height = logo.getSize()
        height = 40
        image_width = height * logo_width / logo_height
        heading = ('NÚCLEO ODONTOLÓGICO', 'ESPECIALIZADO & HARMONIZAÇÃO')
        font_name, font_size = 'Helvetica', 10
        text_width = max(canvas.stringWidth(line, font_name, font_size) for line in heading)
        left = (page_width - image_width - 12 - text_width) / 2
        canvas.drawImage(logo, left, page_height - margin - height,
                         width=image_width, height=height, mask='auto')
        canvas.setFillColor(colors.HexColor('#334155'))
        canvas.setFont(font_name, font_size)
        canvas.drawString(left + image_width + 12, page_height - margin - 16, heading[0])
        canvas.drawString(left + image_width + 12, page_height - margin - 30, heading[1])
        canvas.setStrokeColor(colors.HexColor('#e2e8f0'))
        canvas.line(margin, page_height - 94, page_width - margin, page_height - 94)
        canvas.setFont('Helvetica', 6.5)
        canvas.setFillColor(colors.HexColor('#94a3b8'))
        canvas.drawCentredString(page_width / 2, 30,
                                'Rua Barão do Rio Branco, 461 - Sala 206 - Centro, Governador Valadares - MG')
        canvas.drawRightString(page_width - margin, 18, str(_doc.page))
        canvas.restoreState()

    pdf = SimpleDocTemplate(output, pagesize=A4, rightMargin=margin, leftMargin=margin,
                            topMargin=110, bottomMargin=50, title='Receituário odontológico', author='')
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='ClinicBody', fontName='Helvetica', fontSize=10, leading=15,
                              textColor=colors.HexColor('#0f172a')))
    styles.add(ParagraphStyle(name='ClinicValue', parent=styles['ClinicBody'], fontSize=11, leading=16))
    styles.add(ParagraphStyle(name='ClinicLabel', fontSize=7, leading=11, textColor=colors.HexColor('#64748b')))
    styles.add(ParagraphStyle(name='ClinicSmall', fontSize=7, leading=11, textColor=colors.HexColor('#64748b')))
    patient = Table([
        [Paragraph('PACIENTE', styles['ClinicLabel']), ''],
        [Paragraph(escape(document['patientName']), styles['ClinicValue']), ''],
        [Paragraph('CPF', styles['ClinicLabel']), Paragraph('DATA', styles['ClinicLabel'])],
        [Paragraph(escape(document['patientCpf']), styles['ClinicValue']), Paragraph(issued, styles['ClinicValue'])],
    ], colWidths=[width * 0.7, width * 0.3])
    patient.setStyle(TableStyle([
        ('SPAN', (0, 0), (-1, 0)), ('SPAN', (0, 1), (-1, 1)),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 8), ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    content = Table([[Paragraph(escape(line) or '&nbsp;', styles['ClinicBody'])]
                     for line in text.splitlines()], colWidths=[width], splitInRow=1)
    content.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0'), 1, [3, 2]),
        ('LEFTPADDING', (0, 0), (-1, -1), 12), ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story = [KeepTogether(patient), Spacer(1, 16), content]
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
    footer = Table([[description, drawing]], colWidths=[width - 85, 85])
    footer.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#cbd5e1')),
                               ('TOPPADDING', (0, 0), (-1, -1), 12)]))
    story.extend([Spacer(1, 10 * mm), KeepTogether(footer)])
    pdf.build(story, onFirstPage=page_branding, onLaterPages=page_branding)
    return output.getvalue()
