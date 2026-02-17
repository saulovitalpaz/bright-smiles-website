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
    title: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 20,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row"
    },
    tableCol: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColDesc: {
        width: "40%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: 5,
        fontSize: 10
    },
    tableHeader: {
        margin: 5,
        fontSize: 10,
        fontWeight: 'bold'
    },
    summary: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    summaryValue: {
        fontSize: 12,
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

interface Transaction {
    id: number;
    type: "income" | "expense";
    description: string;
    amount: number;
    date: string;
    category: string;
}

interface FinanceReportProps {
    transactions: Transaction[];
    stats: {
        income: number;
        expense: number;
        balance: number;
    };
    reportTitle?: string;
}

// Create Document Component
export const FinanceReportDocument = ({ transactions, stats, reportTitle = "Relatório Financeiro" }: FinanceReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    {/* Logo Image - assuming public path */}
                    <Image src="/images/logo-oficial.png" style={{ width: 50, height: 50, marginRight: 10 }} />
                    <View>
                        <Text style={{ ...styles.logoText, fontSize: 16 }}>Núcleo Odontológico</Text>
                        <Text style={styles.subLogoText}>Especializado & Harmonização</Text>
                    </View>
                </View>
            </View>

            <Text style={{ ...styles.title, fontSize: 14 }}>{reportTitle}</Text>
            <Text style={{ fontSize: 9, textAlign: 'center', marginBottom: 15, color: '#64748b' }}>
                Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </Text>

            {/* Summary Section */}
            <View style={styles.summary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Receita Total:</Text>
                    <Text style={[styles.summaryValue, { color: '#059669' }]}>
                        R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Despesas Totais:</Text>
                    <Text style={[styles.summaryValue, { color: '#e11d48' }]}>
                        R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
                <View style={{ ...styles.summaryRow, marginTop: 10, borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 5 }}>
                    <Text style={styles.summaryLabel}>Saldo Líquido:</Text>
                    <Text style={[styles.summaryValue, { fontWeight: 'bold', color: stats.balance >= 0 ? '#059669' : '#e11d48' }]}>
                        R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            </View>

            {/* Transactions Table */}
            <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: '#f1f5f9' }]}>
                    <View style={styles.tableCol}>
                        <Text style={styles.tableHeader}>Data</Text>
                    </View>
                    <View style={styles.tableColDesc}>
                        <Text style={styles.tableHeader}>Descrição</Text>
                    </View>
                    <View style={styles.tableCol}>
                        <Text style={styles.tableHeader}>Categoria</Text>
                    </View>
                    <View style={styles.tableCol}>
                        <Text style={styles.tableHeader}>Valor</Text>
                    </View>
                </View>

                {transactions.map((t) => (
                    <View style={styles.tableRow} key={t.id}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>{new Date(t.date).toLocaleDateString('pt-BR')}</Text>
                        </View>
                        <View style={styles.tableColDesc}>
                            <Text style={styles.tableCell}>{t.description}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>{t.category}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, { color: t.type === 'income' ? '#059669' : '#e11d48' }]}>
                                {t.type === 'expense' ? '-' : '+'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={styles.smallText}>Relatório Gerencial Interno</Text>
                <Text style={styles.digitalSig}>Hash: {Math.random().toString(36).substring(7).toUpperCase()}</Text>
            </View>
        </Page>
    </Document>
);

export const DownloadFinanceReportButton = ({ transactions, stats, label = "Exportar PDF", reportTitle }: any) => (
    <PDFDownloadLink
        document={<FinanceReportDocument transactions={transactions} stats={stats} reportTitle={reportTitle} />}
        fileName={`relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`}
        className="w-full"
        style={{ textDecoration: 'none' }}
    >
        {({ blob, url, loading, error }) =>
            loading ? 'Gerando...' : label
        }
    </PDFDownloadLink>
);
