import {
  Document,
  G,
  Image,
  Page,
  Path,
  PDFDownloadLink,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { ANATOMICAL_GEOMETRY } from "@/components/admin/attendance/odontogram/odontogramGeometry";
import {
  getTooth,
  getToothFamily,
  type ToothData,
} from "@/components/admin/attendance/odontogram/odontogramModel";
import {
  electronicSignatureLabel,
  hasCompleteProfessionalIdentity,
  hasUsableProfessionalSignature,
} from "@/lib/professional-signature";
import {
  getPdfOdontogramSummary,
  htmlToPlainText,
} from "@/lib/prescription-document";
import { mediaUrl } from "@/lib/media";
import type { PrintMode } from "@/lib/print-layout";

const TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const pdfTokens = {
  clinic: { pagePadding: 40, sectionGap: 16, tableCellPadding: 6, bodySize: 10 },
  compact: { pagePadding: 26, sectionGap: 8, tableCellPadding: 3, bodySize: 9 },
} as const;

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 16,
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  subLogoText: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#64748b",
  },
  patientInfo: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 5,
    marginBottom: 16,
  },
  label: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    color: "#0f172a",
    marginBottom: 4,
  },
  content: {
    fontSize: 10,
    lineHeight: 1.5,
    marginTop: 10,
    marginBottom: 18,
    padding: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e2e8f0",
    borderRadius: 6,
  },
  odontogram: {
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
  },
  odontogramTitle: {
    marginBottom: 6,
    fontSize: 8,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  toothRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  toothCell: {
    width: 29,
    alignItems: "center",
  },
  toothNumber: {
    fontSize: 5.5,
    color: "#64748b",
    marginBottom: 1,
  },
  odontogramSummary: {
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  odontogramContinuation: {
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  odontogramSummaryText: {
    fontSize: 6.5,
    lineHeight: 1.35,
    color: "#475569",
    marginBottom: 2,
  },
  footer: {
    marginTop: 18,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 14,
    alignItems: "center",
  },
  signatureImage: {
    width: 150,
    height: 48,
    objectFit: "contain",
    marginBottom: 4,
  },
  signatureLine: {
    width: 180,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    marginBottom: 7,
  },
  professionalName: {
    fontSize: 9,
    fontWeight: 700,
    color: "#0f172a",
  },
  smallText: {
    fontSize: 7,
    color: "#64748b",
  },
  electronicSignature: {
    fontSize: 7,
    color: "#475569",
    marginTop: 6,
  },
  address: {
    marginTop: 12,
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

const STATUS_OVERLAY: Record<ToothData["status"], string> = {
  Saudável: "transparent",
  Ausente: "transparent",
  Implante: "#8b5cf6",
  Ponte: "#f59e0b",
};

function PrescriptionPdfTooth({
  toothNumber,
  data,
}: {
  toothNumber: number;
  data: ToothData;
}) {
  const anatomy = ANATOMICAL_GEOMETRY[getToothFamily(toothNumber)].frontal;
  const viewBoxParts = anatomy.viewBox.split(/\s+/).map(Number);
  const viewBoxHeight = viewBoxParts[3];
  const lower = toothNumber >= 31 && toothNumber <= 48;
  const transform = lower ? `translate(0 ${viewBoxHeight}) scale(1 -1)` : undefined;
  const overlay = STATUS_OVERLAY[data.status];

  return (
    <View style={styles.toothCell}>
      <Text style={styles.toothNumber}>{toothNumber}</Text>
      <Svg viewBox={anatomy.viewBox} width={22} height={36}>
        <G transform={transform}>
          {anatomy.roots.map((root) => (
            <Path key={root} d={root} fill="#ead5aa" stroke="#876544" strokeWidth={0.7} />
          ))}
          <Path d={anatomy.cervical} fill="none" stroke="#c38a7a" strokeWidth={1.5} />
          <Path d={anatomy.crown} fill="#fffdf4" stroke="#766b59" strokeWidth={0.8} />
          {overlay !== "transparent" ? (
            <>
              {anatomy.roots.map((root) => (
                <Path key={`overlay-${root}`} d={root} fill={overlay} opacity={0.38} />
              ))}
              <Path d={anatomy.crown} fill={overlay} opacity={0.38} />
            </>
          ) : null}
          {data.status === "Ausente" ? (
            <>
              <Path d="M10 12 L38 65" stroke="#b42318" strokeWidth={2.2} />
              <Path d="M38 12 L10 65" stroke="#b42318" strokeWidth={2.2} />
            </>
          ) : null}
        </G>
      </Svg>
    </View>
  );
}

export function PrescriptionOdontogramPdf({
  data,
}: {
  data: Record<string, ToothData>;
}) {
  const summary = getPdfOdontogramSummary(data);
  const summaryLead = summary.slice(0, 4);
  const summaryContinuation = summary.slice(4);

  return (
    <View style={styles.odontogram}>
      <View wrap={false}>
        <Text style={styles.odontogramTitle}>Mapeamento dentário</Text>
        <View style={styles.toothRow}>
          {TEETH_UPPER.map((toothNumber) => (
            <PrescriptionPdfTooth
              key={toothNumber}
              toothNumber={toothNumber}
              data={getTooth(data, toothNumber)}
            />
          ))}
        </View>
        <View style={styles.toothRow}>
          {TEETH_LOWER.map((toothNumber) => (
            <PrescriptionPdfTooth
              key={toothNumber}
              toothNumber={toothNumber}
              data={getTooth(data, toothNumber)}
            />
          ))}
        </View>
        {summaryLead.length ? (
          <View style={styles.odontogramSummary}>
            {summaryLead.map((item) => (
              <Text key={item} style={styles.odontogramSummaryText}>{item}</Text>
            ))}
          </View>
        ) : null}
      </View>
      {summaryContinuation.length ? (
        <View style={styles.odontogramContinuation}>
          <Text style={styles.odontogramTitle}>Resumo clínico — continuação</Text>
          {summaryContinuation.map((item) => (
            <Text key={item} style={styles.odontogramSummaryText}>{item}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export interface PrescriptionDocumentProps {
  data: {
    name: string;
    cpf: string;
    professionalName?: string;
    professionalCro?: string;
    signatureUrl?: string | null;
  };
  content: string;
  mode?: PrintMode;
  includeElectronicSignature?: boolean;
  includeOdontogram?: boolean;
  odontogram?: Record<string, ToothData>;
}

export function PrescriptionDocument({
  data,
  content,
  mode = "clinic",
  includeElectronicSignature = false,
  includeOdontogram = false,
  odontogram = {},
}: PrescriptionDocumentProps) {
  const tokens = pdfTokens[mode];
  const professional = {
    name: data.professionalName || "",
    cro: data.professionalCro || "",
    signatureUrl: data.signatureUrl,
  };
  if (!hasCompleteProfessionalIdentity(professional)) {
    throw new Error("Configure nome e CRO antes de gerar o documento.");
  }
  const hasElectronicSignature = includeElectronicSignature
    && hasUsableProfessionalSignature(professional);
  const signatureImage = hasElectronicSignature ? mediaUrl(data.signatureUrl) : null;

  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, padding: tokens.pagePadding }}>
        <View style={{ ...styles.header, marginBottom: tokens.sectionGap, paddingBottom: tokens.sectionGap }}>
          <Text style={styles.logoText}>Núcleo Odontológico</Text>
          <Text style={styles.subLogoText}>Especializado & Harmonização</Text>
        </View>

        <View style={{ ...styles.patientInfo, padding: tokens.tableCellPadding, marginBottom: tokens.sectionGap }} wrap={false}>
          <Text style={styles.label}>Paciente</Text>
          <Text style={styles.value}>{data.name}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 7 }}>
            <View>
              <Text style={styles.label}>CPF</Text>
              <Text style={styles.value}>{data.cpf}</Text>
            </View>
            <View>
              <Text style={styles.label}>Data</Text>
              <Text style={styles.value}>{new Date().toLocaleDateString("pt-BR")}</Text>
            </View>
          </View>
        </View>

        {includeOdontogram && Object.keys(odontogram).length ? (
          <PrescriptionOdontogramPdf data={odontogram} />
        ) : null}

        <View style={{ ...styles.content, fontSize: tokens.bodySize }}>
          <Text style={{ fontSize: tokens.bodySize }}>{htmlToPlainText(content)}</Text>
        </View>

        <View wrap={false} style={{ ...styles.footer, marginTop: tokens.sectionGap }}>
          {signatureImage ? (
            <Image src={signatureImage} style={styles.signatureImage} />
          ) : (
            <View style={styles.signatureLine} />
          )}
          <Text style={styles.professionalName}>{professional.name}</Text>
          {professional.cro ? <Text style={styles.smallText}>{professional.cro}</Text> : null}
          {hasElectronicSignature ? (
            <Text style={styles.electronicSignature}>
              {electronicSignatureLabel(professional)}
            </Text>
          ) : null}
          <Text style={styles.address}>
            Rua Barão do Rio Branco, 461 - Sala 206 - Centro, Governador Valadares - MG
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export type DownloadPrescriptionButtonProps = PrescriptionDocumentProps;

export function DownloadPrescriptionButton(props: DownloadPrescriptionButtonProps) {
  return (
    <PDFDownloadLink
      document={<PrescriptionDocument {...props} />}
      fileName={`receita-${props.data.name}.pdf`}
    >
      {({ loading }) => (loading ? "Gerando PDF..." : "Baixar PDF")}
    </PDFDownloadLink>
  );
}
