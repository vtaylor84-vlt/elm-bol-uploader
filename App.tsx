import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getFileRejectionReason,
  isHeicFile,
  HEIC_BLOCK_MESSAGE,
  UPLOAD_FORMAT_HINT,
} from './utils/uploadFileRules.ts';

/**
 * ELM CONNECT — ORACLE UI PASS
 * - Restores auto-carrier from selected load
 * - Manual entry uses carrier dropdown only
 * - Removes manual Load # and Load ID entry
 * - Improves scanning state after driver selection
 * - Fixes Review Transmission availability 
 * - Keeps duplicate load numbers as selectable legs
 * - Uses loadId when returned by backend
 */

interface FileWithPreview {
  file: File | Blob;
  preview: string;
  id: string;
  category: 'bol' | 'freight';
  fingerprint: string;
}

interface VaultEntry {
  id: string;
  timestamp: number;
  payload: any;
}

interface AvailableLoad {
  loadId?: string;
  loadNumber?: string;
  origin: string;
  destination: string;
  status?: string;
  company?: string;
  companyCode?: string;
}

interface DriverOption {
  value: string;
  label: string;
}

type EventType = 'PICKUP' | 'DELIVERY' | '';
type Stage = 'EVENT' | 'OPERATOR' | 'ASSIGNMENT' | 'EVIDENCE' | 'REVIEW';
type ManualCarrierOption = '' | 'BST Expedite Inc' | 'Greenleaf Xpress' | 'Other Carrier';

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxQwhSs6p01gLRgqW0mA-_qtJEFcvEiJebTqSlzNCxgRE8X7Rv_BYm_Th_saL6QQsQj/exec';

// ----------------------------
// AUDIO
// ----------------------------
const playOpenSound = () => {
  try {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    master.connect(ctx.destination);

    const n1 = ctx.createOscillator();
    n1.type = 'triangle';
    n1.frequency.setValueAtTime(587, now);
    n1.connect(master);
    n1.start(now);
    n1.stop(now + 0.08);

    const n2 = ctx.createOscillator();
    n2.type = 'triangle';
    n2.frequency.setValueAtTime(784, now + 0.05);
    n2.connect(master);
    n2.start(now + 0.05);
    n2.stop(now + 0.18);

    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1568, now + 0.05);
    shimmerGain.gain.setValueAtTime(0.0001, now + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.012, now + 0.06);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(now + 0.05);
    shimmer.stop(now + 0.16);
  } catch (e) {}
};

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode_failed'));
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1800;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > MAX) {
            h *= MAX / w;
            w = MAX;
          }
        } else {
          if (h > MAX) {
            w *= MAX / h;
            h = MAX;
          }
        }

        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = 'contrast(1.08) brightness(1.03)';
          ctx.drawImage(img, 0, 0, w, h);
        }

        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error('encode_failed'));
              return;
            }
            resolve(b);
          },
          'image/jpeg',
          0.82
        );
      };
    };
  });
};

const toTitleCaseName = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const normalizeDriverEntry = (entry: any): DriverOption | null => {
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    return {
      value: trimmed.toUpperCase(),
      label: toTitleCaseName(trimmed)
    };
  }

  if (entry && typeof entry === 'object') {
    const raw =
      entry.driverName ||
      entry.name ||
      entry.displayName ||
      entry.label ||
      entry.value ||
      '';
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    return {
      value: trimmed.toUpperCase(),
      label: toTitleCaseName(trimmed)
    };
  }

  return null;
};

const getCarrierDisplayName = (rawCompany?: string) => {
  const code = String(rawCompany || '').trim().toUpperCase();
  if (code === 'BST') return 'BST Expedite Inc';
  if (code === 'GLX') return 'Greenleaf Xpress';
  return String(rawCompany || '').trim();
};

const getLoadIdentity = (load: AvailableLoad) => {
  const explicit = String(load.loadId || '').trim();
  if (explicit) return explicit;

  return [
    String(load.loadNumber || '').trim().toUpperCase(),
    String(load.origin || '').trim().toUpperCase(),
    String(load.destination || '').trim().toUpperCase(),
    String(load.status || '').trim().toUpperCase(),
    String(load.companyCode || load.company || '').trim().toUpperCase()
  ].join('|');
};

const getFileFingerprint = (file: File) =>
  `${file.name}|${file.size}|${file.lastModified}`;

const selectedLoadDiag = (load: AvailableLoad | null) => {
  if (!load) return null;
  return {
    loadId: String(load.loadId || '').trim() || null,
    loadNumber: String(load.loadNumber || '').trim() || null,
  };
};

const logUiDiag = (label: string, details: Record<string, unknown> = {}) => {
  console.log('[ui-diag]', label, JSON.stringify(details));
};

// ----------------------------
// BRANDING
// ----------------------------
const GreenleafLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 animate-in fade-in duration-1000">
    <svg
      width="100%"
      height="auto"
      className="max-w-[400px]"
      viewBox="0 0 600 320"
      fill="none"
    >
      <defs>
        <linearGradient id="chrome-silver" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#BDC3C7" />
          <stop offset="50%" stopColor="#7F8C8D" />
          <stop offset="100%" stopColor="#DDE4E8" />
        </linearGradient>
        <linearGradient id="leaf-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8E063" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient
          id="road-view"
          x1="300"
          y1="180"
          x2="300"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#111111" />
          <stop offset="1" stopColor="#444444" />
        </linearGradient>
      </defs>
      <path
        d="M300 50L100 200H500L300 50Z"
        fill="url(#road-view)"
        stroke="url(#chrome-silver)"
        strokeWidth="4"
      />
      <path
        d="M300 190V175M300 160V150M300 135V130"
        stroke="white"
        strokeWidth="4"
        opacity="0.6"
      />
      <path
        d="M300 20C300 20 230 50 230 100C230 140 300 150 300 150C300 150 370 140 370 100C370 50 300 20 300 20Z"
        fill="url(#leaf-green)"
      />
      <text
        x="300"
        y="250"
        textAnchor="middle"
        style={{
          fontFamily: 'Arial Black',
          fontSize: '44px',
          fontWeight: '900',
          fill: 'url(#chrome-silver)',
          fontStyle: 'italic'
        }}
      >
        GREENLEAF XPRESS
      </text>
      <text
        x="300"
        y="285"
        textAnchor="middle"
        style={{
          fontFamily: 'Arial Black',
          fontSize: '32px',
          fontWeight: '900',
          fill: '#62df62'
        }}
      >
        LLC
      </text>
    </svg>
  </div>
);

const BstLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 w-full animate-in fade-in duration-700">
    <svg width="320" height="120" viewBox="0 0 400 120">
      <defs>
        <linearGradient id="bst-metal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <text
        x="200"
        y="75"
        textAnchor="middle"
        style={{
          fontSize: '95px',
          fill: 'url(#bst-metal)',
          fontFamily: 'Arial Black',
          fontWeight: '900',
          fontStyle: 'italic'
        }}
      >
        BST
      </text>
      <text
        x="200"
        y="110"
        textAnchor="middle"
        style={{
          fontSize: '16px',
          fill: '#93c5fd',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          letterSpacing: '8px'
        }}
      >
        EXPEDITE INC
      </text>
    </svg>
  </div>
);

const ConnectingGlyph = ({ accentClass }: { accentClass: string }) => (
  <div className="relative w-44 h-44 flex items-center justify-center">
    <div className={`absolute inset-0 rounded-full border ${accentClass} opacity-20 animate-ping`} />
    <div className={`absolute inset-5 rounded-full border ${accentClass} opacity-40 animate-pulse`} />
    <div className={`absolute inset-11 rounded-full border ${accentClass} opacity-80`} />
    <div className={`text-4xl font-black tracking-[0.2em] ${accentClass}`}>ELM</div>
  </div>
);

const App: React.FC = () => {
  // Core
  const [isLocked, setIsLocked] = useState(true);
  const [solarMode, setSolarMode] = useState(false);
  const [authStage, setAuthStage] = useState(0);

  // Flow
  const [eventType, setEventType] = useState<EventType>('');
  const [currentStage, setCurrentStage] = useState<Stage>('EVENT');
  const [driverName, setDriverName] = useState('');
  const [manualMode, setManualMode] = useState(false);

  // Driver / carrier
  const [driverList, setDriverList] = useState<DriverOption[]>([]);
  const [company, setCompany] = useState('');
  const [manualCarrier, setManualCarrier] = useState<ManualCarrierOption>('');

  // Loads
  const [availableLoads, setAvailableLoads] = useState<AvailableLoad[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<AvailableLoad | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadSelectionError, setLoadSelectionError] = useState(false);

  // Route fields
  const [bolNum, setBolNum] = useState('');
  const [loadId, setLoadId] = useState('');
  const [puCity, setPuCity] = useState('');
  const [puState, setPuState] = useState('');
  const [delCity, setDelCity] = useState('');
  const [delState, setDelState] = useState('');
  const [bolProtocol, setBolProtocol] = useState<EventType>('');

  // Evidence / submission
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [showFreightPrompt, setShowFreightPrompt] = useState(false);
  const [showFreightConfirm, setShowFreightConfirm] = useState(false);
  const [freightNotRequired, setFreightNotRequired] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showUploadFailure, setShowUploadFailure] = useState(false);
  const [uploadFailureMessage, setUploadFailureMessage] = useState('');
  const [uploadSavedLocally, setUploadSavedLocally] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  type ReviewEditCard = 'event' | 'carrier' | 'pickup' | 'destination' | 'bol' | null;
  const [reviewEditCard, setReviewEditCard] = useState<ReviewEditCard>(null);
  const [reviewDraft, setReviewDraft] = useState({
    eventType: '' as EventType,
    manualCarrier: '' as ManualCarrierOption,
    puCity: '',
    puState: '',
    delCity: '',
    delState: '',
    bolNum: '',
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const freightCamRef = useRef<HTMLInputElement>(null);
  const freightFileRef = useRef<HTMLInputElement>(null);
  const selectedLoadRef = useRef<AvailableLoad | null>(null);

  selectedLoadRef.current = selectedLoad;

  const assignedLoadNumber = String(selectedLoad?.loadNumber || '').trim();

  const states = [
    'AL','AR','AZ','CA','CO','CT','DE','FL','GA','IA','ID','IL','IN','KS','KY',
    'LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM',
    'NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA',
    'WI','WV','WY'
  ];

    const selectedLoadCarrier = getCarrierDisplayName(
    selectedLoad?.companyCode || selectedLoad?.company
  );

  const effectiveCompany = manualMode
    ? manualCarrier === 'Other Carrier'
      ? 'Other Carrier'
      : manualCarrier
    : selectedLoadCarrier || company;

  const confirmedCarrierLabel =
    getCarrierDisplayName(
      selectedLoad?.companyCode || selectedLoad?.company || company
    ) ||
    company ||
    'Carrier not listed';

  const selectedCarrierCode = String(
    selectedLoad?.companyCode || selectedLoad?.company || effectiveCompany || ''
  )
    .trim()
    .toUpperCase();

  const themeMode = useMemo<'blue' | 'green' | 'neutral'>(() => {
    if (
      selectedCarrierCode === 'BST' ||
      effectiveCompany === 'BST Expedite Inc'
    ) {
      return 'blue';
    }

    if (
      selectedCarrierCode === 'GLX' ||
      effectiveCompany === 'Greenleaf Xpress'
    ) {
      return 'green';
    }

    return 'neutral';
  }, [selectedCarrierCode, effectiveCompany]);

  const themeHex =
    themeMode === 'green'
      ? '#22c55e'
      : themeMode === 'blue'
        ? '#3b82f6'
        : '#6366f1';

  const themeBorderClass =
    themeMode === 'green'
      ? 'border-green-500/40'
      : themeMode === 'blue'
        ? 'border-blue-500/40'
        : 'border-zinc-700';

  const themeBgClass =
    themeMode === 'green'
      ? 'bg-green-500/10'
      : themeMode === 'blue'
        ? 'bg-blue-500/10'
        : 'bg-zinc-900/50';

  const themeTextClass =
    themeMode === 'green'
      ? 'text-green-400'
      : themeMode === 'blue'
        ? 'text-blue-400'
        : 'text-zinc-300';

  const hasManualAssignmentData = !!(
    puCity &&
    puState &&
    delCity &&
    delState &&
    effectiveCompany &&
    effectiveCompany !== 'Other Carrier'
  );

  const hasAssignment = !!(selectedLoad || hasManualAssignmentData);

  const hasBolEvidence = uploadedFiles.some((f) => f.category === 'bol');

  const hasRouteData = !!(
    selectedLoad ||
    (puCity && puState && delCity && delState)
  );

  const isReady = !!(
    effectiveCompany &&
    effectiveCompany !== 'Other Carrier' &&
    driverName &&
    eventType &&
    bolNum.trim() &&
    hasRouteData &&
    hasBolEvidence &&
    hasAssignment
  );

  useEffect(() => {
    logUiDiag('state_changed', {
      currentStage,
      isScanning,
      isConnecting,
      manualMode,
      loadSelectionError,
      selectedLoad: selectedLoadDiag(selectedLoad),
      availableLoadsLength: availableLoads.length,
      hasManualAssignmentData,
      hasAssignment,
      isReady,
    });
  }, [
    currentStage,
    isScanning,
    isConnecting,
    manualMode,
    loadSelectionError,
    selectedLoad,
    availableLoads.length,
    hasManualAssignmentData,
    hasAssignment,
    isReady,
  ]);

  const stageOrder: Stage[] = [
    'EVENT',
    'OPERATOR',
    'ASSIGNMENT',
    'EVIDENCE',
    'REVIEW'
  ];

  const stageLabels: Record<Stage, string> = {
    EVENT: 'EVENT SELECTED',
    OPERATOR: 'OPERATOR IDENTIFIED',
    ASSIGNMENT: 'LOAD LINKED',
    EVIDENCE: 'DOCUMENT CAPTURE',
    REVIEW: 'VALIDATION'
  };

  const currentStageIndex = stageOrder.indexOf(currentStage);

  const inpStyle = (v: string) =>
    `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none ${
      solarMode
        ? v
          ? 'bg-zinc-50 border-zinc-900 text-black'
          : 'bg-white border-zinc-200 text-zinc-400'
        : v
          ? 'bg-black border-zinc-600 text-white shadow-lg'
          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
    }`;

  const confirmedFieldStyle = solarMode
    ? 'w-full p-5 rounded-2xl font-mono text-sm border-2 outline-none bg-zinc-50 border-zinc-900 text-black shadow-sm'
    : 'w-full p-5 rounded-2xl font-mono text-sm border-2 outline-none bg-black border-zinc-600 text-white shadow-lg';

  const reviewCarrierDisplay =
    (selectedLoad ? confirmedCarrierLabel : effectiveCompany) || 'Carrier not listed';

  const openReviewEdit = (card: Exclude<ReviewEditCard, null>) => {
    if (card === 'carrier' && carrierLockedFromDispatch) {
      return;
    }
    setReviewDraft({
      eventType: (eventType || 'PICKUP') as EventType,
      manualCarrier: (manualCarrier || reviewCarrierDisplay || '') as ManualCarrierOption,
      puCity,
      puState,
      delCity,
      delState,
      bolNum,
    });
    setReviewEditCard((current) => (current === card ? null : card));
  };

  const cancelReviewEdit = () => setReviewEditCard(null);

  const confirmReviewEdit = () => {
    if (reviewEditCard === 'event' && reviewDraft.eventType) {
      setEventType(reviewDraft.eventType);
      setBolProtocol(reviewDraft.eventType);
    }
    if (reviewEditCard === 'carrier' && reviewDraft.manualCarrier) {
      setManualCarrier(reviewDraft.manualCarrier);
      setCompany(reviewDraft.manualCarrier);
    }
    if (reviewEditCard === 'pickup') {
      setPuCity(reviewDraft.puCity.toUpperCase());
      setPuState(reviewDraft.puState.toUpperCase());
    }
    if (reviewEditCard === 'destination') {
      setDelCity(reviewDraft.delCity.toUpperCase());
      setDelState(reviewDraft.delState.toUpperCase());
    }
    if (reviewEditCard === 'bol') {
      setBolNum(reviewDraft.bolNum.trim());
    }
    setReviewEditCard(null);
  };

  const reviewGlassPanel = 'bg-zinc-900/70 backdrop-blur-md border border-zinc-700/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]';
  const reviewCompactInput = solarMode
    ? 'w-full p-3 rounded-xl font-mono text-sm border border-zinc-300 bg-white text-black outline-none focus:ring-2 focus:ring-blue-500/40'
    : 'w-full p-3 rounded-xl font-mono text-sm border border-zinc-700 bg-black/80 text-white outline-none focus:ring-2 focus:ring-blue-500/40';

  const premiumPanel = solarMode
    ? 'rounded-[1.75rem] border border-zinc-200/90 bg-white/95 backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
    : 'rounded-[1.75rem] border border-zinc-700/55 bg-zinc-900/80 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.45)]';

  const driverFlowSteps: { stage: Stage; label: string }[] = [
    { stage: 'EVENT', label: 'Event' },
    { stage: 'OPERATOR', label: 'Driver' },
    { stage: 'ASSIGNMENT', label: 'Load' },
    { stage: 'EVIDENCE', label: 'Documents' },
    { stage: 'REVIEW', label: 'Review' },
  ];

  const activeFlowIndex = showVerification ? 4 : currentStageIndex;
  const bolPhotoCount = uploadedFiles.filter((f) => f.category === 'bol').length;
  const freightPhotoCount = uploadedFiles.filter((f) => f.category === 'freight').length;
  const hasFreightPhotos = freightPhotoCount > 0;
  const showFreightWaived = freightNotRequired && !hasFreightPhotos;
  const freightDocumentComplete = showFreightWaived || hasFreightPhotos;
  const documentProgressTotal = eventType === 'PICKUP' ? 2 : 1;
  const documentProgressDone =
    (hasBolEvidence && bolNum.trim() ? 1 : 0) +
    (eventType === 'PICKUP' && freightDocumentComplete ? 1 : 0);
  const carrierLockedFromDispatch = Boolean(selectedLoad);

  const returnToFreightDocuments = () => {
    setReviewEditCard(null);
    setShowVerification(false);
    setCurrentStage('EVIDENCE');
  };

  const reopenFreightWaiverChoice = () => {
    setFreightNotRequired(false);
  };

  const accentRing =
    themeMode === 'green'
      ? 'ring-green-500/35 shadow-[0_0_20px_rgba(34,197,94,0.18)]'
      : themeMode === 'blue'
        ? 'ring-blue-500/35 shadow-[0_0_20px_rgba(59,130,246,0.22)]'
        : 'ring-zinc-600/35';

  const renderFlowStepper = () => (
    <div className={`${premiumPanel} p-4`}>
      <div className="flex items-center justify-between gap-1">
        {driverFlowSteps.map((step, idx) => {
          const done = idx < activeFlowIndex;
          const active = idx === activeFlowIndex;
          return (
            <div key={step.stage} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="flex items-center w-full">
                {idx > 0 ? (
                  <div
                    className={`h-px flex-1 ${done || active ? (themeMode === 'green' ? 'bg-green-500/50' : 'bg-blue-500/50') : 'bg-zinc-800'}`}
                  />
                ) : (
                  <div className="flex-1" />
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 transition-all ${
                    active
                      ? `bg-blue-600 text-white ${accentRing} ring-2`
                      : done
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/35'
                        : 'bg-zinc-950 text-zinc-600 border border-zinc-800'
                  }`}
                >
                  {done ? '✓' : active ? idx + 1 : idx + 1}
                </div>
                {idx < driverFlowSteps.length - 1 ? (
                  <div
                    className={`h-px flex-1 ${done ? (themeMode === 'green' ? 'bg-green-500/50' : 'bg-blue-500/50') : 'bg-zinc-800'}`}
                  />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <span
                className={`text-[7px] font-black uppercase tracking-[0.12em] truncate w-full text-center ${
                  active ? themeTextClass : done ? 'text-zinc-500' : 'text-zinc-700'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderVerifiedSummary = (
    title: string,
    value: string,
    onChange?: () => void
  ) => (
    <div
      className={`${premiumPanel} p-4 flex items-center justify-between gap-3 animate-in fade-in duration-300 ${accentRing} ring-1`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-green-600/15 border border-green-500/40 flex items-center justify-center text-green-400 text-sm font-black shrink-0">
          ✓
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500">
            {title}
          </p>
          <p className="text-sm font-bold text-white uppercase tracking-tight truncate">
            {value}
          </p>
        </div>
      </div>
      {onChange ? (
        <button
          type="button"
          onClick={onChange}
          className="shrink-0 text-[8px] font-black uppercase tracking-widest text-blue-400 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 active:scale-95"
        >
          Change
        </button>
      ) : null}
    </div>
  );

  const renderAssignmentLoadRef = () => {
    if (selectedLoad && assignedLoadNumber) {
      return (
        <p className="text-[9px] font-mono text-zinc-600 normal-case tracking-normal">
          Load #{' '}
          <span className="text-zinc-400">{assignedLoadNumber}</span>
        </p>
      );
    }
    if (!selectedLoad && (manualMode || hasManualAssignmentData)) {
      return (
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">
          Manual assignment
        </p>
      );
    }
    return null;
  };

  const resetFlowFromEvent = (nextEvent: EventType) => {
    logUiDiag('resetFlowFromEvent', { nextEvent, clearsSelectedLoad: true });
    setEventType(nextEvent);
    setBolProtocol(nextEvent);
    setCurrentStage('OPERATOR');

    setDriverName('');
    setManualMode(false);

    setAvailableLoads([]);
    setSelectedLoad(null);
    setIsScanning(false);
    setIsConnecting(false);
    setLoadSelectionError(false);

    setCompany('');
    setManualCarrier('');
    setBolNum('');
    setLoadId('');
    setPuCity('');
    setPuState('');
    setDelCity('');
    setDelState('');

    setUploadedFiles([]);
    setShowFreightPrompt(false);
    setShowFreightConfirm(false);
    setFreightNotRequired(false);
    setShowVerification(false);
    setEditingField(null);
    setFullImage(null);
  };

  const clearSelectedLoadButKeepDriver = () => {
    logUiDiag('clearSelectedLoadButKeepDriver', {
      clearsSelectedLoad: true,
      setsCurrentStage: 'ASSIGNMENT',
    });
    setSelectedLoad(null);
    setBolNum('');
    setLoadId('');
    setPuCity('');
    setPuState('');
    setDelCity('');
    setDelState('');
    setCompany('');
    setUploadedFiles([]);
    setShowFreightPrompt(false);
    setShowFreightConfirm(false);
    setFreightNotRequired(false);
    setIsConnecting(false);
    setCurrentStage('ASSIGNMENT');
  };

  const buildSubmissionPayload = (
    files: { category: string; base64: unknown }[]
  ) => {
    const payloadLoadNum = assignedLoadNumber || 'NA';
    const payloadLoadId = selectedLoad
      ? String(selectedLoad.loadId || '').trim()
      : String(loadId || '').trim();

    return {
      company: effectiveCompany,
      driverName,
      loadNum: payloadLoadNum,
      bolNum: bolNum.trim(),
      loadId: payloadLoadId,
      puCity,
      puState,
      delCity,
      delState,
      origin: `${puCity} ${puState}`,
      destination: `${delCity} ${delState}`,
      bolProtocol: eventType,
      files,
    };
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getDrivers`);
        const data = await response.json();

        if (Array.isArray(data)) {
          const normalized = data
            .map(normalizeDriverEntry)
            .filter(Boolean) as DriverOption[];
          setDriverList(normalized);
        } else {
          setDriverList([]);
        }
      } catch (err) {
        console.error('Roster Handshake Failed', err);
        setDriverList([]);
      }
    };

    fetchDrivers();
  }, []);

  useEffect(() => {
    const scanForLoads = async () => {
      const skipped =
        !driverName ||
        !eventType ||
        manualMode ||
        Boolean(selectedLoadRef.current);

      logUiDiag('scanForLoads_start', {
        driverNameSet: Boolean(driverName),
        eventType: eventType || null,
        manualMode,
        selectedLoad: selectedLoadDiag(selectedLoadRef.current),
        skipped,
      });

      if (skipped) {
        return;
      }

      setIsScanning(true);
      setLoadSelectionError(false);
      setAvailableLoads([]);
      setCurrentStage('ASSIGNMENT');

      try {
        const response = await fetch(
          `${GOOGLE_SCRIPT_URL}?action=getDriverLoads&driver=${encodeURIComponent(
            driverName
          )}&type=${eventType}`
        );
        const data = await response.json();

        if (selectedLoadRef.current) {
          logUiDiag('scanForLoads_end', {
            success: true,
            skippedAfterFetch: true,
          });
          return;
        }

        if (Array.isArray(data)) {
          setAvailableLoads(data);
          if (data.length === 0) setLoadSelectionError(true);
          logUiDiag('scanForLoads_end', {
            success: true,
            availableLoadsLength: data.length,
            loadSelectionError: data.length === 0,
          });
        } else {
          setAvailableLoads([]);
          setLoadSelectionError(true);
          logUiDiag('scanForLoads_end', {
            success: false,
            reason: 'non_array_response',
            availableLoadsLength: 0,
            loadSelectionError: true,
          });
        }
      } catch (err) {
        console.error('Radar Link Failure', err);
        if (!selectedLoadRef.current) {
          setAvailableLoads([]);
          setLoadSelectionError(true);
        }
        logUiDiag('scanForLoads_end', {
          success: false,
          reason: 'fetch_failed',
          availableLoadsLength: 0,
          loadSelectionError: true,
        });
      } finally {
        setIsScanning(false);
      }
    };

    scanForLoads();
  }, [driverName, eventType, manualMode]);

  useEffect(() => {
    const willAdvanceFromSelectedLoad = !!(selectedLoad && !manualMode);
    const willAdvanceFromManual =
      (manualMode || loadSelectionError) &&
      hasManualAssignmentData &&
      !selectedLoad;
    const willAdvanceToEvidence =
      willAdvanceFromSelectedLoad || willAdvanceFromManual;

    logUiDiag('assignment_advance_effect', {
      manualMode,
      loadSelectionError,
      hasManualAssignmentData,
      selectedLoad: selectedLoadDiag(selectedLoad),
      willAdvanceFromSelectedLoad,
      willAdvanceFromManual,
      willAdvanceToEvidence,
    });

    if (willAdvanceToEvidence) {
      setCurrentStage('EVIDENCE');
    }
  }, [manualMode, loadSelectionError, hasManualAssignmentData, selectedLoad]);

  const handleLoadSelection = (load: AvailableLoad) => {
    logUiDiag('handleLoadSelection', {
      load: selectedLoadDiag(load),
      currentStage,
      isScanning,
      isConnecting,
      manualMode,
      loadSelectionError,
    });

    const carrierName = getCarrierDisplayName(load.companyCode || load.company);
    const puParts = String(load.origin || '')
      .split(',')
      .map((p) => p.trim());
    const delParts = String(load.destination || '')
      .split(',')
      .map((p) => p.trim());

    setSelectedLoad(load);
    setLoadId(String(load.loadId || '').trim());
    setBolNum('');

    setPuCity((puParts[0] || '').toUpperCase());
    setPuState((puParts[1] || '').toUpperCase());
    setDelCity((delParts[0] || '').toUpperCase());
    setDelState((delParts[1] || '').toUpperCase());

    setCompany(carrierName || '');
    setLoadSelectionError(false);
    setIsConnecting(false);
  };

  const onFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    cat: 'bol' | 'freight'
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      for (const f of files) {
        const rejection = getFileRejectionReason(f);
        if (rejection) {
          window.alert(rejection);
          continue;
        }

        const fingerprint = getFileFingerprint(f);
        if (uploadedFiles.some((item) => item.fingerprint === fingerprint)) {
          window.alert('This photo is already attached.');
          continue;
        }

        try {
          const enh = await compressImage(f);
          let duplicateAfterCompress = false;
          setUploadedFiles((prev) => {
            if (prev.some((item) => item.fingerprint === fingerprint)) {
              duplicateAfterCompress = true;
              return prev;
            }
            return [
              ...prev,
              {
                file: enh,
                preview: URL.createObjectURL(enh),
                id: Math.random().toString(),
                category: cat,
                fingerprint,
              },
            ];
          });
          if (duplicateAfterCompress) {
            window.alert('This photo is already attached.');
            continue;
          }
          if (cat === 'freight') {
            setFreightNotRequired(false);
          }
        } catch {
          window.alert(isHeicFile(f) ? HEIC_BLOCK_MESSAGE : 'Could not process this photo. Use JPG or PNG.');
        }
      }

      if (
        cat === 'bol' &&
        eventType === 'PICKUP' &&
        !freightNotRequired &&
        !uploadedFiles.some((f) => f.category === 'freight')
      ) {
        setTimeout(() => setShowFreightPrompt(true), 500);
      }
    }

    e.target.value = '';
  };

  const renderStagePill = (stage: Stage, idx: number) => {
    const isActive = currentStage === stage;
    const isComplete = currentStageIndex > idx;

    return (
      <div
        key={stage}
        className={`flex-1 min-w-0 rounded-2xl border px-3 py-3 text-center transition-all ${
          isActive
            ? `${themeBorderClass} ${themeBgClass} ${themeTextClass}`
            : isComplete
              ? solarMode
                ? 'border-zinc-300 bg-zinc-100 text-zinc-700'
                : 'border-zinc-700 bg-zinc-900/50 text-zinc-300'
              : solarMode
                ? 'border-zinc-200 bg-white text-zinc-400'
                : 'border-zinc-900 bg-black/30 text-zinc-600'
        }`}
      >
        <div className="text-[8px] font-black uppercase tracking-[0.25em]">
          {stageLabels[stage]}
        </div>
      </div>
    );
  };

  const renderAssignmentPanel = () => {
    const panelBase = `space-y-3 animate-in fade-in duration-500`;

    if (!eventType || !driverName) return null;

    if (hasAssignment && currentStage !== 'ASSIGNMENT' && !isScanning && !isConnecting) {
      return (
        <section className="space-y-3">
          <div className="px-1">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
              Step 3 of 5
            </p>
          </div>
          {renderVerifiedSummary(
            'Load confirmed',
            `${puCity}, ${puState} → ${delCity}, ${delState}`,
            () => setCurrentStage('ASSIGNMENT')
          )}
          <div className="text-center space-y-1 px-2">
            {renderAssignmentLoadRef()}
            <p className="text-[9px] text-zinc-500 normal-case">{reviewCarrierDisplay}</p>
          </div>
        </section>
      );
    }

    return (
      <section className={panelBase}>
        <div className="px-1">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
            Step 3 of 5
          </p>
          <h3 className="text-lg font-black uppercase tracking-tight text-white">
            Select Your Load
          </h3>
        </div>

        <div className={`${premiumPanel} p-4`}>
        <div className="flex justify-between items-center mb-4 gap-4">
          {isScanning && (
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  themeMode === 'green' ? 'bg-green-500' : 'bg-blue-500'
                }`}
              />
              <span
                className={`text-[8px] font-black uppercase ${
                  themeMode === 'green' ? 'text-green-500' : 'text-blue-500'
                }`}
              >
                Finding your load...
              </span>
            </div>
          )}
        </div>

        {isScanning ? (
          <div className="min-h-[340px] rounded-[2rem] border-2 border-dashed border-zinc-800 bg-black/30 flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-500">
            <ConnectingGlyph
              accentClass={
                themeMode === 'green'
                  ? 'border-green-500 text-green-400'
                  : 'border-blue-500 text-blue-400'
              }
            />
            <div
              className={`mt-6 text-xl font-black uppercase tracking-[0.35em] ${
                themeMode === 'green' ? 'text-green-400' : 'text-blue-400'
              }`}
            >
              Connecting to dispatch...
            </div>
            <div className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 max-w-md leading-relaxed">
              Matching your active loads
            </div>
          </div>
        ) : isConnecting ? (
          <div className="min-h-[340px] rounded-[2rem] border-2 border-dashed border-zinc-800 bg-black/30 flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-500">
            <ConnectingGlyph
              accentClass={
                themeMode === 'green'
                  ? 'border-green-500 text-green-400'
                  : themeMode === 'blue'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-cyan-500 text-cyan-400'
              }
            />
            <div
              className={`mt-6 text-xl font-black uppercase tracking-[0.35em] ${
                themeMode === 'green'
                  ? 'text-green-400'
                  : themeMode === 'blue'
                    ? 'text-blue-400'
                    : 'text-cyan-400'
              }`}
            >
              ELM IS CONNECTING
            </div>
            <div className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 max-w-md leading-relaxed">
              Preparing your assignment
            </div>
          </div>
        ) : selectedLoad ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div
              className={`p-6 rounded-[2rem] border-2 space-y-4 ${themeBorderClass} ${themeBgClass}`}
            >
              <div
                className={`text-[10px] font-black uppercase tracking-[0.3em] ${themeTextClass}`}
              >
                Load confirmed
              </div>

              <div className="grid grid-cols-4 gap-4">
                <input
                  readOnly
                  className={`${confirmedFieldStyle} col-span-3`}
                  value={puCity}
                  aria-label="Pickup city"
                />
                <input
                  readOnly
                  className={confirmedFieldStyle}
                  value={puState}
                  aria-label="Pickup state"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <input
                  readOnly
                  className={`${confirmedFieldStyle} col-span-3`}
                  value={delCity}
                  aria-label="Delivery city"
                />
                <input
                  readOnly
                  className={confirmedFieldStyle}
                  value={delState}
                  aria-label="Delivery state"
                />
              </div>

              <input
                readOnly
                className={confirmedFieldStyle}
                value={confirmedCarrierLabel}
                aria-label="Carrier"
              />

              {assignedLoadNumber ? (
                <div className="pt-2 border-t border-zinc-800/60">
                  {renderAssignmentLoadRef()}
                </div>
              ) : null}
            </div>

            <button
              onClick={clearSelectedLoadButKeepDriver}
              className="w-full py-4 rounded-2xl border border-zinc-700 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400"
            >
              Change Assignment
            </button>
          </div>
        ) : !manualMode && availableLoads.length > 0 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
            {availableLoads.map((load) => {
              const identity = getLoadIdentity(load);
              const isSelected =
                selectedLoad && getLoadIdentity(selectedLoad) === identity;
              const carrierName = getCarrierDisplayName(
                load.companyCode || load.company
              );

              return (
                <button
                  key={identity}
                  onClick={() => handleLoadSelection(load)}
                  className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all ${
                    isSelected
                      ? `${themeBorderClass} ${themeBgClass}`
                      : solarMode
                        ? 'border-zinc-300 bg-zinc-50'
                        : 'border-zinc-800 bg-black/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <div
                        className={`text-lg font-black tracking-tight ${
                          isSelected
                            ? themeMode === 'green'
                              ? 'text-green-400'
                              : themeMode === 'blue'
                                ? 'text-blue-400'
                                : 'text-cyan-400'
                            : 'text-white'
                        }`}
                      >
                        {load.loadNumber ? `LOAD #${load.loadNumber}` : 'SELECT LOAD LEG'}
                      </div>

                      {String(load.loadId || '').trim() ? (
                        <div className="mt-1 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                          Load ID: {load.loadId}
                        </div>
                      ) : null}

                      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        Select Load Leg
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {load.status ? (
                        <span
                          className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                            themeMode === 'green'
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {load.status}
                        </span>
                      ) : null}

                      {carrierName ? (
                        <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-widest text-zinc-300">
                          {carrierName}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-zinc-500 uppercase flex flex-wrap items-center gap-2">
                    <span>{load.origin}</span>
                    <span
                      className={
                        themeMode === 'green'
                          ? 'text-green-500'
                          : 'text-blue-500'
                      }
                    >
                      ➔
                    </span>
                    <span>{load.destination}</span>
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => {
                logUiDiag('manual_override_click', {
                  clearsSelectedLoad: true,
                  setsCurrentStage: 'ASSIGNMENT',
                });
                setManualMode(true);
                setSelectedLoad(null);
                setBolNum('');
                setLoadId('');
                setPuCity('');
                setPuState('');
                setDelCity('');
                setDelState('');
                setCompany('');
                setManualCarrier('');
                setCurrentStage('ASSIGNMENT');
              }}
              className="w-full py-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]"
            >
              Load Not Listed / Manual Override
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {loadSelectionError && !manualMode && (
              <div className="space-y-2">
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-center text-[9px] font-black text-orange-500 uppercase">
                  No active loads found for this operator.
                </div>
                <p className="text-center text-[9px] text-zinc-500 normal-case tracking-normal px-2">
                  No active load was found. You may manually enter the load details below.
                </p>
              </div>
            )}

            {manualMode ? (
              <div className="px-1">{renderAssignmentLoadRef()}</div>
            ) : null}

            <div className="grid grid-cols-4 gap-4">
              <input
                className={`${inpStyle(puCity)} col-span-3`}
                placeholder="PICKUP CITY"
                value={puCity}
                onChange={(e) => setPuCity(e.target.value.toUpperCase())}
              />
              <select
                className={inpStyle(puState)}
                value={puState}
                onChange={(e) => setPuState(e.target.value.toUpperCase())}
              >
                <option value="">ST</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <input
                className={`${inpStyle(delCity)} col-span-3`}
                placeholder="DELIVERY CITY"
                value={delCity}
                onChange={(e) => setDelCity(e.target.value.toUpperCase())}
              />
              <select
                className={inpStyle(delState)}
                value={delState}
                onChange={(e) => setDelState(e.target.value.toUpperCase())}
              >
                <option value="">ST</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <select
              className={inpStyle(manualCarrier)}
              value={manualCarrier}
              onChange={(e) => {
                const val = e.target.value as ManualCarrierOption;
                setManualCarrier(val);
                setCompany(val);
              }}
            >
              <option value="">CARRIER NAME ASSIGNED TO THIS LOAD</option>
              <option value="BST Expedite Inc">BST Expedite Inc</option>
              <option value="Greenleaf Xpress">Greenleaf Xpress</option>
              <option value="Other Carrier">Other Carrier</option>
            </select>

            {manualMode && (
              <button
                onClick={() => {
                  logUiDiag('back_to_auto_scan_click', {
                    clearsSelectedLoad: true,
                    setsCurrentStage: 'ASSIGNMENT',
                  });
                  setManualMode(false);
                  setLoadSelectionError(false);
                  setSelectedLoad(null);
                  setBolNum('');
                  setLoadId('');
                  setPuCity('');
                  setPuState('');
                  setDelCity('');
                  setDelState('');
                  setCompany('');
                  setManualCarrier('');
                  setAvailableLoads([]);
                  setCurrentStage('ASSIGNMENT');
                }}
                className="w-full text-[8px] font-black text-blue-500 uppercase tracking-widest pt-2"
              >
                Back to Auto-Scan
              </button>
            )}
          </div>
        )}
        </div>
      </section>
    );
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
        <div className="absolute top-12 flex flex-col items-center opacity-40">
          <div className="w-1 h-12 bg-blue-500 animate-pulse"></div>
          <div className="text-[10px] font-black tracking-[0.5em] mt-4">
            ELMCONNECT
          </div>
        </div>

        <button
          onClick={() => {
            playOpenSound();
            let s = 0;
            const inv = setInterval(() => {
              s++;
              setAuthStage(s);
              if (s >= 5) {
                clearInterval(inv);
                setTimeout(() => setIsLocked(false), 600);
              }
            }, 350);
          }}
          className="w-64 h-64 border-4 border-blue-500/10 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-[0_0_120px_rgba(59,130,246,0.2)] active:scale-95 transition-all z-10 group"
        >
          <div
            className={`absolute inset-0 border-t-4 border-blue-500 rounded-full ${
              authStage > 0 ? 'animate-spin' : ''
            }`}
          />
          <span className="text-8xl mb-4 group-active:scale-110 transition-transform italic font-black text-white">
            GO
          </span>
          <span className="text-[12px] font-black tracking-[0.3em] uppercase text-blue-500 animate-pulse">
            Engage Terminal
          </span>
        </button>

        <div className="mt-16 space-y-3 w-64 font-mono text-[9px] text-zinc-800 uppercase">
          {[
            'Establishing_Link',
            'Roster_Pull_Success',
            'Network_Stable',
            'Encryption_Handshake',
            'Terminal_Active'
          ].map((l, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 ${
                authStage > i ? 'text-green-500' : ''
              }`}
            >
              <span>[{authStage > i ? 'OK' : '..'}]</span> {l}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-700 ${
        solarMode ? 'bg-zinc-100 text-black' : 'bg-[#050508] text-zinc-100'
      } pb-32`}
    >
      <div
        className={`fixed top-0 w-full z-[100] px-6 py-4 flex justify-between items-center text-[10px] font-black border-b ${
          solarMode
            ? 'bg-white/90 border-zinc-200 shadow-sm'
            : 'bg-black/90 border-zinc-900'
        } backdrop-blur-md`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="tracking-widest uppercase italic">Connected</span>
        </div>

        <div className="flex items-center gap-3">
          {eventType ? (
            <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.25em] border border-zinc-600 bg-zinc-900/60 text-zinc-200">
              {eventType}
            </span>
          ) : null}

          {effectiveCompany ? (
            <span
              className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.25em] border ${themeBorderClass} ${themeBgClass} ${themeTextClass}`}
            >
              {effectiveCompany}
            </span>
          ) : null}

          <button
            onClick={() => setSolarMode(!solarMode)}
            className="px-5 py-2 border-2 border-zinc-700 rounded-lg uppercase text-[9px] font-black"
          >
            {solarMode ? '🌙 Midnight' : '☀️ Solar'}
          </button>
        </div>
      </div>

      <header className="max-w-4xl mx-auto pt-24 px-6 mb-8">
        <div
          className={`w-full min-h-[180px] rounded-[3.5rem] border-2 flex items-center justify-center transition-all ${
            solarMode
              ? 'bg-white border-zinc-300 shadow-xl'
              : `bg-zinc-950 shadow-2xl ${themeBorderClass === 'border-zinc-700' ? 'border-zinc-900' : themeBorderClass}`
          }`}
        >
          {!effectiveCompany ? (
            <div className="text-center px-6">
              <h1 className="text-5xl font-black italic text-zinc-800 uppercase tracking-tighter">
                ELM<span className="text-zinc-500">CONNECT</span>
              </h1>
              <div className="mt-3 text-[11px] font-black uppercase tracking-[0.35em] text-zinc-600">
                Elite Logistics Manager
              </div>

              {eventType || driverName || assignedLoadNumber || bolNum ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {eventType ? (
                    <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                      EVENT: {eventType}
                    </span>
                  ) : null}
                  {driverName ? (
                    <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                      DRIVER: {driverName}
                    </span>
                  ) : null}
                  {bolNum ? (
                    <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                      BOL: {bolNum}
                    </span>
                  ) : null}
                  <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                    MODE: {manualMode ? 'MANUAL' : 'AUTO'}
                  </span>
                </div>
              ) : null}
            </div>
          ) : effectiveCompany === 'Greenleaf Xpress' ? (
            <GreenleafLogo />
          ) : effectiveCompany === 'BST Expedite Inc' ? (
            <BstLogo />
          ) : (
            <div className="text-center px-6">
              <h1 className="text-5xl font-black italic text-zinc-800 uppercase tracking-tighter">
                ELM<span className="text-zinc-500">CONNECT</span>
              </h1>
              <div className="mt-3 text-[11px] font-black uppercase tracking-[0.35em] text-zinc-600">
                {effectiveCompany}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 mb-6">{renderFlowStepper()}</div>

      <div className="max-w-4xl mx-auto space-y-5 px-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
                Step 1 of 5
              </p>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                What are you doing?
              </h3>
            </div>
          </div>

          {eventType && currentStageIndex > 0 ? (
            renderVerifiedSummary('Event verified', eventType, () =>
              setCurrentStage('EVENT')
            )
          ) : (
            <div className={`${premiumPanel} p-4`}>
              <p className="text-[9px] text-zinc-500 normal-case mb-4">
                Select pickup or delivery for this stop.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => resetFlowFromEvent('PICKUP')}
                  className={`py-8 rounded-2xl border font-black uppercase tracking-widest text-[11px] transition-all active:scale-[0.98] ${
                    eventType === 'PICKUP'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)]'
                      : 'bg-zinc-950/80 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  Pickup
                </button>
                <button
                  onClick={() => resetFlowFromEvent('DELIVERY')}
                  className={`py-8 rounded-2xl border font-black uppercase tracking-widest text-[11px] transition-all active:scale-[0.98] ${
                    eventType === 'DELIVERY'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)]'
                      : 'bg-zinc-950/80 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>
          )}
        </section>

        {eventType && (
          <section className="space-y-3">
            <div className="px-1">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
                Step 2 of 5
              </p>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Who are you?
              </h3>
            </div>

            {driverName && currentStage !== 'OPERATOR' ? (
              renderVerifiedSummary('Driver verified', driverName, () =>
                setCurrentStage('OPERATOR')
              )
            ) : (
              <div className={`${premiumPanel} p-4 space-y-3`}>
                {!manualMode ? (
                  <select
                    className={inpStyle(driverName)}
                    value={driverName}
                    onChange={(e) => {
                      if (e.target.value === 'MANUAL') {
                        logUiDiag('driver_select_manual_entry', {
                          setsCurrentStage: 'ASSIGNMENT',
                        });
                        setManualMode(true);
                        setDriverName('');
                        setCurrentStage('ASSIGNMENT');
                      } else {
                        logUiDiag('driver_select_change', {
                          clearsSelectedLoad: true,
                          setsCurrentStage: 'ASSIGNMENT',
                        });
                        setDriverName(e.target.value.toUpperCase());
                        setSelectedLoad(null);
                        setBolNum('');
                        setLoadId('');
                        setPuCity('');
                        setPuState('');
                        setDelCity('');
                        setDelState('');
                        setCompany('');
                        setManualCarrier('');
                        setCurrentStage('ASSIGNMENT');
                      }
                    }}
                  >
                    <option value="">Select driver</option>
                    {driverList.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                    <option value="MANUAL">+ Manual entry</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Type full name"
                    className={inpStyle(driverName)}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value.toUpperCase())}
                    autoFocus
                  />
                )}
              </div>
            )}
          </section>
        )}

        {driverName && renderAssignmentPanel()}

        {hasAssignment && currentStage !== 'ASSIGNMENT' && !isConnecting && (
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-3 px-1">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
                  Step 4 of 5
                </p>
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  What documents do you need?
                </h3>
                <p className="text-[10px] text-zinc-500 normal-case mt-1">
                  Let&apos;s collect your documents.
                </p>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[7px] font-black uppercase tracking-widest text-zinc-400">
                Step 4 of 5
              </span>
            </div>

            <div
              className={`${premiumPanel} border-blue-500/30 overflow-hidden ${
                hasBolEvidence && bolNum.trim() ? 'ring-1 ring-blue-500/25' : ''
              }`}
            >
              <div className="p-4 border-b border-zinc-800/80 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-lg">
                    📄
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                      Bill of Lading
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-blue-500/15 text-blue-300 border border-blue-500/25">
                      Required
                    </span>
                  </div>
                </div>
                {hasBolEvidence && bolNum.trim() ? (
                  <span className="text-[8px] font-black uppercase text-green-400 flex items-center gap-1">
                    ✓ Uploaded
                  </span>
                ) : null}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    className={`${inpStyle(bolNum)} flex-1`}
                    placeholder="BOL number"
                    value={bolNum}
                    onChange={(e) => setBolNum(e.target.value.trim())}
                  />
                </div>
                <p className="text-[8px] text-zinc-600 normal-case">{UPLOAD_FORMAT_HINT}</p>
                <p className="text-[8px] text-zinc-500 normal-case">
                  Upload up to 5 BOL photos
                  {bolPhotoCount > 0 ? ` · ${bolPhotoCount} attached` : ''}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-4 rounded-xl border border-dashed border-blue-500/35 bg-blue-500/5 active:scale-[0.98] transition-all"
                  >
                    <div className="text-xl mb-1">📸</div>
                    <div className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-300">
                      Take Photo
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-4 rounded-xl border border-dashed border-blue-500/35 bg-blue-500/5 active:scale-[0.98] transition-all"
                  >
                    <div className="text-xl mb-1">🖼️</div>
                    <div className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-300">
                      Choose Existing
                    </div>
                  </button>
                </div>

                {uploadedFiles.some((f) => f.category === 'bol') ? (
                  <div className="flex gap-2 overflow-x-auto pt-1">
                    {uploadedFiles
                      .filter((f) => f.category === 'bol')
                      .map((f) => (
                        <div
                          key={f.id}
                          className="relative shrink-0 w-20 h-24 rounded-xl overflow-hidden border border-blue-500/40"
                        >
                          <img
                            src={f.preview}
                            className="w-full h-full object-cover"
                            alt="BOL"
                          />
                          <button
                            type="button"
                            onClick={() => setFullImage(f.preview)}
                            className="absolute inset-x-0 bottom-0 bg-black/75 text-[6px] font-black uppercase text-blue-200 py-0.5"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedFiles((p) => p.filter((i) => i.id !== f.id))
                            }
                            className="absolute top-1 right-1 bg-red-600 w-5 h-5 rounded-full text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            </div>

            {eventType === 'PICKUP' ? (
              showFreightWaived ? (
                <div
                  className={`${premiumPanel} p-4 border-amber-500/25`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                      🛡️
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">
                        ✓ Freight Photos Waived
                      </p>
                      <p className="text-[10px] text-zinc-400 normal-case mt-0.5">
                        Confirmed by dispatch
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={reopenFreightWaiverChoice}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[8px] font-black uppercase tracking-widest text-amber-300 active:scale-95"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`${premiumPanel} border-green-500/30 overflow-hidden ${
                    hasFreightPhotos ? 'ring-1 ring-green-500/25' : ''
                  }`}
                >
                  <div className="p-4 border-b border-zinc-800/80 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-600/15 border border-green-500/30 flex items-center justify-center text-lg">
                        🚛
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">
                          Freight Photos
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-green-500/15 text-green-300 border border-green-500/25">
                          Pickup only
                        </span>
                      </div>
                    </div>
                    {hasFreightPhotos ? (
                      <span className="text-[8px] font-black uppercase text-green-400">
                        ✓ {freightPhotoCount} image{freightPhotoCount === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-[8px] text-zinc-500 normal-case">
                      Upload up to 5 freight photos
                      {freightPhotoCount > 0 ? ` · ${freightPhotoCount} attached` : ''}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => freightCamRef.current?.click()}
                        className="py-4 rounded-xl border border-dashed border-green-500/35 bg-green-500/5 active:scale-[0.98]"
                      >
                        <div className="text-xl mb-1">📸</div>
                        <div className="text-[8px] font-black uppercase tracking-[0.15em] text-green-300">
                          Take Photo
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => freightFileRef.current?.click()}
                        className="py-4 rounded-xl border border-dashed border-green-500/35 bg-green-500/5 active:scale-[0.98]"
                      >
                        <div className="text-xl mb-1">🖼️</div>
                        <div className="text-[8px] font-black uppercase tracking-[0.15em] text-green-300">
                          Choose Existing
                        </div>
                      </button>
                    </div>

                    {hasFreightPhotos ? (
                      <div className="flex gap-2 overflow-x-auto">
                        {uploadedFiles
                          .filter((f) => f.category === 'freight')
                          .map((f) => (
                            <div
                              key={f.id}
                              className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-green-500/40"
                            >
                              <img
                                src={f.preview}
                                className="w-full h-full object-cover"
                                alt="Freight"
                              />
                              <button
                                type="button"
                                onClick={() => setFullImage(f.preview)}
                                className="absolute inset-x-0 bottom-0 bg-black/75 text-[6px] font-black uppercase text-green-200 py-0.5"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setUploadedFiles((p) => p.filter((i) => i.id !== f.id))
                                }
                                className="absolute top-1 right-1 bg-red-600 w-5 h-5 rounded-full text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setShowFreightConfirm(true)}
                      className="w-full text-center text-[8px] font-black uppercase tracking-widest text-zinc-600 py-1 active:scale-[0.98]"
                    >
                      Not Required
                    </button>
                  </div>
                </div>
              )
            ) : null}

            {(selectedLoad || manualMode) && (
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedLoad ? (
                  <button
                    type="button"
                    onClick={clearSelectedLoadButKeepDriver}
                    className="flex-1 py-3 rounded-xl border border-zinc-700 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500"
                  >
                    Change assignment
                  </button>
                ) : null}
                {manualMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      logUiDiag('edit_manual_entry_click', {
                        setsCurrentStage: 'ASSIGNMENT',
                      });
                      setCurrentStage('ASSIGNMENT');
                    }}
                    className="flex-1 py-3 rounded-xl border border-zinc-700 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500"
                  >
                    Edit manual entry
                  </button>
                ) : null}
              </div>
            )}

            <div className={`${premiumPanel} p-4 flex items-center gap-4`}>
              <div
                className="relative w-12 h-12 shrink-0 rounded-full border-2 border-blue-500/40 flex items-center justify-center"
                style={{
                  background: `conic-gradient(#3b82f6 ${(documentProgressDone / documentProgressTotal) * 360}deg, #27272a 0deg)`,
                }}
              >
                <div className="w-9 h-9 rounded-full bg-zinc-950 flex items-center justify-center text-[9px] font-black text-white">
                  {documentProgressDone}/{documentProgressTotal}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  {documentProgressDone} of {documentProgressTotal} documents complete
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isReady) {
                    setCurrentStage('REVIEW');
                    setShowVerification(true);
                  }
                }}
                disabled={!isReady}
                className={`shrink-0 px-5 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  themeMode === 'green'
                    ? 'bg-green-600 shadow-[0_0_16px_rgba(34,197,94,0.3)]'
                    : 'bg-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.35)]'
                }`}
              >
                Ready for review →
              </button>
            </div>

            <p className="text-center text-[8px] text-zinc-600 normal-case flex items-center justify-center gap-1.5">
              <span>🔒</span>
              Your documents are secure and will be sent to dispatch.
            </p>
          </section>
        )}
      </div>

      {showFreightPrompt && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-zinc-950 border-4 border-orange-500/40 rounded-[3.5rem] p-12 text-center max-w-sm">
            <h2 className="text-3xl font-black uppercase text-orange-500 mb-4 tracking-tighter">
              Trailer Space
            </h2>
            <p className="text-zinc-500 text-[10px] mb-10 font-black uppercase tracking-widest leading-relaxed">
              Document freight loaded on trailer to confirm remaining space?
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setShowFreightPrompt(false);
                  freightCamRef.current?.click();
                }}
                className="bg-orange-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest active:scale-95 shadow-xl"
              >
                Take Photo Now
              </button>

              <button
                onClick={() => {
                  setShowFreightPrompt(false);
                  freightFileRef.current?.click();
                }}
                className="bg-zinc-800 text-white py-6 rounded-2xl font-black uppercase tracking-widest active:scale-95 shadow-xl border border-zinc-700"
              >
                Select From Files / Camera Roll
              </button>

              <button
                onClick={() => {
                  setShowFreightPrompt(false);
                  setShowFreightConfirm(true);
                }}
                className="text-zinc-700 font-black uppercase text-[10px] tracking-widest py-4"
              >
                Not Required
              </button>
            </div>
          </div>
        </div>
      )}

      {showFreightConfirm && (
        <div className="fixed inset-0 z-[550] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-zinc-950 border-4 border-orange-500/40 rounded-[3.5rem] p-12 text-center max-w-sm">
            <p className="text-zinc-300 text-sm normal-case tracking-normal leading-relaxed mb-10">
              Please confirm: Dispatch has told me that freight photos are not required for this load.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setFreightNotRequired(true);
                  setShowFreightConfirm(false);
                }}
                className="bg-orange-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest active:scale-95 shadow-xl"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowFreightConfirm(false);
                  setShowFreightPrompt(true);
                }}
                className="bg-zinc-800 text-white py-6 rounded-2xl font-black uppercase tracking-widest active:scale-95 shadow-xl border border-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerification && (
        <div className="fixed inset-0 z-[600] bg-[#050508] overflow-y-auto animate-in slide-in-from-right">
          <div className="max-w-xl mx-auto px-4 py-5 pb-36 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-green-400">
                  Connected
                </span>
              </div>
              <button
                onClick={() => {
                  setReviewEditCard(null);
                  setShowVerification(false);
                  setCurrentStage('EVIDENCE');
                }}
                className="text-zinc-500 font-black uppercase text-[9px] tracking-widest px-3 py-2 border border-zinc-800 rounded-full hover:border-zinc-600 transition-colors"
              >
                Close ✕
              </button>
            </div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.45em] text-zinc-600 mb-1">
                Step 5 of 5
              </p>
              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">
                Before Sending
              </h2>
              <p className="mt-1 text-[10px] text-zinc-500 normal-case tracking-normal">
                Does everything look correct?
              </p>
            </div>

            <div className="flex items-center justify-between gap-1 px-1">
              {[
                { label: 'Event', done: true },
                { label: 'Driver', done: true },
                { label: 'Load', done: true },
                { label: 'Documents', done: hasBolEvidence },
                { label: 'Review', done: false, active: true },
              ].map((step, idx) => (
                <div key={step.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div className="flex items-center w-full">
                    {idx > 0 ? (
                      <div
                        className={`h-px flex-1 ${
                          step.done || step.active ? 'bg-blue-500/50' : 'bg-zinc-800'
                        }`}
                      />
                    ) : (
                      <div className="flex-1" />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                        step.active
                          ? 'bg-blue-600 text-white shadow-[0_0_16px_rgba(59,130,246,0.55)] ring-2 ring-blue-400/40'
                          : step.done
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                            : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                      }`}
                    >
                      {step.done && !step.active ? '✓' : step.active ? '●' : ''}
                    </div>
                    {idx < 3 ? (
                      <div
                        className={`h-px flex-1 ${
                          step.done ? 'bg-blue-500/50' : 'bg-zinc-800'
                        }`}
                      />
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                  <span
                    className={`text-[7px] font-black uppercase tracking-[0.15em] truncate w-full text-center ${
                      step.active ? 'text-blue-400' : step.done ? 'text-zinc-500' : 'text-zinc-700'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <section className="space-y-2">
              <h3 className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 px-1">
                Load Overview
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'event' as const,
                      label: 'Event',
                      value: eventType || '—',
                      icon: '📦',
                    },
                    {
                      id: 'carrier' as const,
                      label: 'Carrier',
                      value: reviewCarrierDisplay,
                      icon: '🚛',
                    },
                    {
                      id: 'pickup' as const,
                      label: 'Pickup Location',
                      value: `${puCity || '—'}, ${puState || '—'}`,
                      icon: '📍',
                    },
                    {
                      id: 'destination' as const,
                      label: 'Destination',
                      value: `${delCity || '—'}, ${delState || '—'}`,
                      icon: '🏁',
                    },
                  ] as const
                ).map((card) => {
                  const isOpen = reviewEditCard === card.id;
                  return (
                    <div
                      key={card.id}
                      className={`${reviewGlassPanel} overflow-hidden transition-all duration-300 ${
                        isOpen ? 'col-span-2 ring-1 ring-blue-500/30' : ''
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span className="text-base leading-none opacity-80">{card.icon}</span>
                            <div className="min-w-0">
                              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                {card.label}
                              </p>
                              <p className="text-[11px] font-bold text-white uppercase tracking-tight truncate mt-0.5">
                                {card.value}
                              </p>
                              {card.id === 'carrier' && carrierLockedFromDispatch ? (
                                <p className="text-[7px] text-zinc-500 normal-case mt-0.5 tracking-normal">
                                  🔒 From dispatch
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {card.id === 'carrier' && carrierLockedFromDispatch ? null : (
                            <button
                              type="button"
                              onClick={() => openReviewEdit(card.id)}
                              className="shrink-0 w-8 h-8 rounded-lg border border-zinc-700/80 bg-zinc-800/50 text-[10px] text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all active:scale-95"
                              aria-label={`Edit ${card.label}`}
                            >
                              ✎
                            </button>
                          )}
                        </div>
                      </div>

                      {isOpen ? (
                        <div className="px-3 pb-3 pt-0 border-t border-zinc-800/80 animate-in slide-in-from-top-2 duration-300">
                          {card.id === 'event' ? (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              {(['PICKUP', 'DELIVERY'] as const).map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setReviewDraft((d) => ({ ...d, eventType: opt }))
                                  }
                                  className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                                    reviewDraft.eventType === opt
                                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : null}

                          {card.id === 'carrier' ? (
                            <select
                              className={`${reviewCompactInput} mt-3`}
                              value={reviewDraft.manualCarrier}
                              onChange={(e) =>
                                setReviewDraft((d) => ({
                                  ...d,
                                  manualCarrier: e.target.value as ManualCarrierOption,
                                }))
                              }
                            >
                              <option value="">Select carrier</option>
                              <option value="BST Expedite Inc">BST Expedite Inc</option>
                              <option value="Greenleaf Xpress">Greenleaf Xpress</option>
                              <option value="Other Carrier">Other Carrier</option>
                            </select>
                          ) : null}

                          {card.id === 'pickup' ? (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                              <input
                                className={`${reviewCompactInput} col-span-3`}
                                placeholder="City"
                                value={reviewDraft.puCity}
                                onChange={(e) =>
                                  setReviewDraft((d) => ({
                                    ...d,
                                    puCity: e.target.value.toUpperCase(),
                                  }))
                                }
                              />
                              <select
                                className={reviewCompactInput}
                                value={reviewDraft.puState}
                                onChange={(e) =>
                                  setReviewDraft((d) => ({
                                    ...d,
                                    puState: e.target.value.toUpperCase(),
                                  }))
                                }
                              >
                                <option value="">ST</option>
                                {states.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          {card.id === 'destination' ? (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                              <input
                                className={`${reviewCompactInput} col-span-3`}
                                placeholder="City"
                                value={reviewDraft.delCity}
                                onChange={(e) =>
                                  setReviewDraft((d) => ({
                                    ...d,
                                    delCity: e.target.value.toUpperCase(),
                                  }))
                                }
                              />
                              <select
                                className={reviewCompactInput}
                                value={reviewDraft.delState}
                                onChange={(e) =>
                                  setReviewDraft((d) => ({
                                    ...d,
                                    delState: e.target.value.toUpperCase(),
                                  }))
                                }
                              >
                                <option value="">ST</option>
                                {states.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              onClick={cancelReviewEdit}
                              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-[8px] font-black uppercase tracking-widest text-zinc-500 active:scale-95"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={confirmReviewEdit}
                              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-[8px] font-black uppercase tracking-widest text-white shadow-[0_0_12px_rgba(59,130,246,0.35)] active:scale-95"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-[7px] font-black uppercase tracking-[0.3em] text-zinc-700 pt-1">
                ↑ Tap any field above to edit ↓
              </p>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">
                  Documents & Photos
                </h3>
                <span className="text-[7px] font-black uppercase tracking-widest text-green-400 flex items-center gap-1">
                  <span className="text-green-500">✓</span>
                  {uploadedFiles.length} item{uploadedFiles.length === 1 ? '' : 's'} uploaded
                </span>
              </div>

              <div className={`${reviewGlassPanel} border-blue-500/25 overflow-hidden`}>
                <div className="p-3 border-b border-zinc-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">
                        BOL (Proof of Load)
                      </p>
                      <p className="text-[10px] font-bold text-white mt-0.5">
                        BOL # {bolNum || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-black uppercase text-green-400">✓ Verified</span>
                      <button
                        type="button"
                        onClick={() => openReviewEdit('bol')}
                        className="w-8 h-8 rounded-lg border border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-400 active:scale-95"
                        aria-label="Edit BOL number"
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                  {reviewEditCard === 'bol' ? (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 animate-in slide-in-from-top-2">
                      <input
                        className={reviewCompactInput}
                        placeholder="BOL #"
                        value={reviewDraft.bolNum}
                        onChange={(e) =>
                          setReviewDraft((d) => ({ ...d, bolNum: e.target.value.trim() }))
                        }
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={cancelReviewEdit}
                          className="flex-1 py-2 rounded-xl border border-zinc-700 text-[8px] font-black uppercase text-zinc-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmReviewEdit}
                          className="flex-1 py-2 rounded-xl bg-blue-600 text-[8px] font-black uppercase text-white"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                {uploadedFiles.some((f) => f.category === 'bol') ? (
                  <div className="p-3 flex gap-2 overflow-x-auto">
                    {uploadedFiles
                      .filter((f) => f.category === 'bol')
                      .map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFullImage(f.preview)}
                          className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-blue-500/30 relative group"
                        >
                          <img
                            src={f.preview}
                            className="w-full h-full object-cover"
                            alt="BOL"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[6px] font-black uppercase text-blue-300 py-0.5">
                            Tap to view
                          </span>
                        </button>
                      ))}
                  </div>
                ) : null}
              </div>

              {eventType === 'PICKUP' ? (
                <div className={`${reviewGlassPanel} border-green-500/25 overflow-hidden`}>
                  <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-green-400">
                        Freight Photos
                      </p>
                      {showFreightWaived ? (
                        <p className="text-[9px] text-amber-400/90 normal-case mt-0.5">
                          ✓ Waived — confirmed by dispatch
                        </p>
                      ) : hasFreightPhotos ? (
                        <p className="text-[9px] text-zinc-400 normal-case mt-0.5">
                          {freightPhotoCount} photo{freightPhotoCount === 1 ? '' : 's'} attached
                        </p>
                      ) : (
                        <p className="text-[9px] text-zinc-500 normal-case mt-0.5">
                          No photos added yet
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasFreightPhotos ? (
                        <span className="text-[7px] font-black uppercase text-green-400">
                          ✓ Verified
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={returnToFreightDocuments}
                        className="w-8 h-8 rounded-lg border border-green-500/30 bg-green-500/10 text-[10px] text-green-400 active:scale-95"
                        aria-label="Edit freight photos"
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                  {hasFreightPhotos ? (
                    <div className="p-3 flex gap-2 overflow-x-auto">
                      {uploadedFiles
                        .filter((f) => f.category === 'freight')
                        .map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFullImage(f.preview)}
                            className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-green-500/30 relative"
                          >
                            <img
                              src={f.preview}
                              className="w-full h-full object-cover"
                              alt="Freight"
                            />
                            <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[6px] font-black uppercase text-green-300 py-0.5">
                              Tap to view
                            </span>
                          </button>
                        ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <div
              className={`${reviewGlassPanel} p-4 space-y-3 ${
                isReady
                  ? 'border-blue-500/40 shadow-[0_0_24px_rgba(59,130,246,0.15)]'
                  : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                    isReady
                      ? 'bg-green-600/20 text-green-400 border border-green-500/40'
                      : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                  }`}
                >
                  {isReady ? '✓' : '·'}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-[10px] font-black uppercase tracking-[0.25em] ${
                      isReady ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    Ready to Submit
                  </p>
                  <p className="text-[9px] text-zinc-500 normal-case tracking-normal mt-0.5">
                    {isReady
                      ? 'Everything has been verified.'
                      : 'Complete your documents before submitting.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!isReady || isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  setShowUploadFailure(false);
                  setUploadFailureMessage('');
                  setUploadSavedLocally(false);

                  const base64 = await Promise.all(
                    uploadedFiles.map(async (f) => {
                      return {
                        category: f.category,
                        base64: await new Promise((res) => {
                          const r = new FileReader();
                          r.onload = () => res(r.result);
                          r.readAsDataURL(f.file);
                        }),
                      };
                    })
                  );

                  const payload = buildSubmissionPayload(base64);

                  try {
                    const response = await fetch('/.netlify/functions/upload', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    let result: { success?: boolean; error?: string } = {};
                    try {
                      result = await response.json();
                    } catch {
                      throw new Error('Upload failed: invalid server response');
                    }

                    if (!response.ok || !result.success) {
                      throw new Error(result.error || 'Upload failed');
                    }

                    setShowSuccess(true);
                  } catch (e) {
                    const message =
                      e instanceof Error ? e.message : 'Upload failed. Please try again.';

                    try {
                      const currentVault: VaultEntry[] = JSON.parse(
                        localStorage.getItem('multi_vault') || '[]'
                      );

                      localStorage.setItem(
                        'multi_vault',
                        JSON.stringify([
                          ...currentVault,
                          {
                            id: Math.random().toString(),
                            timestamp: Date.now(),
                            payload,
                          },
                        ])
                      );
                      setUploadSavedLocally(true);
                    } catch {
                      setUploadSavedLocally(false);
                    }

                    setUploadFailureMessage(message);
                    setShowUploadFailure(true);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.35em] text-[11px] text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  themeMode === 'green'
                    ? 'bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.25)]'
                    : themeMode === 'blue'
                      ? 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.35)]'
                      : 'bg-zinc-700'
                }`}
              >
                Submit to Dispatch →
              </button>
            </div>

            <p className="text-center text-[8px] text-zinc-600 normal-case tracking-normal flex items-center justify-center gap-1.5 pb-2">
              <span>🔒</span>
              Your documents are secure and will be sent to dispatch.
            </p>
          </div>
        </div>
      )}

      {isSubmitting && !showSuccess && !showUploadFailure && (
        <div className="fixed inset-0 z-[700] bg-black flex flex-col items-center justify-center p-8 animate-in zoom-in">
          <div className="relative w-64 h-64 mb-12">
            <div className="absolute inset-0 border-8 border-blue-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-4 border-4 border-blue-500/40 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center text-7xl animate-bounce">
              🛰️
            </div>
          </div>

          <h2 className="text-4xl font-black italic text-blue-500 uppercase tracking-tighter mb-4">
            Submitting to Dispatch
          </h2>
          <p className="text-orange-500 font-bold text-[11px] uppercase tracking-[0.4em] animate-pulse">
            Please wait. Do not close the app.
          </p>
        </div>
      )}

      {showUploadFailure && (
        <div className="fixed inset-0 z-[800] bg-black flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom">
          <div className="w-full max-w-md bg-zinc-950 border-[3px] border-red-500/60 rounded-[3.5rem] p-10 text-center relative">
            <div className="w-20 h-20 rounded-full border-4 border-red-500 mx-auto flex items-center justify-center text-4xl mb-6 shadow-2xl text-red-500">
              ✕
            </div>

            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2">
              Upload Failed
            </h2>
            <p className="text-red-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
              Not synchronized with fleet control
            </p>

            <p className="text-zinc-300 text-sm normal-case tracking-normal mb-6 px-2">
              {uploadFailureMessage}
            </p>

            {uploadSavedLocally ? (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-5 mb-8 text-left">
                <p className="text-orange-400 font-black text-[10px] uppercase tracking-[0.25em] mb-2">
                  Saved locally, not submitted
                </p>
                <p className="text-zinc-400 text-[11px] normal-case tracking-normal leading-relaxed">
                  Your documents were saved on this device only. Contact dispatch or
                  tap Try Again to resubmit when you have a connection.
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 mb-8 text-left">
                <p className="text-zinc-400 text-[11px] normal-case tracking-normal leading-relaxed">
                  Contact dispatch if this keeps happening, or tap Try Again.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowUploadFailure(false)}
                className="w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] bg-red-600 text-white"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setShowUploadFailure(false);
                  setShowVerification(false);
                  setCurrentStage('EVIDENCE');
                }}
                className="w-full py-4 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] text-zinc-500 border border-zinc-800"
              >
                Back to Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[800] bg-black flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom">
          <div
            className="w-full max-w-md bg-zinc-950 border-[3px] rounded-[3.5rem] p-10 text-center relative"
            style={{ borderColor: themeHex }}
          >
            <div className="w-20 h-20 rounded-full border-4 border-green-500 mx-auto flex items-center justify-center text-4xl mb-6 shadow-2xl">
              ✓
            </div>

            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2">
              Secure Manifest
            </h2>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-8">
              Synchronized with fleet control
            </p>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 mb-8 text-left space-y-3 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">EVENT:</span>
                <span className="text-white font-bold">{eventType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">LOAD #:</span>
                <span className="text-white font-bold">{assignedLoadNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">BOL #:</span>
                <span className="text-white font-bold">{bolNum || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">LOAD ID:</span>
                <span className="text-white font-bold">{loadId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">OPERATOR:</span>
                <span className="text-white font-bold">{driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">CARRIER:</span>
                <span className="text-white font-bold">{effectiveCompany || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">TIMESTAMP:</span>
                <span className="text-white font-bold">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] ${
                themeMode === 'green'
                  ? 'bg-green-600'
                  : themeMode === 'blue'
                    ? 'bg-blue-600'
                    : 'bg-zinc-700'
              } text-white`}
            >
              Restart Terminal
            </button>
          </div>
        </div>
      )}

      {editingField && (
        <div className="fixed inset-0 z-[800] bg-black/98 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-800 rounded-[3.5rem] p-10 shadow-2xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase mb-8 tracking-[0.4em] text-center">
              Correct Entry
            </h3>

            <div className="space-y-4">
              {editingField === 'origin' && (
                <>
                  <input
                    type="text"
                    placeholder="CITY"
                    className={inpStyle(puCity)}
                    value={puCity}
                    onChange={(e) => setPuCity(e.target.value.toUpperCase())}
                  />
                  <select
                    className={inpStyle(puState)}
                    value={puState}
                    onChange={(e) => setPuState(e.target.value.toUpperCase())}
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {editingField === 'destination' && (
                <>
                  <input
                    type="text"
                    placeholder="CITY"
                    className={inpStyle(delCity)}
                    value={delCity}
                    onChange={(e) => setDelCity(e.target.value.toUpperCase())}
                  />
                  <select
                    className={inpStyle(delState)}
                    value={delState}
                    onChange={(e) => setDelState(e.target.value.toUpperCase())}
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {editingField === 'driverName' && (
                <input
                  type="text"
                  placeholder="DRIVER NAME"
                  className={inpStyle(driverName)}
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value.toUpperCase())}
                />
              )}

              {editingField === 'company' && (
                <select
                  className={inpStyle(manualCarrier)}
                  value={manualCarrier}
                  onChange={(e) => {
                    const val = e.target.value as ManualCarrierOption;
                    setManualCarrier(val);
                    setCompany(val);
                  }}
                >
                  <option value="">CARRIER NAME ASSIGNED TO THIS LOAD</option>
                  <option value="BST Expedite Inc">BST Expedite Inc</option>
                  <option value="Greenleaf Xpress">Greenleaf Xpress</option>
                  <option value="Other Carrier">Other Carrier</option>
                </select>
              )}

              {editingField === 'reference' && (
                <input
                  type="text"
                  placeholder="BOL #"
                  className={inpStyle(bolNum)}
                  value={bolNum}
                  onChange={(e) => setBolNum(e.target.value.trim())}
                />
              )}
            </div>

            <button
              onClick={() => setEditingField(null)}
              className="w-full mt-10 py-6 rounded-3xl bg-white text-black font-black uppercase text-[10px] tracking-widest active:scale-95"
            >
              Commit Changes
            </button>
          </div>
        </div>
      )}

      {fullImage && (
        <div
          className="fixed inset-0 z-[900] bg-black flex flex-col items-center justify-center p-4 animate-in zoom-in"
          onClick={() => setFullImage(null)}
        >
          <button className="absolute top-10 right-10 text-white text-[10px] font-black border-2 border-white/20 px-6 py-2 rounded-full uppercase">
            Close [X]
          </button>
          <img
            src={fullImage}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        capture="environment"
        accept="image/jpeg,image/png"
        multiple
        onChange={(e) => onFileSelect(e, 'bol')}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/jpeg,image/png"
        onChange={(e) => onFileSelect(e, 'bol')}
      />
      <input
        type="file"
        ref={freightCamRef}
        className="hidden"
        capture="environment"
        accept="image/jpeg,image/png"
        multiple
        onChange={(e) => onFileSelect(e, 'freight')}
      />
      <input
        type="file"
        ref={freightFileRef}
        className="hidden"
        multiple
        accept="image/jpeg,image/png"
        onChange={(e) => onFileSelect(e, 'freight')}
      />
    </div>
  );
};

export default App;