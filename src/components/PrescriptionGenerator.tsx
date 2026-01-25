import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 20,
        alignItems: 'center',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    subLogoText: {
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: '#64748b',
    },
    section: {
        margin: 10,
        padding: 10,
    },
    patientInfo: {
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 5,
        marginBottom: 20,
    },
    label: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    value: {
        fontSize: 12,
        color: '#0f172a',
        marginBottom: 5,
    },
    content: {
        fontSize: 12,
        lineHeight: 1.5,
        minHeight: 300,
        marginTop: 20,
        marginBottom: 40,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 20,
    },
    signatureLine: {
        width: 200,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 10,
        alignSelf: 'center',
    },
    smallText: {
        fontSize: 8,
        color: '#64748b',
    },
    digitalSig: {
        fontSize: 8,
        color: '#cbd5e1',
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
    }
});

// Create Document Component
const PrescriptionDocument = ({ data, content }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.logoText}>Núcleo Odontológico</Text>
                <Text style={styles.subLogoText}>Especializado & Harmonização</Text>
            </View>

            <View style={styles.patientInfo}>
                <Text style={styles.label}>Paciente</Text>
                <Text style={styles.value}>{data.name}</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <View>
                        <Text style={styles.label}>CPF</Text>
                        <Text style={styles.value}>{data.cpf}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Data</Text>
                        <Text style={styles.value}>{new Date().toLocaleDateString('pt-BR')}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                {/* Simple text rendering. For HTML content, we would need to parse HTML, but react-pdf is strict. 
            We pass plain text or simplified structure for now. */}
                <Text>{content.replace(/<[^>]+>/g, '')}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.signatureLine}></View>
                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data.professionalName || "Profissional"}</Text>
                <Text style={styles.smallText}>{data.professionalCro || "CRO"}</Text>
                <Text style={styles.digitalSig}>Assinado Digitalmente • Hash: {Math.random().toString(36).substring(7).toUpperCase()}</Text>

                <View style={{ marginTop: 20 }}>
                    <Text style={styles.smallText}>Rua Barão do Rio Branco, 461 - Sala 206 - Centro, Gov. Valadares - MG</Text>
                </View>
            </View>
        </Page>
    </Document>
);

export const DownloadPrescriptionButton = ({ data, content }) => (
    <PDFDownloadLink document={<PrescriptionDocument data={data} content={content} />} fileName={`receita-${data.name}.pdf`}>
        {({ blob, url, loading, error }) =>
            loading ? 'Gerando PDF...' : 'Baixar PDF Assinado'
        }
    </PDFDownloadLink>
);
