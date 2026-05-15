import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ClinicSettings, VisitType, Expense, Payment, ExpenseCategory } from '@/types/clinic';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrichedPayment extends Payment {
    patientName?: string;
    visitType?: VisitType;
    createdAt?: string;
}

interface ShiftData {
    payments: EnrichedPayment[];
    expenses: Expense[];
    totalRevenue: number;
    totalExpenses: number;
    netCash: number;
}

// ─── PDF Styles ───────────────────────────────────────────────────────────────

const c = {
    primary: '#2563eb',
    success: '#16a34a',
    destructive: '#dc2626',
    dark: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    bg: '#f8fafc',
    white: '#ffffff',
};

const s = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: c.dark,
        backgroundColor: c.white,
    },
    header: {
        backgroundColor: c.primary,
        padding: '16 24',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {},
    clinicName: { color: c.white, fontSize: 13, fontFamily: 'Helvetica-Bold' },
    headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 8, marginTop: 2 },
    headerRight: { alignItems: 'flex-end' },
    reportTitle: { color: c.white, fontSize: 11, fontFamily: 'Helvetica-Bold' },
    reportDate: { color: 'rgba(255,255,255,0.8)', fontSize: 8, marginTop: 2 },

    body: { padding: '16 24', flex: 1 },

    // KPI row
    kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    kpiCard: {
        flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 6,
        padding: '10 12', backgroundColor: c.bg,
    },
    kpiLabel: { fontSize: 7, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    kpiValue: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
    kpiGreen: { color: c.success },
    kpiRed: { color: c.destructive },
    kpiBlue: { color: c.primary },

    // Section
    sectionLabel: {
        fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: c.primary,
        textTransform: 'uppercase', letterSpacing: 0.8,
        borderBottomWidth: 1, borderBottomColor: c.primary,
        paddingBottom: 3, marginBottom: 6, marginTop: 14,
    },

    // Table
    tableHead: { flexDirection: 'row', backgroundColor: c.primary, padding: '5 8', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    tableRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 1, borderBottomColor: c.border },
    tableAlt: { backgroundColor: c.bg },
    tableFoot: { flexDirection: 'row', padding: '6 8', borderTopWidth: 2, borderTopColor: c.dark },
    thText: { color: c.white, fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
    tdText: { color: c.dark, fontSize: 8 },
    tdMuted: { color: c.muted, fontSize: 7.5 },

    col0: { width: 20 },
    col1: { flex: 2 },
    col2: { flex: 1.5 },
    col3: { flex: 1, textAlign: 'right' },
    col4: { width: 50 },
    col5: { width: 40 },

    green: { color: c.success, fontFamily: 'Helvetica-Bold' },
    red: { color: c.destructive, fontFamily: 'Helvetica-Bold' },

    // Net strip
    netStrip: {
        borderWidth: 1, borderRadius: 6, padding: '10 14',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16,
    },
    netLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
    netValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },

    // Footer
    footer: {
        borderTopWidth: 1, borderTopColor: c.border,
        backgroundColor: c.bg, padding: '8 24',
        flexDirection: 'row', justifyContent: 'space-between',
    },
    footText: { fontSize: 7, color: c.muted },
    footBold: { fontSize: 7.5, color: c.dark, fontFamily: 'Helvetica-Bold' },
});

// ─── Document ─────────────────────────────────────────────────────────────────

function ShiftClosePDFDocument({
    date,
    shiftData,
    settings,
}: {
    date: string;
    shiftData: ShiftData;
    settings: Partial<ClinicSettings>;
}) {
    const displayDate = format(new Date(`${date}T12:00:00`), 'EEEE, d MMMM yyyy');
    const isProfit = shiftData.netCash >= 0;

    return (
        <Document title={`Shift Close — ${displayDate}`}>
            <Page size="A4" style={s.page}>
                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerLeft}>
                        <Text style={s.clinicName}>{settings.clinicName ?? 'Clinic'}</Text>
                        <Text style={s.headerSub}>{settings.doctorName ?? ''} · {settings.specialty ?? ''}</Text>
                        <Text style={s.headerSub}>{settings.phone ?? ''}</Text>
                    </View>
                    <View style={s.headerRight}>
                        <Text style={s.reportTitle}>Shift Close Report</Text>
                        <Text style={s.reportDate}>{displayDate}</Text>
                        <Text style={[s.reportDate, { marginTop: 4 }]}>
                            Generated: {format(new Date(), 'dd MMM yyyy HH:mm')}
                        </Text>
                    </View>
                </View>

                <View style={s.body}>
                    {/* KPI row */}
                    <View style={s.kpiRow}>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>Total Revenue</Text>
                            <Text style={[s.kpiValue, s.kpiGreen]}>+{shiftData.totalRevenue.toFixed(2)} EGP</Text>
                        </View>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>Total Expenses</Text>
                            <Text style={[s.kpiValue, s.kpiRed]}>-{shiftData.totalExpenses.toFixed(2)} EGP</Text>
                        </View>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>Net Cash</Text>
                            <Text style={[s.kpiValue, isProfit ? s.kpiBlue : s.kpiRed]}>
                                {isProfit ? '+' : ''}{shiftData.netCash.toFixed(2)} EGP
                            </Text>
                        </View>
                    </View>

                    {/* Payments */}
                    {shiftData.payments.length > 0 && (
                        <>
                            <Text style={s.sectionLabel}>Payments ({shiftData.payments.length})</Text>
                            <View style={s.tableHead}>
                                <Text style={[s.thText, s.col0]}>#</Text>
                                <Text style={[s.thText, s.col1]}>Patient</Text>
                                <Text style={[s.thText, s.col2]}>Visit Type</Text>
                                <Text style={[s.thText, s.col3]}>Amount (EGP)</Text>
                                <Text style={[s.thText, s.col4]}>Method</Text>
                                <Text style={[s.thText, s.col5]}>Time</Text>
                            </View>
                            {shiftData.payments.map((p, i) => (
                                <View key={p.id} style={[s.tableRow, i % 2 !== 0 ? s.tableAlt : {}]}>
                                    <Text style={[s.tdMuted, s.col0]}>{i + 1}</Text>
                                    <Text style={[s.tdText, s.col1]}>{p.patientName ?? '—'}</Text>
                                    <Text style={[s.tdMuted, s.col2]}>
                                        {p.visitType ? p.visitType.replace(/_/g, ' ') : '—'}
                                    </Text>
                                    <Text style={[s.green, s.col3]}>+{Number(p.amount).toFixed(2)}</Text>
                                    <Text style={[s.tdMuted, s.col4]}>{p.method}</Text>
                                    <Text style={[s.tdMuted, s.col5]}>
                                        {p.createdAt ? format(new Date(p.createdAt), 'HH:mm') : '—'}
                                    </Text>
                                </View>
                            ))}
                            <View style={s.tableFoot}>
                                <Text style={[s.thText, { flex: 1, color: c.dark }]}>Total Revenue</Text>
                                <Text style={[s.green, s.col3]}>+{shiftData.totalRevenue.toFixed(2)}</Text>
                                <View style={s.col4} /><View style={s.col5} />
                            </View>
                        </>
                    )}

                    {/* Expenses */}
                    {shiftData.expenses.length > 0 && (
                        <>
                            <Text style={s.sectionLabel}>Expenses ({shiftData.expenses.length})</Text>
                            <View style={s.tableHead}>
                                <Text style={[s.thText, s.col0]}>#</Text>
                                <Text style={[s.thText, { flex: 3 }]}>Description</Text>
                                <Text style={[s.thText, s.col2]}>Category</Text>
                                <Text style={[s.thText, s.col3]}>Amount (EGP)</Text>
                            </View>
                            {shiftData.expenses.map((e, i) => (
                                <View key={e.id} style={[s.tableRow, i % 2 !== 0 ? s.tableAlt : {}]}>
                                    <Text style={[s.tdMuted, s.col0]}>{i + 1}</Text>
                                    <Text style={[s.tdText, { flex: 3 }]}>{e.description}</Text>
                                    <Text style={[s.tdMuted, s.col2]}>{e.category}</Text>
                                    <Text style={[s.red, s.col3]}>-{Number(e.amount).toFixed(2)}</Text>
                                </View>
                            ))}
                            <View style={s.tableFoot}>
                                <Text style={[s.thText, { flex: 1, color: c.dark }]}>Total Expenses</Text>
                                <Text style={[s.red, s.col3]}>-{shiftData.totalExpenses.toFixed(2)}</Text>
                            </View>
                        </>
                    )}

                    {/* Net strip */}
                    <View style={[s.netStrip, { borderColor: isProfit ? c.success : c.destructive, backgroundColor: isProfit ? '#f0fdf4' : '#fef2f2' }]}>
                        <Text style={[s.netLabel, { color: isProfit ? c.success : c.destructive }]}>
                            {isProfit ? '✓ Profitable Day' : '✗ Loss Day'} — Net Cash
                        </Text>
                        <Text style={[s.netValue, { color: isProfit ? c.success : c.destructive }]}>
                            {isProfit ? '+' : ''}{shiftData.netCash.toFixed(2)} EGP
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={s.footer} fixed>
                    <View>
                        <Text style={s.footText}>Address</Text>
                        <Text style={s.footBold}>{settings.address ?? '—'}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={s.footText}>Working Hours</Text>
                        <Text style={s.footBold}>{settings.workingHours ?? '—'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.footText}>Receptionist Signature</Text>
                        <Text style={[s.footBold, { borderBottomWidth: 1, borderBottomColor: c.dark, paddingBottom: 2, minWidth: 120 }]}>
                            {'  '}
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

import { pdf } from '@react-pdf/renderer';

export function ShiftClosePDFButton({
    date,
    shiftData,
}: {
    date: string;
    shiftData: ShiftData;
}) {
    const [settings, setSettings] = useState<Partial<ClinicSettings>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        getDoc(doc(db, 'clinic_settings', 'main'))
            .then(snap => { if (snap.exists()) setSettings(snap.data() as ClinicSettings); })
            .catch(console.error);
    }, []);

    const fileName = `shift_close_${date}.pdf`;

    const handleDownload = async () => {
        try {
            setIsGenerating(true);
            const doc = <ShiftClosePDFDocument date={date} shiftData={shiftData} settings={settings} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error("Failed to generate PDF:", error);
            alert(t('common.error') + ':\n\n' + (error.stack || error.message || String(error)));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleDownload} disabled={isGenerating}>
            <Download className="h-4 w-4 me-2" />
            {isGenerating ? t('common.generating') || 'Generating...' : t('common.downloadReport') || 'Download Report'}
        </Button>
    );
}
