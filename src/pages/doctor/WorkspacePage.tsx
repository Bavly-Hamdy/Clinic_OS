import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, query, where, orderBy,
  doc, getDoc, addDoc, updateDoc, serverTimestamp, onSnapshot, limit
} from 'firebase/firestore';
import {
  Appointment,
  Visit,
  VitalSigns,
  PrescriptionItem,
  Drug,
  AllergyWarning,
  DrugAllergy,
  Patient,
  Prescription,
} from '@/types/clinic';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  UserCheck,
  Stethoscope,
  Heart,
  Pill,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Hash,
  History,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CalendarClock,
  Activity,
  Printer,
  Wifi,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInYears } from 'date-fns';
import { arEG } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from "@google/genai";
declare global {
  interface Window {
    _drugsCache: Record<string, Drug[]>;
    _geminiCooldownUntil?: number;
  }
}

// ─── Vitals form ──────────────────────────────────────────────────────────────

function VitalsForm({
  value,
  onChange,
}: {
  value: VitalSigns;
  onChange: (v: VitalSigns) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {(
        [
          { key: 'weight', label: t('workspace.vitals.weight', { defaultValue: 'Weight' }), unit: 'kg' },
          { key: 'bpSystolic', label: t('workspace.vitals.systolic', { defaultValue: 'Systolic' }), unit: 'mmHg' },
          { key: 'bpDiastolic', label: t('workspace.vitals.diastolic', { defaultValue: 'Diastolic' }), unit: 'mmHg' },
          { key: 'sugar', label: t('workspace.vitals.bloodSugar', { defaultValue: 'Blood Sugar' }), unit: 'mg/dL' },
          { key: 'pulse', label: t('workspace.vitals.pulse', { defaultValue: 'Pulse' }), unit: 'bpm' },
        ] as const
      ).map(({ key, label, unit }) => (
        <div key={key} className="space-y-2 bg-background p-3 rounded-2xl border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            {label} 
            <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground/80 lowercase">{unit}</span>
          </Label>
          <Input
            type="number"
            min={0}
            step={0.1}
            placeholder="—"
            value={value[key] ?? ''}
            className="h-10 font-bold text-lg bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-muted/50"
            onChange={(e) =>
              onChange({
                ...value,
                [key]: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          />
        </div>
      ))}
    </div>
  );
}

// ─── Drug search + prescription builder ──────────────────────────────────────

function DrugSearchInput({
  onSelect,
}: {
  onSelect: (drug: Drug) => void;
}) {
  const [query2, setQuery2] = useState('');
  const [suggestions, setSuggestions] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    if (!query2 || query2.length < 2) {
      setSuggestions([]);
      return;
    }

    // Check memory cache first
    const cacheKey = query2.trim().toLowerCase();
    if (window._drugsCache && window._drugsCache[cacheKey]) {
      setSuggestions(window._drugsCache[cacheKey]);
      return;
    }

    // 1. FAST LOCAL DATABASE SEARCH (Real-Time)
    const localDatabase: Drug[] = [
      { id: '1', name: 'Panadol', genericName: 'Paracetamol', concentration: '500mg', form: 'TABLET', isActive: true },
      { id: '2', name: 'Augmentin', genericName: 'Amoxicillin / Clavulanate', concentration: '1g', form: 'TABLET', isActive: true },
      { id: '3', name: 'Brufen', genericName: 'Ibuprofen', concentration: '400mg', form: 'TABLET', isActive: true },
      { id: '4', name: 'Cataflam', genericName: 'Diclofenac Potassium', concentration: '50mg', form: 'TABLET', isActive: true },
      { id: '5', name: 'Concor', genericName: 'Bisoprolol', concentration: '5mg', form: 'TABLET', isActive: true },
      { id: '6', name: 'Glucophage', genericName: 'Metformin', concentration: '1000mg', form: 'TABLET', isActive: true },
      { id: '7', name: 'Nexium', genericName: 'Esomeprazole', concentration: '40mg', form: 'CAPSULE', isActive: true },
      { id: '8', name: 'Aspirin', genericName: 'Acetylsalicylic acid', concentration: '81mg', form: 'TABLET', isActive: true },
      { id: '9', name: 'Zyrtec', genericName: 'Cetirizine', concentration: '10mg', form: 'TABLET', isActive: true },
      { id: '10', name: 'Amoxil', genericName: 'Amoxicillin', concentration: '500mg', form: 'CAPSULE', isActive: true },
      { id: '11', name: 'Ventolin', genericName: 'Salbutamol', concentration: '100mcg', form: 'INHALER', isActive: true },
      { id: '12', name: 'Voltaren', genericName: 'Diclofenac Sodium', concentration: '75mg', form: 'INJECTION', isActive: true },
      { id: '13', name: 'Lantus', genericName: 'Insulin Glargine', concentration: '100U/ml', form: 'INJECTION', isActive: true },
      { id: '14', name: 'Eltroxin', genericName: 'Levothyroxine', concentration: '100mcg', form: 'TABLET', isActive: true },
      { id: '15', name: 'Lipitor', genericName: 'Atorvastatin', concentration: '20mg', form: 'TABLET', isActive: true },
      { id: '16', name: 'Plavix', genericName: 'Clopidogrel', concentration: '75mg', form: 'TABLET', isActive: true },
      { id: '17', name: 'Motilium', genericName: 'Domperidone', concentration: '10mg', form: 'TABLET', isActive: true },
      { id: '18', name: 'Lasix', genericName: 'Furosemide', concentration: '40mg', form: 'TABLET', isActive: true },
      { id: '19', name: 'Capoten', genericName: 'Captopril', concentration: '25mg', form: 'TABLET', isActive: true },
      { id: '20', name: 'Zithromax', genericName: 'Azithromycin', concentration: '250mg', form: 'CAPSULE', isActive: true },
      { id: '21', name: 'Amaryl', genericName: 'Glimepiride', concentration: '2mg', form: 'TABLET', isActive: true },
      { id: '22', name: 'Flagyl', genericName: 'Metronidazole', concentration: '500mg', form: 'TABLET', isActive: true },
      { id: '23', name: 'Telfast', genericName: 'Fexofenadine', concentration: '120mg', form: 'TABLET', isActive: true },
      { id: '24', name: 'Singulair', genericName: 'Montelukast', concentration: '10mg', form: 'TABLET', isActive: true },
      { id: '25', name: 'Cipro', genericName: 'Ciprofloxacin', concentration: '500mg', form: 'TABLET', isActive: true },
      { id: '26', name: 'Aldomet', genericName: 'Methyldopa', concentration: '250mg', form: 'TABLET', isActive: true },
      { id: '27', name: 'Tylenol', genericName: 'Acetaminophen', concentration: '500mg', form: 'TABLET', isActive: true },
      { id: '28', name: 'Keflex', genericName: 'Cephalexin', concentration: '500mg', form: 'CAPSULE', isActive: true },
      { id: '29', name: 'Valium', genericName: 'Diazepam', concentration: '5mg', form: 'TABLET', isActive: true },
      { id: '30', name: 'Dolphin', genericName: 'Diclofenac', concentration: '50mg', form: 'SUPPOSITORY', isActive: true },
      { id: '31', name: 'Xanax', genericName: 'Alprazolam', concentration: '0.5mg', form: 'TABLET', isActive: true },
      { id: '32', name: 'Cemax', genericName: 'Ceftriaxone', concentration: '1g', form: 'INJECTION', isActive: true },
      { id: '33', name: 'Clexane', genericName: 'Enoxaparin', concentration: '4000 IU', form: 'INJECTION', isActive: true },
      { id: '34', name: 'Congestal', genericName: 'Paracetamol/Pseudoephedrine/Chlorpheniramine', concentration: '650mg/60mg/4mg', form: 'TABLET', isActive: true },
      { id: '35', name: 'Comtrex', genericName: 'Acetaminophen/Pseudoephedrine/Brompheniramine', concentration: '500mg/30mg/2mg', form: 'TABLET', isActive: true },
      { id: '36', name: '123', genericName: 'Paracetamol/Pseudoephedrine/Chlorpheniramine', concentration: '500mg/30mg/2mg', form: 'TABLET', isActive: true },
      { id: '37', name: 'Hibiotic', genericName: 'Amoxicillin / Clavulanate', concentration: '1g', form: 'TABLET', isActive: true },
      { id: '38', name: 'Megamox', genericName: 'Amoxicillin / Clavulanate', concentration: '1g', form: 'TABLET', isActive: true },
      { id: '39', name: 'Flumox', genericName: 'Amoxicillin / Flucloxacillin', concentration: '1g', form: 'CAPSULE', isActive: true },
      { id: '40', name: 'Sinemet', genericName: 'Carbidopa/Levodopa', concentration: '25mg/250mg', form: 'TABLET', isActive: true },
      { id: '41', name: 'Euthyrox', genericName: 'Levothyroxine', concentration: '50mcg', form: 'TABLET', isActive: true }
    ];

    const localResults = localDatabase.filter(d => 
      d.name.toLowerCase().includes(cacheKey) || 
      d.genericName.toLowerCase().includes(cacheKey)
    );

    if (localResults.length > 0) {
      setSuggestions(localResults);
      return;
    }

    // 2. FALLBACK TO GEMINI ONLY FOR RARE DRUGS
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          setLoading(false);
          return;
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are a medical assistant. The user is typing a drug name: "${query2}". 
        Provide a JSON array of up to 5 matching real-world medicine names (with standard concentrations if possible). 
        Return ONLY a valid JSON array of strings, nothing else. Example: ["Panadol 500mg", "Pantazol 40mg"]`;

        let parsed: Drug[] = [];
        let success = false;

        const fallbackDrugs = [
          "Panadol 500mg - TABLET", "Pantazol 40mg - TABLET", 
          "Congestal - TABLET", "Dolphin 50mg - SUPPOSITORY", 
          "Augmentin 1g - TABLET", "Amoxicillin 500mg - CAPSULE",
          "Concor 5mg - TABLET", "Cataflam 50mg - TABLET",
          "Brufen 400mg - TABLET", "Nexium 40mg - TABLET"
        ];

        try {
            const response = await ai.models.generateContent({
              model: "gemini-1.5-flash",
              contents: prompt,
            });

            // Parse the JSON array from the response
            const textResponse = (response.text || "").replace(/```json/g, '').replace(/```/g, '').trim();
            const stringArray = JSON.parse(textResponse) as string[];
            
            // Map the simple string array back to the expected Drug interface for the UI
            parsed = stringArray.map((str) => ({
                id: Math.random().toString(36).substring(7),
                name: str,
                genericName: '',
                concentration: '-',
                form: 'OTHER' as any,
                isActive: true
            }));
            
            success = true;
        } catch (error: any) {
            console.warn("Gemini API Rate limit or Error. Using local fallback dictionary.");
            // Gracefully handle 429 Too Many Requests without crashing the UI
            if (error?.status === 429 || error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
              toast({
                  variant: "destructive",
                  title: "الرجاء الانتظار قليلاً",
                  description: "جاري تحميل الأدوية... (النظام يستخدم القائمة البديلة)"
              });
            }
        }

        if (!success || parsed.length === 0) {
            // Fallback logic: filter the static list based on the search query
            const lowerQuery = query2.toLowerCase();
            const matchedFallback = fallbackDrugs.filter(drug => 
              drug.toLowerCase().includes(lowerQuery)
            );
            
            if (matchedFallback.length > 0) {
              setSuggestions(matchedFallback.map(d => ({
                  id: Math.random().toString(36).substring(7),
                  name: d,
                  genericName: '',
                  concentration: '-',
                  form: 'OTHER' as any,
                  isActive: true
              })));
            } else {
               // If completely empty and no fallback matches, offer manual UI
               setSuggestions([{
                  id: Math.random().toString(36).substring(7),
                  name: query2 + ' (Manual Entry)',
                  genericName: 'Add customized drug manually',
                  concentration: '-',
                  form: 'OTHER' as any,
                  isActive: true
              }]);
            }
        } else {
            if (!window._drugsCache) window._drugsCache = {};
            window._drugsCache[cacheKey] = parsed;
            setSuggestions(parsed);
        }
      } catch (err) {
        // Fallback for massive failures
        setSuggestions([{
            id: Math.random().toString(36).substring(7),
            name: query2 + ' (Manual Entry)',
            genericName: 'Add customized drug manually',
            concentration: '-',
            form: 'OTHER' as any,
            isActive: true
        }]);
      } finally {
        setLoading(false);
      }
    }, 600); // Explicity 600ms debounce as requested

    return () => clearTimeout(timer);
  }, [query2]);

  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={t('workspace.searchDrug')}
        className="ps-9"
        value={query2}
        onChange={(e) => setQuery2(e.target.value)}
      />
      {loading && (
        <div className="absolute end-3 top-1/2 -translate-y-1/2">
           <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {(suggestions.length > 0 || (query2.length >= 2 && !loading)) && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-card shadow-elevated overflow-hidden">
          {suggestions.map((drug) => (
            <button
              key={drug.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-start text-sm border-b last:border-0 transition-colors"
              onClick={() => {
                onSelect(drug);
                setQuery2('');
                setSuggestions([]);
              }}
            >
              <Pill className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="font-medium">{drug.name}</span>{' '}
                <span className="text-muted-foreground">
                  {drug.concentration} · {drug.form}
                </span>
                <span className="block text-[10px] text-muted-foreground/60">{drug.genericName}</span>
              </div>
            </button>
          ))}
          
          <button
              type="button"
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-start text-sm transition-colors ${suggestions.length > 0 ? 'border-t bg-muted/30 text-primary' : 'text-foreground'}`}
              onClick={() => {
                onSelect({
                  id: Math.random().toString(36).substring(7),
                  name: query2,
                  genericName: '',
                  concentration: '',
                  form: 'TABLET',
                  isActive: true
                });
                setQuery2('');
                setSuggestions([]);
              }}
            >
              <Plus className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <span className="font-medium">{t('common.add', { defaultValue: 'Add' })} "{query2}"</span>
                <span className="block text-[10px] text-muted-foreground">{t('common.manualEntry', { defaultValue: 'Add manually to prescription' })}</span>
              </div>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Prescription item row ────────────────────────────────────────────────────

function PrescriptionItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: PrescriptionItem;
  index: number;
  onChange: (item: PrescriptionItem) => void;
  onRemove: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  // Helper to split dose into number and unit if possible
  const [doseValue, doseUnit] = item.dose.split(' ');
  const [durationValue, durationUnit] = item.duration.split(' ');

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-5 space-y-4 hover:shadow-md transition-shadow relative group">
      <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 rounded-full filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-black shadow-inner ring-1 ring-primary/20">
            {index + 1}
          </div>
          <div>
            <span className="font-bold text-base text-foreground block">
                {item.drugName} {item.concentration}
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.form}</span>
          </div>
        </div>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        {/* Dose */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('workspace.vitals.dose')}</Label>
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="1"
              value={doseValue || ''}
              className="h-9 rounded-xl text-sm font-medium w-16"
              onChange={(e) => onChange({ ...item, dose: `${e.target.value} ${doseUnit || ''}`.trim() })}
            />
            <Select 
              value={doseUnit || ''} 
              onValueChange={(val) => onChange({ ...item, dose: `${doseValue || '1'} ${val}`.trim() })}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue placeholder={t('common.type')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t('workspace.rxOptions.dose', { returnObjects: true })).map(([k, v]) => (
                  <SelectItem key={k} value={v as string}>{v as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('workspace.vitals.freq')}</Label>
          <Select 
            value={item.frequency} 
            onValueChange={(val) => onChange({ ...item, frequency: val })}
          >
            <SelectTrigger className="h-9 rounded-xl text-xs">
              <SelectValue placeholder={t('workspace.vitals.freq')} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t('workspace.rxOptions.frequency', { returnObjects: true })).map(([k, v]) => (
                <SelectItem key={k} value={v as string}>{v as string}</SelectItem>
              ))}
              <SelectItem value="Custom">{t('common.edit')}</SelectItem>
            </SelectContent>
          </Select>
          {item.frequency === 'Custom' && (
             <Input
               placeholder="e.g. Every 8 hrs"
               className="h-8 mt-1 text-xs rounded-lg"
               onChange={(e) => onChange({ ...item, frequency: e.target.value })}
             />
          )}
        </div>

        {/* Timing */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">{isRtl ? 'التوقيت' : 'Timing'}</Label>
          <Select 
            value={item.timing || ''} 
            onValueChange={(val) => onChange({ ...item, timing: val })}
          >
            <SelectTrigger className="h-9 rounded-xl text-xs">
              <SelectValue placeholder={isRtl ? 'اختر التوقيت' : 'Select Timing'} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t('workspace.rxOptions.timing', { returnObjects: true })).map(([k, v]) => (
                <SelectItem key={k} value={v as string}>{v as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('workspace.vitals.duration')}</Label>
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="7"
              value={durationValue || ''}
              className="h-9 rounded-xl text-sm font-medium w-16"
              onChange={(e) => onChange({ ...item, duration: `${e.target.value} ${durationUnit || ''}`.trim() })}
            />
            <Select 
              value={durationUnit || ''} 
              onValueChange={(val) => onChange({ ...item, duration: `${durationValue || '7'} ${val}`.trim() })}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue placeholder={t('workspace.vitals.duration')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t('workspace.rxOptions.duration', { returnObjects: true })).map(([k, v]) => (
                  <SelectItem key={k} value={v as string}>{v as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('workspace.vitals.notes')}</Label>
          <Input
            placeholder={isRtl ? 'ملاحظات إضافية...' : 'Extra notes...'}
            value={item.customNotes ?? ''}
            className="h-9 rounded-xl text-sm font-medium focus-visible:ring-primary/20"
            onChange={(e) => onChange({ ...item, customNotes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Previous visits history tab ─────────────────────────────────────────────

function PatientHistoryTab({
  patientId,
  effectiveDoctorId,
  onRepeatPrescription,
}: {
  patientId: string;
  effectiveDoctorId: string;
  onRepeatPrescription: (items: PrescriptionItem[]) => void;
}) {
  const { t } = useTranslation();
  const [visits, setVisits] = useState<(Visit & { prescription?: Prescription })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const snap = await getDocs(query(
          collection(db, 'visits'),
          where('patientId', '==', patientId),
          where('doctorId', '==', effectiveDoctorId),
          limit(20),
        ));

        const visitDocs = await Promise.all(
          snap.docs.map(async (d) => {
            const visit = { id: d.id, ...d.data() } as Visit;
            // Fetch this visit's prescription
            const rxSnap = await getDocs(query(
              collection(db, 'prescriptions'),
              where('visitId', '==', d.id),
              limit(1),
            ));
            const prescription = rxSnap.docs[0]
              ? ({ id: rxSnap.docs[0].id, ...rxSnap.docs[0].data() } as Prescription)
              : undefined;
            return { ...visit, prescription };
          })
        );
        
        // In-memory sort since we removed orderBy to avoid index requirement
        visitDocs.sort((a, b) => 
          new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
        );

        setVisits(visitDocs.slice(0, 10));
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [patientId]);

  if (loading) return <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (visits.length === 0) return (
    <div className="flex flex-col items-center py-12 text-center">
      <History className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-muted-foreground font-medium">{t('patientProfile.noVisits', { defaultValue: 'No previous visits' })}</p>
      <p className="text-sm text-muted-foreground/60 mt-1">{t('patientProfile.noVisitsDesc', { defaultValue: 'This patient has no recorded visits yet.' })}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {visits.map((v) => (
        <div key={v.id} className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
          <button
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-start group"
            onClick={() => setExpanded(expanded === v.id ? null : v.id)}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                <Stethoscope className="h-5 w-5 text-primary group-hover:text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {v.startedAt ? format(new Date(v.startedAt), 'dd MMM yyyy, h:mm a') : 'Unknown date'}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5 line-clamp-1 max-w-sm">{v.chiefComplaint || t('patientProfile.noComplaint', { defaultValue: 'No chief complaint recorded' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {v.prescription && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 rounded-lg px-2 py-0.5">
                  <Pill className="h-3.5 w-3.5 me-1" /> Rx
                </Badge>
              )}
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-border transition-colors">
                {expanded === v.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </button>

          {expanded === v.id && (
            <div className="px-5 pb-5 pt-2 border-t border-border/50 space-y-5 bg-muted/10 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-5">
                {v.diagnosis && (
                  <div className="bg-background rounded-xl p-4 border shadow-sm">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
                        <Activity className="h-3 w-3" /> {t('workspace.diagnosis')}
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-foreground">{v.diagnosis}</p>
                  </div>
                )}
                {v.notes && (
                  <div className="bg-background rounded-xl p-4 border shadow-sm">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
                        <History className="h-3 w-3" /> {t('workspace.clinicalNotes')}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{v.notes}</p>
                  </div>
                )}
              </div>
              {v.prescription?.items && v.prescription.items.length > 0 && (
                <div className="bg-primary/5 rounded-xl border border-primary/10 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-1.5">
                       <Pill className="h-3 w-3" /> {t('patientProfile.rxHistory', { defaultValue: 'Prescription History' })}
                    </p>
                    <Button
                      size="sm"
                      className="h-8 text-[11px] font-bold tracking-wide rounded-xl bg-primary text-white shadow-sm hover:scale-105 transition-transform"
                      onClick={() => onRepeatPrescription(v.prescription!.items)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 me-1.5" />
                      {t('patientProfile.repeatRx', { defaultValue: 'REPEAT RX' })}
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {v.prescription.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs rounded-lg bg-background px-3 py-2.5 border shadow-sm">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Pill className="h-3 w-3 text-primary" />
                        </div>
                        <div className="min-w-0">
                           <p className="font-bold truncate text-foreground">{item.drugName} <span className="text-muted-foreground font-medium">{item.concentration}</span></p>
                           <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider mt-0.5">{item.dose} · {item.frequency} · {item.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


function AllergyWarningDialog({
  warnings,
  open,
  onConfirm,
  onCancel,
}: {
  warnings: AllergyWarning[];
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('workspace.vitals.drugWarning', { defaultValue: 'Drug Allergy Warning!' })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('workspace.vitals.drugWarningDesc', { defaultValue: 'The following prescribed drugs match known patient allergies:' })}
          </p>
          {warnings.map((w, i) => (
            <div key={i} className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm font-semibold text-destructive">{w.drug}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Known allergy: {w.allergy.drugName} · Severity: {w.severity} · Reaction: {w.allergy.reaction}
              </p>
            </div>
          ))}
          <p className="text-xs font-medium text-destructive">
            {t('workspace.vitals.proceedWarning', { defaultValue: '⚠ Proceed only if clinically justified. You are taking full responsibility.' })}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>{t('workspace.vitals.cancelRevise', { defaultValue: 'Cancel — Revise' })}</Button>
          <Button variant="destructive" onClick={onConfirm}>{t('workspace.vitals.confirmOverride', { defaultValue: 'Confirm & Override' })}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Queue panel (compact sidebar list) ──────────────────────────────────────

function QueuePanel({ onCallPatient }: { onCallPatient: (appt: Appointment) => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    // Auth Guard: Only attach listener if user is logged in
    if (!isAuthenticated || !user || !user.id) return;

    const today = new Date();
    const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

    const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
    if (!effectiveDoctorId) return;

    // Simplified query: No range filters or orderBy to bypass composite index requirements
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', effectiveDoctorId),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const allAppts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
      
      // FIX 1: Bypass Composite Indexes (In-Memory Filtering & Sorting)
      const startIso = todayStart.toISOString();
      const endIso = todayEnd.toISOString();
      
      const filtered = allAppts.filter(a => 
        (a.scheduledAt >= startIso && a.scheduledAt <= endIso) || a.status === 'IN_CLINIC'
      );
      
      const sorted = filtered.sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      
      setAppointments(sorted);
    }, (err) => {
      console.error('QueuePanel listener error:', err);
    });

    return () => unsubscribe();
  }, [user, isAuthenticated]);

  const waiting = appointments.filter((a) => a.status === 'WAITING');
  const inClinic = appointments.find((a) => a.status === 'IN_CLINIC') ?? null;

  return (
    <div className="space-y-6">
      {/* Current patient */}
      {inClinic && (
        <div className="relative overflow-hidden rounded-2xl border border-info/30 bg-gradient-to-br from-info/20 to-info/5 p-5 shadow-lg group animate-fade-in">
          <div className="absolute top-0 end-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
             <Stethoscope className="h-24 w-24" />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-4">
             <p className="text-xs font-bold text-info uppercase tracking-[0.15em] flex items-center gap-1.5">
               <span className="h-2 w-2 rounded-full bg-info animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
               {t('workspace.currentPatient')}
             </p>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-info to-blue-500 text-white font-bold text-xl shadow-lg ring-2 ring-info/20">
              {((inClinic as any).patientName || inClinic.patient?.fullName || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-extrabold text-lg text-foreground tracking-tight">{(inClinic as any).patientName || inClinic.patient?.fullName}</p>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">Queue <span className="text-info font-bold">#{inClinic.queueNumber}</span> · {inClinic.visitType.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Waiting list */}
      <div className="flex flex-col h-[calc(100vh-280px)]">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            {t('sidebar.waiting')} <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{waiting.length}</span>
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pe-2">
          {waiting.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
              <UserCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">{t('workspace.queueEmpty')}</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-[150px]">{t('workspace.noMorePatients')}</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {waiting.map((a, i) => (
                <div key={a.id} className="group flex items-center gap-4 rounded-2xl bg-card border border-border/50 p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-black shadow-inner">
                    #{a.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{(a as any).patientName || a.patient?.fullName}</p>
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">{a.visitType.replace(/_/g, ' ')}</p>
                  </div>
                  {!inClinic && (
                    <Button
                      size="sm"
                      className="h-8 rounded-xl px-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all bg-primary/10 text-primary hover:bg-primary hover:text-white"
                      onClick={() => onCallPatient(a)}
                    >
                      {t('workspace.call', { defaultValue: 'Call' })}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main workspace ───────────────────────────────────────────────────────────

export default function DoctorWorkspacePage() {
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine effective doctorId for clinical data
  const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;

  const isRtl = i18n.language.startsWith('ar');

  const [activeVisit, setActiveVisit] = useState<{
    appointment: Appointment;
    visit: Visit | null;
    patient: Patient | null;
    allergies: DrugAllergy[];
  } | null>(null);

  const [vitals, setVitals] = useState<VitalSigns>({});
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([]);
  const [rxNotes, setRxNotes] = useState('');
  const [allergyWarnings, setAllergyWarnings] = useState<AllergyWarning[]>([]);
  const [pendingRxPayload, setPendingRxPayload] = useState<object | null>(null);
  const [savedPrescription, setSavedPrescription] = useState<Prescription | null>(null);

  // Restore session on mount
  useEffect(() => {
    let visitUnsubscribe: (() => void) | null = null;

    const restoreSession = async () => {
      if (activeVisit || !isAuthenticated) return;
      try {
        const today = new Date();
        const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

        // Remove the `where scheduledAt` filters to drop the compound index requirement.
        // We will just filter by IN_CLINIC status and filter the results in memory.
        const qToday = query(
          collection(db, 'appointments'),
          where('doctorId', '==', effectiveDoctorId),
          where('status', '==', 'IN_CLINIC')
        );
        const snap = await getDocs(qToday);
        if (snap.empty) return;
        const activeAppts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
        
        // Prioritize today's IN_CLINIC, otherwise take any existing IN_CLINIC
        const todayAppt = activeAppts.find(a => {
          const dt = new Date(a.scheduledAt);
          return dt >= todayStart && dt <= todayEnd;
        }) || activeAppts[0];
        
        if (!todayAppt) return;
        const appt = todayAppt;
        
        const vQ = query(collection(db, 'visits'), where('appointmentId', '==', appt.id), limit(1));
        const vSnap = await getDocs(vQ);
        const visit = vSnap.empty ? null : { id: vSnap.docs[0].id, ...vSnap.docs[0].data() } as Visit;

        const pSnap = await getDoc(doc(db, 'patients', appt.patientId));
        const patient = pSnap.exists() ? { id: pSnap.id, ...pSnap.data() } as Patient : null;
        
        const aSnap = await getDocs(collection(db, 'patients', appt.patientId, 'allergies'));
        const allergies = aSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DrugAllergy[];

        setActiveVisit({ appointment: appt, visit, patient, allergies });
      } catch (e) {
        console.error('Failed to restore workspace session', e);
      }
    };
    restoreSession();
  }, [isAuthenticated]);

  // 1. Snapshot Listener for Real-Time Sync
  useEffect(() => {
    if (!activeVisit?.visit?.id) return;
    const unsubscribe = onSnapshot(doc(db, 'visits', activeVisit.visit.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Prevent overwriting local state if user is typing
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          if (data.vitalSigns) setVitals(data.vitalSigns);
          if (data.chiefComplaint !== undefined) setChiefComplaint(data.chiefComplaint);
          if (data.diagnosis !== undefined) setDiagnosis(data.diagnosis);
          if (data.notes !== undefined) setNotes(data.notes);
          if (data.draftRxItems) setRxItems(data.draftRxItems);
        }
      }
    });
    return () => unsubscribe();
  }, [activeVisit?.visit?.id, setVitals, setChiefComplaint, setDiagnosis, setNotes, setRxItems]);

  // 2. Debounced Auto-Save
  useEffect(() => {
    if (!activeVisit?.visit?.id) return;
    const timer = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'visits', activeVisit.visit.id), {
          chiefComplaint,
          diagnosis,
          notes,
          vitalSigns: vitals,
          draftRxItems: rxItems,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 1500); // 1.5s debounce
    return () => clearTimeout(timer);
  }, [chiefComplaint, diagnosis, notes, vitals, rxItems, activeVisit?.visit?.id]);

  // Call patient → update status to IN_CLINIC, create visit, fetch patient data
  const callPatientMutation = useMutation({
    mutationFn: async (appt: Appointment) => {
      // Determine doctorId
      const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;

      // Update appointment status
      await updateDoc(doc(db, 'appointments', appt.id), { status: 'IN_CLINIC' });
      // Create a visit document
      const visitRef = await addDoc(collection(db, 'visits'), {
        appointmentId: appt.id,
        patientId: appt.patientId,
        doctorId: effectiveDoctorId,
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
      });

      // Fetch patient data + allergies
      const patientSnap = await getDoc(doc(db, 'patients', appt.patientId));
      const patient = patientSnap.exists()
        ? ({ id: patientSnap.id, ...patientSnap.data() } as Patient)
        : null;

      const allergiesSnap = await getDocs(collection(db, 'patients', appt.patientId, 'allergies'));
      const allergies = allergiesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DrugAllergy[];

      return {
        appointment: appt,
        visit: { id: visitRef.id, appointmentId: appt.id, patientId: appt.patientId } as Visit,
        patient,
        allergies,
      };
    },
    onSuccess: ({ appointment, visit, patient, allergies }) => {
      setActiveVisit({ appointment, visit, patient, allergies });
      setVitals({});
      setChiefComplaint('');
      setDiagnosis('');
      setNotes('');
      setRxItems([]);
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
    },
    onError: () => toast({ title: t('common.error'), description: t('workspace.errorCallPatient'), variant: 'destructive' }),
  });

  // Save visit
  const saveVisitMutation = useMutation({
    mutationFn: async () => {
      if (!activeVisit?.visit?.id) return;
      await updateDoc(doc(db, 'visits', activeVisit.visit.id), {
        chiefComplaint,
        diagnosis,
        notes,
        vitalSigns: vitals,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => toast({ title: t('workspace.visitSaved') }),
    onError: () => toast({ title: t('workspace.errorSaveVisit'), variant: 'destructive' }),
  });

  // Complete visit
  const completeVisitMutation = useMutation({
    mutationFn: async () => {
      await saveVisitMutation.mutateAsync();
      await updateDoc(doc(db, 'appointments', activeVisit!.appointment.id), {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
      if (activeVisit?.visit?.id) {
        await updateDoc(doc(db, 'visits', activeVisit.visit.id), {
          completedAt: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      toast({ title: t('workspace.visitCompleted') });
      setActiveVisit(null);
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
    },
  });

  // Save prescription
  const savePrescriptionMutation = useMutation({
    mutationFn: async (payload: object) => {
      const rxPayload = payload as { visitId: string; patientId: string; notes: string; items: PrescriptionItem[] };
      const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;

      const rxRef = await addDoc(collection(db, 'prescriptions'), {
        ...rxPayload,
        doctorId: effectiveDoctorId,
        createdAt: new Date().toISOString(),
      });
      return { id: rxRef.id, ...rxPayload, doctorId: effectiveDoctorId, createdAt: new Date().toISOString() } as Prescription;
    },
    onSuccess: (rx) => {
      toast({ 
        title: t('workspace.rxSavedTitle'), 
        description: t('workspace.rxSavedDesc') 
      });
      setSavedPrescription(rx);
      setAllergyWarnings([]);
      setPendingRxPayload(null);
    },
    onError: () => {
      toast({ title: t('workspace.errorSaveRx'), variant: 'destructive' });
    },
  });

  // ── Drug allergy check before saving prescription ────────────────────────
  function handleSavePrescription(acknowledge = false) {
    if (!activeVisit?.visit) return;

    // Cross-check drugs against known patient allergies
    if (!acknowledge && activeVisit.allergies.length > 0) {
      const warnings: AllergyWarning[] = [];
      rxItems.forEach(item => {
        activeVisit.allergies.forEach(allergy => {
          if (item.drugName.toLowerCase().includes(allergy.drugName.toLowerCase()) ||
            allergy.drugName.toLowerCase().includes(item.drugName.toLowerCase())) {
            warnings.push({ drug: item.drugName, allergy, severity: allergy.severity });
          }
        });
      });
      if (warnings.length > 0) {
        setAllergyWarnings(warnings);
        setPendingRxPayload({
          visitId: activeVisit.visit.id,
          patientId: activeVisit.appointment.patientId,
          notes: rxNotes,
          items: rxItems,
        });
        return; // Stop — show warning dialog first
      }
    }

    const payload = {
      visitId: activeVisit.visit.id,
      patientId: activeVisit.appointment.patientId,
      notes: rxNotes,
      items: rxItems,
      acknowledgedWarnings: acknowledge,
    };
    setPendingRxPayload(payload);
    savePrescriptionMutation.mutate(payload);
  }

  function handleRepeatPrescription(items: PrescriptionItem[]) {
    setRxItems(items.map(item => ({ ...item, customNotes: item.customNotes ?? '' })));
    toast({ title: 'Prescription repeated', description: `${items.length} drug(s) loaded into builder.` });
  }

  function handleDrugSelect(drug: Drug) {
    setRxItems((prev) => [
      ...prev,
      {
        drugId: drug.id,
        drugName: drug.name,
        concentration: drug.concentration,
        form: drug.form,
        dose: '',
        frequency: '',
        duration: '',
        customNotes: '',
      },
    ]);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full print:block">
      {/* Left: Queue panel */}
      <div className="w-full lg:w-80 shrink-0 space-y-6 print:hidden">
        <div className="glass-card p-5 rounded-3xl sticky top-4">
            <div className="mb-6 space-y-3">
              <h2 className={`text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 ${isRtl ? 'text-end' : ''}`}>{t('workspace.queueTitle')}</h2>
              <p className={`text-sm font-medium text-muted-foreground mt-1 ${isRtl ? 'text-end' : ''}`}>
                  {format(new Date(), 'EEEE, d MMM yyyy', { locale: isRtl ? arEG : undefined })}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full rounded-xl border-info/20 bg-info/5 text-info hover:bg-info/10 transition-all font-bold h-9"
                onClick={() => {
                  const url = `${window.location.origin}/track`;
                  navigator.clipboard.writeText(url);
                  toast({ title: t('common.linkCopied', { defaultValue: 'Link Copied!' }), description: url });
                }}
              >
                <Wifi className="h-4 w-4 me-2" />
                {t('queuePage.shareLink', { defaultValue: 'Share Link' })}
              </Button>
            </div>
            <QueuePanel onCallPatient={(a) => callPatientMutation.mutate(a)} />
        </div>
      </div>

      {/* Right: Active visit */}
      <div className="flex-1 min-w-0">
        {!activeVisit ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center glass-card rounded-3xl p-10 relative overflow-hidden group border-dashed border-2 border-border/50 hover:border-primary/30 transition-colors print:hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
                <div className="h-28 w-28 rounded-full bg-muted flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 shadow-inner ring-8 ring-background">
                    <Stethoscope className="h-12 w-12 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">{t('workspace.idleTitle')}</h3>
                <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {t('workspace.idleDesc')}
                </p>
            </div>
            <Activity className="absolute -end-20 -bottom-20 h-96 w-96 text-primary/5 rtl:-scale-x-100 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            {/* Patient Header */}
            <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md print:hidden">
              <div className="absolute top-0 end-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-info text-white font-black text-2xl shadow-lg ring-4 ring-primary/20">
                    {((activeVisit as any).appointment?.patientName ||
                      activeVisit.patient?.fullName || '?')
                      .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground">
                      {activeVisit.patient?.fullName || (activeVisit.appointment as any).patientName || 'Patient'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {activeVisit.patient?.patientId && (
                          <Badge variant="outline" className="font-mono bg-muted/50 border-border">ID: {activeVisit.patient.patientId}</Badge>
                      )}
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{t(`common.visitTypes.${activeVisit.appointment.visitType}`)}</Badge>
                      <span className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" /> {t('trackPage.queueNo', { num: activeVisit.appointment.queueNumber })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl h-12 px-6 shadow-sm border-border/50 hover:bg-muted"
                    onClick={() => saveVisitMutation.mutate()}
                    disabled={saveVisitMutation.isPending}
                  >
                    {t('workspace.saveDraft')}
                  </Button>
                  <Button
                    className="rounded-xl h-12 px-6 bg-gradient-to-r from-success to-emerald-600 hover:from-success/90 hover:to-emerald-600/90 text-white shadow-lg shadow-success/20 font-bold"
                    onClick={() => completeVisitMutation.mutate()}
                    disabled={completeVisitMutation.isPending}
                  >
                    <CheckCircle2 className="h-5 w-5 me-2" />
                    {t('workspace.completeVisit')}
                  </Button>
                </div>
              </div>

              {/* Drug Allergy Banner */}
              {activeVisit.allergies && activeVisit.allergies.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
                  <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-destructive">⚠ {t('workspace.drugAllergyAlert')}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {activeVisit.allergies.map((a) => (
                        <Badge
                          key={a.id}
                          variant="outline"
                          className={`text-xs border ${a.severity === 'SEVERE'
                            ? 'border-destructive text-destructive bg-destructive/10'
                            : a.severity === 'MODERATE'
                              ? 'border-orange-500 text-orange-600 bg-orange-50'
                              : 'border-yellow-500 text-yellow-700 bg-yellow-50'
                            }`}
                        >
                          {a.drugName} ({a.severity})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Tabs defaultValue="clinical" className="w-full">
              <TabsList className="w-full h-14 bg-muted/50 p-1 rounded-2xl print:hidden">
                <TabsTrigger value="clinical" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold transition-all p-0 flex-1 h-full"><span className="flex items-center justify-center gap-2 px-4 py-2"><Activity className="h-4 w-4" />{t('workspace.clinicalNotes', 'Clinical Notes')}</span></TabsTrigger>
                <TabsTrigger value="vitals" className="flex-1 rounded-xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Activity className="h-4 w-4 me-2" />
                  {t('workspace.vitalsTab', 'Vital Signs')}
                </TabsTrigger>
                <TabsTrigger value="prescription" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold transition-all p-0 flex-1 h-full"><span className="flex items-center justify-center gap-2 px-4 py-2"><Pill className="h-4 w-4" />{t('workspace.rx', 'Rx')}</span></TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold transition-all p-0 flex-1 h-full"><span className="flex items-center justify-center gap-2 px-4 py-2"><History className="h-4 w-4" />{t('workspace.history', 'History')}</span></TabsTrigger>
              </TabsList>

              {/* Clinical Notes */}
              <TabsContent value="clinical" className="mt-6 space-y-5 animate-fade-in print:hidden">
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">{t('workspace.chiefComplaint', 'Chief Complaint')}</Label>
                  <Textarea
                    rows={2}
                    placeholder={t('workspace.chiefComplaintDesc', 'Describe patient\'s main complaint in detail…')}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="resize-none rounded-2xl bg-card border-border/50 focus-visible:ring-primary/20 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">{t('workspace.diagnosis', 'Diagnosis')}</Label>
                  <Textarea
                    rows={2}
                    placeholder={t('workspace.diagnosisDesc', 'Enter final or provisional diagnosis…')}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="resize-none rounded-2xl bg-card border-border/50 focus-visible:ring-primary/20 text-base font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">{t('workspace.additionalNotes', 'Additional Notes')}</Label>
                  <Textarea
                    rows={3}
                    placeholder={t('workspace.additionalNotesDesc', 'Treatment plan, advice, follow-up recommendations…')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none rounded-2xl bg-card border-border/50 focus-visible:ring-primary/20"
                  />
                </div>
              </TabsContent>

              {/* Vital Signs */}
              <TabsContent value="vitals" className="mt-6 animate-fade-in print:hidden">
                <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
                  <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <Heart className="h-5 w-5 text-destructive animate-pulse" />
                      {t('workspace.vitalsTrack', 'Patient Vitals Track')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <VitalsForm value={vitals} onChange={setVitals} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prescription */}
              <TabsContent value="prescription" className="mt-4 space-y-4 print:hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    {t('workspace.prescriptionBuilder')}
                  </h3>
                </div>

                <DrugSearchInput onSelect={handleDrugSelect} />

                {rxItems.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed py-10 text-center">
                    <Pill className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t('workspace.searchDrugsEmpty')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rxItems.map((item, i) => (
                      <PrescriptionItemRow
                        key={i}
                        item={item}
                        index={i}
                        onChange={(updated) =>
                          setRxItems((prev) =>
                            prev.map((x, idx) => (idx === i ? updated : x)),
                          )
                        }
                        onRemove={() =>
                          setRxItems((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      />
                    ))}
                  </div>
                )}

                {rxItems.length > 0 && (
                  <>
                    <div className="space-y-1.5">
                      <Label>{t('workspace.rxNotesLabel')}</Label>
                      <Textarea
                        rows={2}
                        placeholder={t('workspace.rxNotesPlaceholder')}
                        value={rxNotes}
                        onChange={(e) => setRxNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSavePrescription(false)}
                        disabled={savePrescriptionMutation.isPending}
                        className="flex-1"
                      >
                        {savePrescriptionMutation.isPending ? t('workspace.saving') : t('workspace.savePrescription')}
                      </Button>
                      {savedPrescription && (
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl h-10 border-primary/40 text-primary hover:bg-primary/5"
                          onClick={() => window.print()}
                        >
                          <Printer className="h-4 w-4 me-2" />
                          {t('workspace.printRx', 'Print Prescription')}
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {/* Previously saved prescription print button */}
                {savedPrescription && rxItems.length === 0 && (
                  <div className="rounded-xl border border-success/30 bg-success/5 p-4 print:hidden">
                    <p className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('workspace.rxSaved')}
                    </p>
                    <Button
                      variant="outline"
                      className="rounded-xl h-10 border-success/40 text-success hover:bg-success/5"
                      onClick={() => window.print()}
                    >
                      <Printer className="h-4 w-4 me-2" />
                      {t('workspace.printRx', 'Print Prescription')}
                    </Button>
                  </div>
                )}
              </TabsContent>
              {/* History tab */}
              <TabsContent value="history" className="mt-4 print:hidden">
                <PatientHistoryTab
                  patientId={activeVisit.appointment.patientId}
                  effectiveDoctorId={effectiveDoctorId!}
                  onRepeatPrescription={(items) => {
                    handleRepeatPrescription(items);
                    // Switch to prescription tab programmatically is not trivial with Radix;
                    // user sees toast and can click Prescription tab
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Allergy warning modal */}
      <AllergyWarningDialog
        warnings={allergyWarnings}
        open={allergyWarnings.length > 0}
        onConfirm={() => {
          if (pendingRxPayload) {
            savePrescriptionMutation.mutate({ ...(pendingRxPayload as object), acknowledgedWarnings: true });
          }
        }}
        onCancel={() => {
          setAllergyWarnings([]);
          setPendingRxPayload(null);
        }}
      />

      {/* PRINT ONLY VIEW (Customized for pre-printed stationery) */}
      {activeVisit && (
        <div className="hidden print:block print:relative print:bg-white print:text-black print:px-12 print:pt-40 print:pb-32 min-h-screen" dir="ltr">
          {/* Patient Header Grid */}
          <div className="space-y-6 mb-12 border-b-2 border-black pb-8">
            <div className="flex justify-between items-center text-lg">
              <div className="flex gap-2 items-center flex-1">
                <span className="font-bold whitespace-nowrap">Name :</span>
                <div className="border-b border-dotted border-black flex-1 pb-1 px-4 min-h-[28px]">
                   {activeVisit.patient?.fullName || (activeVisit.appointment as any).patientName || 'Unknown'}
                </div>
              </div>
              <div className="flex gap-2 items-center w-48 ms-8">
                <span className="font-bold">Age:</span>
                <div className="border-b border-dotted border-black flex-1 pb-1 px-2 text-center min-h-[28px]">
                  {activeVisit.patient?.dateOfBirth ? differenceInYears(new Date(), new Date(activeVisit.patient.dateOfBirth)) : '---'}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-lg">
              <div className="flex gap-2 items-center flex-1">
                <span className="font-bold">Date:</span>
                <div className="border-b border-dotted border-black flex-1 pb-1 px-4 min-h-[28px]">
                  {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
              <div className="flex gap-2 items-center flex-[1.2] ms-8">
                <span className="font-bold">Diagnosis:</span>
                <div className="border-b border-dotted border-black flex-1 pb-1 px-4 min-h-[28px]">
                  {diagnosis || '---'}
                </div>
              </div>
            </div>
          </div>

          {/* Rx Symbol */}
          <div className="mb-8">
            <span className="text-6xl font-serif italic text-black">Rx</span>
          </div>

          {/* Medications List */}
          <div className="space-y-10 ps-12">
            {(rxItems.length > 0 ? rxItems : (savedPrescription?.items || [])).map((drug, index) => (
              <div key={index} className="flex justify-between items-start group min-h-[70px]">
                {/* Left: Drug Info (English) */}
                <div className="flex-1">
                  <h4 className="text-xl font-black uppercase tracking-tight">
                    {drug.drugName} {drug.concentration}
                  </h4>
                  <p className="text-base text-gray-700 italic mt-0.5 uppercase">
                    {drug.form}
                  </p>
                </div>

                {/* Right: Instructions (Arabic) */}
                <div className="flex-1 text-right" dir="rtl">
                   <div className="space-y-1">
                      <p className="text-xl font-bold text-black leading-relaxed">
                        {drug.dose} {drug.frequency}
                      </p>
                      <p className="text-lg font-medium text-gray-800">
                        {drug.timing} {drug.timing && drug.duration ? '·' : ''} {drug.duration}
                      </p>
                      {drug.customNotes && (
                        <p className="text-base text-gray-600 mt-0.5">{drug.customNotes}</p>
                      )}
                   </div>
                </div>
              </div>
            ))}

            {rxItems.length === 0 && !savedPrescription && (
              <p className="text-center text-gray-400 py-20 italic">No medications recorded.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
