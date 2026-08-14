import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/types/quote";

const COLORS = {
  navy: "#1a2744",
  aqua: "#bfe3e6",
  success: "#3f9142",
  muted: "#5b6472",
  border: "#d8dee6",
  destructive: "#c23b32",
  background: "#fdfdfb",
  white: "#ffffff",
};

export type QuotePdfClinic = {
  clinic_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type QuotePdfPatient = {
  first_name: string;
  last_name: string;
  document_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type QuotePdfDoctor = {
  full_name: string;
  specialty: string | null;
};

export type QuotePdfItem = {
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  done: boolean;
};

export type QuotePdfData = {
  id: string;
  issue_date: string;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  paid: number;
  balance: number;
  clinic: QuotePdfClinic;
  patient: QuotePdfPatient;
  doctor: QuotePdfDoctor;
  items: QuotePdfItem[];
};

function formatMoney(amount: number, currency: string): string {
  const value = amount.toFixed(2);
  if (currency === "USD") return `$${value}`;
  return `${value} ${currency}`;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function shortRef(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.navy,
    backgroundColor: COLORS.background,
    paddingBottom: 36,
  },
  header: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 28,
    paddingVertical: 18,
  },
  clinicName: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 6,
  },
  headerMeta: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.aqua,
    marginBottom: 2,
  },
  body: {
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  section: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.aqua,
    borderRadius: 4,
    padding: 10,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  col: {
    flex: 1,
  },
  label: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 1,
  },
  value: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.navy,
    marginBottom: 4,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  metaItem: {
    flex: 1,
  },
  table: {
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.navy,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.white,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    backgroundColor: COLORS.aqua,
  },
  tableCell: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.navy,
  },
  colDesc: { width: "38%" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "16%", textAlign: "right" },
  colSub: { width: "16%", textAlign: "right" },
  colStatus: { width: "20%", textAlign: "right" },
  done: {
    color: COLORS.success,
    fontFamily: "Helvetica-Bold",
  },
  pending: {
    color: COLORS.muted,
  },
  totalsBox: {
    alignSelf: "flex-end",
    width: 220,
    backgroundColor: COLORS.aqua,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalsLabel: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.navy,
  },
  totalsValue: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.navy,
  },
  totalsStrong: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.navy,
    marginTop: 2,
  },
  balanceDue: {
    color: COLORS.destructive,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerNotes: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 6,
  },
  footerContact: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.muted,
  },
});

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  const patientName =
    `${data.patient.first_name} ${data.patient.last_name}`.trim() || "—";
  const clinicContacts = [
    data.clinic.phone,
    data.clinic.email,
    data.clinic.address,
  ].filter((v): v is string => Boolean(v && v.trim()));

  const footerContacts = [data.clinic.phone, data.clinic.email].filter(
    (v): v is string => Boolean(v && v.trim())
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.clinicName}>
            {data.clinic.clinic_name?.trim() || "Clínica"}
          </Text>
          {clinicContacts.map((line) => (
            <Text key={line} style={styles.headerMeta}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.body}>
          <View style={styles.row}>
            <View style={[styles.section, styles.col]}>
              <Text style={styles.sectionTitle}>Paciente</Text>
              <Text style={styles.value}>{patientName}</Text>
              {data.patient.document_id ? (
                <>
                  <Text style={styles.label}>Documento</Text>
                  <Text style={styles.value}>{data.patient.document_id}</Text>
                </>
              ) : null}
              {data.patient.phone ? (
                <>
                  <Text style={styles.label}>Teléfono</Text>
                  <Text style={styles.value}>{data.patient.phone}</Text>
                </>
              ) : null}
            </View>

            <View style={[styles.section, styles.col]}>
              <Text style={styles.sectionTitle}>Médico</Text>
              <Text style={styles.value}>{data.doctor.full_name}</Text>
              {data.doctor.specialty ? (
                <>
                  <Text style={styles.label}>Especialidad</Text>
                  <Text style={styles.value}>{data.doctor.specialty}</Text>
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Fecha de emisión</Text>
              <Text style={styles.value}>{formatDate(data.issue_date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Presupuesto</Text>
              <Text style={styles.value}>{shortRef(data.id)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Estado</Text>
              <Text style={styles.value}>
                {QUOTE_STATUS_LABELS[data.status] ?? data.status}
              </Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                Tratamiento
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                P. Unit.
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colSub]}>
                Subtotal
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>
                Estado
              </Text>
            </View>
            {data.items.map((item, index) => (
              <View
                key={`${item.description}-${index}`}
                style={[
                  styles.tableRow,
                  ...(index % 2 === 1 ? [styles.tableRowAlt] : []),
                ]}
              >
                <Text style={[styles.tableCell, styles.colDesc]}>
                  {item.description}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatMoney(item.unit_price, data.currency)}
                </Text>
                <Text style={[styles.tableCell, styles.colSub]}>
                  {formatMoney(item.line_total, data.currency)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colStatus,
                    item.done ? styles.done : styles.pending,
                  ]}
                >
                  {item.done ? "✓ Hecho" : "Pendiente"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatMoney(data.subtotal, data.currency)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                IVA ({(data.tax_rate * 100).toFixed(0)}%)
              </Text>
              <Text style={styles.totalsValue}>
                {formatMoney(data.tax_amount, data.currency)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsStrong}>Total</Text>
              <Text style={styles.totalsStrong}>
                {formatMoney(data.total, data.currency)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Pagado</Text>
              <Text style={styles.totalsValue}>
                {formatMoney(data.paid, data.currency)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text
                style={[
                  styles.totalsLabel,
                  ...(data.balance > 0 ? [styles.balanceDue] : []),
                ]}
              >
                Saldo pendiente
              </Text>
              <Text
                style={[
                  styles.totalsValue,
                  ...(data.balance > 0 ? [styles.balanceDue] : []),
                ]}
              >
                {formatMoney(data.balance, data.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            {data.notes?.trim() ? (
              <Text style={styles.footerNotes}>Notas: {data.notes.trim()}</Text>
            ) : null}
            {footerContacts.length > 0 ? (
              <Text style={styles.footerContact}>
                Contacto: {footerContacts.join(" · ")}
              </Text>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}
