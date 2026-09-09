import React from "react";
import { Document, Image, Page, PDFDownloadLink, StyleSheet, Text, View } from "@react-pdf/renderer";

type FinanceReportTransaction = {
    id: number;
    type: "income" | "expense";
    description?: string | null;
    amount: number;
    date: string;
    category?: string | null;
    patient?: { name: string } | null;
};

type FinanceReportStats = {
    income: number;
    expense: number;
    balance?: number;
    monthlyBalance?: number;
    openingBalance?: number;
    closingBalance?: number;
};

interface FinanceReportProps {
    transactions: FinanceReportTransaction[];
    stats: FinanceReportStats;
    reportTitle?: string;
    periodLabel?: string;
    periodKey?: string;
    generatedAt?: Date;
}

const styles = StyleSheet.create({
    page: { backgroundColor: "#ffffff", color: "#0f172a", fontFamily: "Helvetica", padding: 38 },
    header: { borderBottomColor: "#d8ad20", borderBottomWidth: 2, marginBottom: 18, paddingBottom: 14 },
    brand: { color: "#0f172a", fontSize: 17, fontWeight: "bold", marginBottom: 3 },
    brandSubline: { color: "#64748b", fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase" },
    title: { color: "#0f172a", fontSize: 17, fontWeight: "bold", marginBottom: 4 },
    period: { color: "#64748b", fontSize: 10, marginBottom: 4 },
    generatedAt: { color: "#94a3b8", fontSize: 8 },
    summary: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", borderRadius: 8, borderWidth: 1, marginBottom: 18, padding: 12 },
    summaryRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    summaryLabel: { color: "#475569", fontSize: 9 },
    summaryValue: { fontSize: 10, fontWeight: "bold" },
    summaryDivider: { borderTopColor: "#cbd5e1", borderTopWidth: 1, marginBottom: 7, marginTop: 4, paddingTop: 7 },
    table: { borderColor: "#cbd5e1", borderLeftWidth: 1, borderTopWidth: 1, width: "100%" },
    tableRow: { flexDirection: "row" },
    tableHeader: { backgroundColor: "#f1f5f9", color: "#475569", fontSize: 8, fontWeight: "bold", padding: 6, textTransform: "uppercase" },
    tableCell: { borderBottomColor: "#e2e8f0", borderBottomWidth: 1, borderRightColor: "#e2e8f0", borderRightWidth: 1, color: "#334155", fontSize: 8.5, minHeight: 25, padding: 6 },
    dateColumn: { width: "15%" },
    movementColumn: { width: "49%" },
    categoryColumn: { width: "18%" },
    amountColumn: { width: "18%" },
    movementPrimary: { color: "#0f172a", fontSize: 8.5, fontWeight: "bold" },
    movementSecondary: { color: "#64748b", fontSize: 7, marginTop: 2 },
    amount: { fontWeight: "bold", textAlign: "right" },
    footer: { borderTopColor: "#e2e8f0", borderTopWidth: 1, color: "#94a3b8", fontSize: 7, marginTop: 18, paddingTop: 8, textAlign: "center" },
});

const money = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const transactionLabel = (transaction: FinanceReportTransaction) =>
    transaction.patient?.name?.trim() || transaction.description?.trim() || transaction.category?.trim() || "";

const transactionSecondaryLabel = (transaction: FinanceReportTransaction) => {
    const description = transaction.description?.trim();
    const category = transaction.category?.trim();
    if (transaction.patient?.name && description) return description;
    if (transaction.patient?.name && category) return category;
    if (!transaction.patient?.name && description && category) return category;
    return "";
};

const formatDate = (value: Date) => value.toLocaleDateString("pt-BR");

export const FinanceReportDocument = ({
    transactions,
    stats,
    reportTitle = "Relatório Financeiro",
    periodLabel,
    generatedAt = new Date(),
}: FinanceReportProps) => {
    const monthlyBalance = stats.monthlyBalance ?? stats.balance ?? stats.income - stats.expense;
    const openingBalance = stats.openingBalance ?? 0;
    const closingBalance = stats.closingBalance ?? openingBalance + monthlyBalance;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        <Image src="/images/logo-oficial.png" style={{ height: 42, marginRight: 10, objectFit: "contain", width: 42 }} />
                        <View>
                            <Text style={styles.brand}>Núcleo Odontológico</Text>
                            <Text style={styles.brandSubline}>Especializado &amp; Harmonização</Text>
                        </View>
                    </View>
                    <Text style={styles.title}>Fluxo de caixa</Text>
                    <Text style={styles.period}>{periodLabel || reportTitle}</Text>
                    <Text style={styles.generatedAt}>Gerado em {formatDate(generatedAt)}</Text>
                </View>

                <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Receitas recebidas</Text>
                        <Text style={[styles.summaryValue, { color: "#059669" }]}>{money(stats.income)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Despesas realizadas</Text>
                        <Text style={[styles.summaryValue, { color: "#e11d48" }]}>{money(stats.expense)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.summaryDivider]}>
                        <Text style={[styles.summaryLabel, { fontWeight: "bold" }]}>Líquido do mês</Text>
                        <Text style={[styles.summaryValue, { color: monthlyBalance >= 0 ? "#059669" : "#e11d48", fontSize: 11 }]}>{money(monthlyBalance)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Saldo inicial / fechamento anterior</Text>
                        <Text style={styles.summaryValue}>{money(openingBalance)}</Text>
                    </View>
                    <View style={{ ...styles.summaryRow, marginBottom: 0 }}>
                        <Text style={[styles.summaryLabel, { fontWeight: "bold" }]}>Total em conta</Text>
                        <Text style={[styles.summaryValue, { color: "#0f172a", fontSize: 11 }]}>{money(closingBalance)}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View fixed style={styles.tableRow}>
                        <Text style={[styles.tableHeader, styles.dateColumn]}>Data</Text>
                        <Text style={[styles.tableHeader, styles.movementColumn]}>Movimentação</Text>
                        <Text style={[styles.tableHeader, styles.categoryColumn]}>Categoria</Text>
                        <Text style={[styles.tableHeader, styles.amountColumn, { textAlign: "right" }]}>Valor</Text>
                    </View>
                    {transactions.map((transaction) => {
                        const secondaryLabel = transactionSecondaryLabel(transaction);
                        return (
                            <View style={styles.tableRow} key={transaction.id} wrap={false}>
                                <Text style={[styles.tableCell, styles.dateColumn]}>{new Date(transaction.date).toLocaleDateString("pt-BR")}</Text>
                                <View style={[styles.tableCell, styles.movementColumn]}>
                                    <Text style={styles.movementPrimary}>{transactionLabel(transaction)}</Text>
                                    {secondaryLabel && <Text style={styles.movementSecondary}>{secondaryLabel}</Text>}
                                </View>
                                <Text style={[styles.tableCell, styles.categoryColumn]}>{transaction.category?.trim() || ""}</Text>
                                <Text style={[styles.tableCell, styles.amountColumn, styles.amount, { color: transaction.type === "income" ? "#059669" : "#e11d48" }]}>
                                    {transaction.type === "expense" ? "-" : "+"} {money(transaction.amount)}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.footer}>Relatório gerencial interno · Dados referentes ao período selecionado</Text>
            </Page>
        </Document>
    );
};

export interface DownloadFinanceReportButtonProps extends FinanceReportProps {
    label?: React.ReactNode;
}

export const DownloadFinanceReportButton = ({
    transactions,
    stats,
    label = "Exportar PDF",
    reportTitle,
    periodLabel,
    periodKey = "selecionado",
}: DownloadFinanceReportButtonProps) => (
    <PDFDownloadLink
        document={<FinanceReportDocument transactions={transactions} stats={stats} reportTitle={reportTitle} periodLabel={periodLabel} periodKey={periodKey} />}
        fileName={`fluxo-de-caixa-${periodKey}.pdf`}
        className="w-full"
        style={{ textDecoration: "none" }}
    >
        {({ loading }) => loading ? "Gerando..." : label}
    </PDFDownloadLink>
);
