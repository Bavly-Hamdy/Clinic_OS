import { useState, useEffect } from 'react';
import { Prescription, Patient, Visit, ClinicSettings } from '@/types/clinic';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Printer, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrintPrescriptionButtonProps {
    prescription: Prescription;
    patient: Patient | null;
    visit?: Visit | null;
}

export function PrintPrescriptionButton({
    prescription,
    patient,
    visit,
}: PrintPrescriptionButtonProps) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #print-prescription, #print-prescription * {
                            visibility: visible;
                        }
                        #print-prescription {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 2rem;
                            background: white;
                            color: black;
                            direction: rtl; /* For Arabic */
                        }
                        /* Reset PDF dialogs and overlays */
                        .print-hidden {
                            display: none !important;
                        }
                    }
                `}
            </style>
            
            <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary/40 hover:bg-primary/10 print-hidden"
                onClick={() => setOpen(true)}
                disabled={prescription.items.length === 0}
            >
                <Printer className="h-3.5 w-3.5 me-1.5" />
                {t('workspace.printRx') || 'Print Prescription'}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md print-hidden" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {t('workspace.printRx') || 'Print Prescription'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="rounded-xl border bg-muted/30 p-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                Prescription Summary
                            </p>
                            <div className="space-y-1.5">
                                {prescription.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                            {i + 1}
                                        </span>
                                        <span className="font-medium">{item.drugName} {item.concentration}</span>
                                        <span className="text-muted-foreground text-xs">
                                            · {item.dose} · {item.frequency} · {item.duration}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button className="flex-1" onClick={handlePrint}>
                                <Printer className="h-4 w-4 me-2" />
                                {t('workspace.printRx') || 'Print'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden printable layout */}
            <div id="print-prescription" className="hidden print:block text-black" dir="rtl">
                {/* Minimalist Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    borderBottom: '2px solid #000', 
                    paddingBottom: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>روشتة طبية (Prescription)</h1>
                        <div style={{ fontSize: '1.1rem' }}>
                            <p style={{ marginBottom: '0.25rem' }}><strong>اسم المريض:</strong> {patient?.fullName || '—'}</p>
                            <p><strong>رقم الملف:</strong> {patient?.patientId || (patient as any)?.loginCode || '—'}</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '1.1rem' }}><strong>التاريخ:</strong> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Medications List */}
                <div style={{ width: '100%' }}>
                    <div style={{ borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>الأدوية (Rx)</h2>
                    </div>

                    <div>
                        {prescription.items.map((item, i) => (
                            <div key={i} style={{ 
                                marginBottom: '2rem', 
                                padding: '1rem', 
                                borderBottom: '1px dashed #ccc',
                                pageBreakInside: 'avoid'
                            }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#000', marginBottom: '0.4rem' }}>
                                    {i + 1}. {item.drugName} {item.concentration} - {item.form}
                                </div>
                                <div style={{ fontSize: '1.15rem', paddingRight: '1.5rem', marginBottom: '0.3rem' }}>
                                    {item.dose} 💊 {item.frequency}
                                </div>
                                <div style={{ fontSize: '1.05rem', paddingRight: '1.5rem', color: '#444' }}>
                                    المدة: {item.duration} {item.customNotes && `| ملاحظات: ${item.customNotes}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer simple line */}
                <div style={{ 
                    marginTop: '4rem', 
                    borderTop: '1px solid #eee', 
                    paddingTop: '1rem', 
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    color: '#666'
                }}>
                   توقيع الطبيب ................................
                </div>
            </div>
        </>
    );
}
