import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
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

        canvas.toBlob((b) => resolve(b || file), 'image/jpeg', 0.82);
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
  const [loadNum, setLoadNum] = useState('');
  const [loadId, setLoadId] = useState('');
  const [puCity, setPuCity] = useState('');
  const [puState, setPuState] = useState('');
  const [delCity, setDelCity] = useState('');
  const [delState, setDelState] = useState('');
  const [bolProtocol, setBolProtocol] = useState<EventType>('');

  // Evidence / submission
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [showFreightPrompt, setShowFreightPrompt] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const freightCamRef = useRef<HTMLInputElement>(null);
  const freightFileRef = useRef<HTMLInputElement>(null);

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
    effectiveCompany
  );

  const hasAssignment = !!(selectedLoad || hasManualAssignmentData);

  const hasBolEvidence = uploadedFiles.some((f) => f.category === 'bol');

  const hasRouteData = !!(
    (selectedLoad && (puCity || puState || delCity || delState)) ||
    (puCity && puState && delCity && delState)
  );

  const isReady = !!(
    effectiveCompany &&
    driverName &&
    eventType &&
    hasRouteData &&
    hasBolEvidence
  );

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

  const resetFlowFromEvent = (nextEvent: EventType) => {
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
    setLoadNum('');
    setLoadId('');
    setPuCity('');
    setPuState('');
    setDelCity('');
    setDelState('');

    setUploadedFiles([]);
    setShowFreightPrompt(false);
    setShowVerification(false);
    setEditingField(null);
    setFullImage(null);
  };

  const clearSelectedLoadButKeepDriver = () => {
    setSelectedLoad(null);
    setLoadNum('');
    setLoadId('');
    setPuCity('');
    setPuState('');
    setDelCity('');
    setDelState('');
    setCompany('');
    setUploadedFiles([]);
    setShowFreightPrompt(false);
    setIsConnecting(false);
    setCurrentStage('ASSIGNMENT');
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
      if (driverName && eventType && !manualMode) {
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

          if (Array.isArray(data)) {
            setAvailableLoads(data);
            if (data.length === 0) setLoadSelectionError(true);
          } else {
            setAvailableLoads([]);
            setLoadSelectionError(true);
          }
        } catch (err) {
          console.error('Radar Link Failure', err);
          setAvailableLoads([]);
          setLoadSelectionError(true);
        } finally {
          setIsScanning(false);
        }
      }
    };

    scanForLoads();
  }, [driverName, eventType, manualMode]);

  useEffect(() => {
    if (manualMode && hasManualAssignmentData) {
      setCurrentStage('EVIDENCE');
    }
  }, [manualMode, hasManualAssignmentData]);

  const handleLoadSelection = (load: AvailableLoad) => {
    const carrierName = getCarrierDisplayName(load.companyCode || load.company);
    const puParts = String(load.origin || '')
      .split(',')
      .map((p) => p.trim());
    const delParts = String(load.destination || '')
      .split(',')
      .map((p) => p.trim());

    setSelectedLoad(load);
    setLoadId(String(load.loadId || '').trim());
    setLoadNum(String(load.loadNumber || '').trim());

    setPuCity((puParts[0] || '').toUpperCase());
    setPuState((puParts[1] || '').toUpperCase());
    setDelCity((delParts[0] || '').toUpperCase());
    setDelState((delParts[1] || '').toUpperCase());

    setCompany(carrierName || '');
    setIsConnecting(true);

    window.setTimeout(() => {
      setIsConnecting(false);
      setCurrentStage('EVIDENCE');
    }, 1200);
  };

  const onFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    cat: 'bol' | 'freight'
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      for (const f of files) {
        const enh = await compressImage(f);
        setUploadedFiles((prev) => [
          ...prev,
          {
            file: enh,
            preview: URL.createObjectURL(enh),
            id: Math.random().toString(),
            category: cat
          }
        ]);
      }

      if (
        cat === 'bol' &&
        eventType === 'PICKUP' &&
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
    const panelBase = `p-8 rounded-[2.5rem] border-2 transition-all ${
      solarMode
        ? 'bg-white border-zinc-300'
        : 'bg-zinc-900/30 border-zinc-800'
    }`;

    if (!eventType || !driverName) return null;

    return (
      <section className={panelBase}>
        <div className="flex justify-between items-center mb-8 gap-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">
            [ 02 ] Assignment
          </h3>

          {isScanning && (
            <div className="flex items-center gap-2 shrink-0">
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
                Loading Assignment Data...
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
              ELM IS CONNECTING
            </div>
            <div className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 max-w-md leading-relaxed">
              Scanning the load board and matching your active assignment data
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
              Securing assignment identity and preparing document intake
            </div>
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
                setManualMode(true);
                setSelectedLoad(null);
                setLoadNum('');
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
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-center text-[9px] font-black text-orange-500 uppercase">
                No active loads found for this operator.
              </div>
            )}

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
                  setManualMode(false);
                  setLoadSelectionError(false);
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
        solarMode ? 'bg-zinc-100 text-black' : 'bg-[#020202] text-zinc-100'
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

              {eventType || driverName || loadNum ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {eventType ? (
                    <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                      EVENT: {eventType}
                    </span>
                  ) : null}
                  {driverName ? (
                    <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                      OPERATOR: {driverName}
                    </span>
                  ) : null}
                  {loadNum ? (
                    <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                      LOAD: {loadNum}
                    </span>
                  ) : null}
                  {loadId ? (
                    <span className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                      ID: {loadId}
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

      <div className="max-w-4xl mx-auto px-6 mb-8">
        <section
          className={`p-5 rounded-[2.5rem] border-2 transition-all ${
            solarMode
              ? 'bg-white border-zinc-300'
              : 'bg-zinc-900/30 border-zinc-800'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 text-zinc-600">
            System State
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {stageOrder.map((stage, idx) => renderStagePill(stage, idx))}
          </div>
        </section>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 px-6">
        <section
          className={`p-8 rounded-[2.5rem] border-2 transition-all ${
            solarMode
              ? 'bg-white border-zinc-300'
              : 'bg-zinc-900/30 border-zinc-800'
          }`}
        >
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-3 text-zinc-600">
            [ 00 ] Event
          </h3>
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-8">
            Select document event to begin
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => resetFlowFromEvent('PICKUP')}
              className={`py-10 rounded-[2rem] border-2 font-black uppercase tracking-widest transition-all ${
                eventType === 'PICKUP'
                  ? 'bg-zinc-200 text-black border-zinc-100 shadow-[0_0_25px_rgba(255,255,255,0.08)]'
                  : 'bg-black/40 border-zinc-700 text-zinc-400'
              }`}
            >
              PICKUP
            </button>

            <button
              onClick={() => resetFlowFromEvent('DELIVERY')}
              className={`py-10 rounded-[2rem] border-2 font-black uppercase tracking-widest transition-all ${
                eventType === 'DELIVERY'
                  ? 'bg-zinc-200 text-black border-zinc-100 shadow-[0_0_25px_rgba(255,255,255,0.08)]'
                  : 'bg-black/40 border-zinc-700 text-zinc-400'
              }`}
            >
              DELIVERY
            </button>
          </div>
        </section>

        {eventType && (
          <section
            className={`p-8 rounded-[2.5rem] border-2 transition-all ${
              solarMode
                ? 'bg-white border-zinc-300'
                : 'bg-zinc-900/30 border-zinc-800'
            }`}
          >
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-zinc-600">
              [ 01 ] Operator
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {!manualMode ? (
                <select
                  className={inpStyle(driverName)}
                  value={driverName}
                  onChange={(e) => {
                    if (e.target.value === 'MANUAL') {
                      setManualMode(true);
                      setDriverName('');
                      setCurrentStage('ASSIGNMENT');
                    } else {
                      setDriverName(e.target.value.toUpperCase());
                      setSelectedLoad(null);
                      setLoadNum('');
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
                  <option value="">SELECT DRIVER</option>
                  {driverList.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                  <option value="MANUAL">+ MANUAL ENTRY</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="TYPE FULL NAME"
                  className={inpStyle(driverName)}
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value.toUpperCase())}
                  autoFocus
                />
              )}
            </div>
          </section>
        )}

        {driverName && renderAssignmentPanel()}

        {hasAssignment && currentStage !== 'ASSIGNMENT' && !isConnecting && (
          <section
            className={`p-8 rounded-[2.5rem] border-2 transition-all ${
              solarMode
                ? 'bg-white border-zinc-300'
                : `bg-zinc-900/30 ${themeBorderClass === 'border-zinc-700' ? 'border-zinc-800' : themeBorderClass}`
            }`}
          >
            <div className="flex justify-between items-center mb-8 gap-4">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">
                  [ 03 ] Evidence
                </h3>
                <div className="mt-2 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                  {eventType === 'PICKUP'
                    ? 'Capture Bill Of Lading'
                    : 'Capture Delivery Document'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border-2 ${
                    themeMode === 'green'
                      ? 'bg-green-600 text-white border-green-500'
                      : themeMode === 'blue'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-zinc-700 text-white border-zinc-500'
                  }`}
                >
                  {eventType}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-12 bg-zinc-800/30 rounded-[2rem] border-2 border-dashed border-zinc-700 active:scale-95 text-center"
              >
                <div className="text-4xl">📸</div>
                <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                  Tap or click to capture photo of the BOL
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-12 bg-zinc-800/30 rounded-[2rem] border-2 border-dashed border-zinc-700 active:scale-95 text-center"
              >
                <div className="text-4xl">🖼️</div>
                <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 px-4">
                  Tap or click to add a picture you have already taken or saved
                </div>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-6">
              {uploadedFiles
                .filter((f) => f.category === 'bol')
                .map((f) => (
                  <div
                    key={f.id}
                    className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-zinc-800 relative animate-in zoom-in"
                  >
                    <img
                      src={f.preview}
                      className="w-full h-full object-cover"
                    />
                    <button
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

            <div className="mt-6 flex flex-col md:flex-row gap-4">
              {selectedLoad ? (
                <button
                  onClick={clearSelectedLoadButKeepDriver}
                  className="flex-1 py-4 rounded-2xl border border-zinc-700 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400"
                >
                  Change Assignment
                </button>
              ) : null}

              {manualMode ? (
                <button
                  onClick={() => {
                    setCurrentStage('ASSIGNMENT');
                  }}
                  className="flex-1 py-4 rounded-2xl border border-zinc-700 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400"
                >
                  Edit Manual Entry
                </button>
              ) : null}
            </div>
          </section>
        )}

        {hasAssignment &&
          currentStage !== 'ASSIGNMENT' &&
          !isConnecting &&
          eventType === 'PICKUP' && (
            <section
              className={`p-8 rounded-[2.5rem] border-2 animate-in slide-in-from-bottom ${
                solarMode
                  ? 'bg-white border-zinc-300'
                  : 'bg-zinc-900/30 border-orange-500/20'
              }`}
            >
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-orange-500">
                [ 04 ] Capacity Verification
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => freightCamRef.current?.click()}
                  className="flex flex-col items-center justify-center py-12 bg-orange-500/10 border-2 border-dashed border-orange-500/30 rounded-3xl active:scale-95 text-center"
                >
                  <div className="text-4xl">📸</div>
                  <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                    Capture freight photo
                  </div>
                </button>

                <button
                  onClick={() => freightFileRef.current?.click()}
                  className="flex flex-col items-center justify-center py-12 bg-orange-500/10 border-2 border-dashed border-orange-500/30 rounded-3xl active:scale-95 text-center"
                >
                  <div className="text-4xl">🖼️</div>
                  <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 px-4">
                    Add freight photo already taken or saved
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-6">
                {uploadedFiles
                  .filter((f) => f.category === 'freight')
                  .map((f) => (
                    <div
                      key={f.id}
                      className="aspect-square rounded-xl overflow-hidden border border-orange-900 relative"
                    >
                      <img
                        src={f.preview}
                        className="w-full h-full object-cover"
                      />
                      <button
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
            </section>
          )}

        <button
          onClick={() => {
            if (isReady) {
              setCurrentStage('REVIEW');
              setShowVerification(true);
            }
          }}
          disabled={!isReady}
          className={`w-full py-10 rounded-[3rem] font-black uppercase tracking-[1em] text-sm shadow-2xl transition-all ${
            isReady
              ? themeMode === 'green'
                ? 'bg-green-600 text-white animate-pulse'
                : themeMode === 'blue'
                  ? 'bg-blue-600 text-white animate-pulse'
                  : 'bg-zinc-200 text-black animate-pulse'
              : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
          }`}
        >
          Review Transmission
        </button>
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
                onClick={() => setShowFreightPrompt(false)}
                className="text-zinc-700 font-black uppercase text-[10px] tracking-widest py-4"
              >
                Not Required
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerification && (
        <div className="fixed inset-0 z-[600] bg-zinc-950 overflow-y-auto animate-in slide-in-from-right">
          <div className="max-w-xl mx-auto p-10 pb-56 space-y-12">
            <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-10">
              <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
                Command Review
              </h2>

              <button
                onClick={() => {
                  setShowVerification(false);
                  setCurrentStage('EVIDENCE');
                }}
                className="bg-zinc-900 text-zinc-400 px-6 py-2 rounded-full font-black text-[9px] uppercase border border-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { l: 'EVENT', v: eventType, id: 'eventType' },
                { l: 'OPERATOR', v: driverName, id: 'driverName' },
                { l: 'REFERENCE', v: loadNum || 'N/A', id: 'reference' },
                { l: 'LOAD ID', v: loadId || 'N/A', id: 'loadId' },
                { l: 'PICKUP', v: `${puCity}, ${puState}`, id: 'origin' },
                { l: 'DESTINATION', v: `${delCity}, ${delState}`, id: 'destination' },
                { l: 'CARRIER', v: effectiveCompany || 'N/A', id: 'company' }
              ].map((item) => (
                <div
                  key={item.l}
                  onClick={() => {
                    if (!['eventType', 'loadId', 'reference'].includes(item.id)) {
                      setEditingField(item.id);
                    }
                  }}
                  className="bg-zinc-900/50 p-7 rounded-[2.5rem] border-2 border-zinc-800 active:scale-95 transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                      {item.l}
                    </span>

                    {!['eventType', 'loadId', 'reference'].includes(item.id) ? (
                      <span className="text-[7px] font-black text-white/30 uppercase border border-white/10 px-2 py-0.5 rounded">
                        Tap to Edit
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xl font-bold text-white uppercase tracking-tight">
                    {item.v}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {uploadedFiles.map((f) => (
                <div
                  key={f.id}
                  className="aspect-[3/4] rounded-3xl overflow-hidden border-2 border-zinc-800 relative cursor-zoom-in"
                  onClick={() => setFullImage(f.preview)}
                >
                  <img src={f.preview} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-black/80 px-4 py-1 rounded-full text-[8px] font-black uppercase text-blue-500 border border-blue-500/30">
                    View {f.category}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                setIsSubmitting(true);

                const base64 = await Promise.all(
                  uploadedFiles.map(async (f) => {
                    return {
                      category: f.category,
                      base64: await new Promise((res) => {
                        const r = new FileReader();
                        r.onload = () => res(r.result);
                        r.readAsDataURL(f.file);
                      })
                    };
                  })
                );

                const payload = {
                  company: effectiveCompany,
                  driverName,
                  loadNum,
                  loadId,
                  puCity,
                  puState,
                  delCity,
                  delState,
                  origin: `${puCity} ${puState}`,
                  destination: `${delCity} ${delState}`,
                  bolProtocol: eventType,
                  files: base64
                };

                try {
                  await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(payload)
                  });
                  setShowSuccess(true);
                } catch (e) {
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
                        payload
                      }
                    ])
                  );

                  setShowSuccess(true);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className={`w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[1.2em] shadow-xl text-white ${
                themeMode === 'green'
                  ? 'bg-green-600'
                  : themeMode === 'blue'
                    ? 'bg-blue-600'
                    : 'bg-zinc-700'
              }`}
            >
              Authorize Uplink
            </button>

            <button
              onClick={() => {
                setShowVerification(false);
                setCurrentStage('EVIDENCE');
              }}
              className="w-full text-zinc-500 font-black uppercase text-[10px] tracking-widest py-4"
            >
              Back to Edit
            </button>
          </div>
        </div>
      )}

      {isSubmitting && !showSuccess && (
        <div className="fixed inset-0 z-[700] bg-black flex flex-col items-center justify-center p-8 animate-in zoom-in">
          <div className="relative w-64 h-64 mb-12">
            <div className="absolute inset-0 border-8 border-blue-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-4 border-4 border-blue-500/40 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center text-7xl animate-bounce">
              🛰️
            </div>
          </div>

          <h2 className="text-4xl font-black italic text-blue-500 uppercase tracking-tighter mb-4">
            Uplink Active
          </h2>
          <p className="text-orange-500 font-bold text-[11px] uppercase tracking-[0.4em] animate-pulse">
            Warning: Do not exit until handshake complete
          </p>
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
                <span className="text-zinc-500">REF ID:</span>
                <span className="text-white font-bold">{loadNum || 'N/A'}</span>
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
                  placeholder="OPERATOR NAME"
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
        accept="image/*"
        multiple
        onChange={(e) => onFileSelect(e, 'bol')}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={(e) => onFileSelect(e, 'bol')}
      />
      <input
        type="file"
        ref={freightCamRef}
        className="hidden"
        capture="environment"
        accept="image/*"
        multiple
        onChange={(e) => onFileSelect(e, 'freight')}
      />
      <input
        type="file"
        ref={freightFileRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={(e) => onFileSelect(e, 'freight')}
      />
    </div>
  );
};

export default App;