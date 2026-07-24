import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TerminalAppHeader from '../components/terminal/TerminalAppHeader.tsx';
import LogoutConfirmDialog from '../components/terminal/LogoutConfirmDialog.tsx';
import WorkflowEditBar from '../components/terminal/WorkflowEditBar.tsx';
import SwipeToSubmit from '../components/terminal/SwipeToSubmit.tsx';
import {
  TERMINAL_SHELL,
  TERMINAL_HEADER_OFFSET,
} from '../components/terminal/terminalLayout.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import {
  buildBolPodUploadPayload,
  savePayloadToVault,
  submitDocumentUpload,
} from '../utils/submissionUpload.ts';
import {
  getFileRejectionReason,
  isHeicFile,
  HEIC_BLOCK_MESSAGE,
  UPLOAD_FORMAT_HINT,
} from '../utils/uploadFileRules.ts';
import { GAS_WEB_APP_URL } from '../utils/gasWebAppUrl.ts';

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
  /** 0-based BOL page slot when category is bol */
  slotIndex?: number;
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

type ManualPodPickupMatchStatus =
  | 'PICKUP_MATCHES_BOL'
  | 'PICKUP_DOES_NOT_MATCH_BOL'
  | '';

const VISIBLE_FLOW_STEP_COUNT = 4;

const VISIBLE_FLOW_STEPS = [
  { label: 'Event Selected', short: 'Event' },
  { label: 'Logistics Path', short: 'Route' },
  { label: 'BOL & Photos', short: 'Documents' },
  { label: 'Review & Submit', short: 'Review' },
] as const;
type ManualCarrierOption = '' | 'BST Expedite Inc' | 'Greenleaf Xpress' | 'Other Carrier';

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

const BolPodWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { session: authSession, logout: authLogout } = useAuth();

  // Core
  const [solarMode, setSolarMode] = useState(false);

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
  const [bolNumAcknowledged, setBolNumAcknowledged] = useState(false);
  const [expectedBolPageCount, setExpectedBolPageCount] = useState<number | null>(null);
  const [bolSlotsEditMode, setBolSlotsEditMode] = useState(false);
  const [manualPodPickupMatchStatus, setManualPodPickupMatchStatus] =
    useState<ManualPodPickupMatchStatus>('');
  const [bolEditOpen, setBolEditOpen] = useState(false);
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [assignmentEditReturnStage, setAssignmentEditReturnStage] = useState<Stage | null>(
    null
  );
  const [reviewDraft, setReviewDraft] = useState({
    eventType: '' as EventType,
    manualCarrier: '' as ManualCarrierOption,
    puCity: '',
    puState: '',
    delCity: '',
    delState: '',
    bolNum: '',
  });

  const isAdminUploadMode = authSession?.authRole === 'admin';
  const canSelectAnyDriver = authSession?.canSelectAnyDriver ?? false;
  const adminDriverRequired = canSelectAnyDriver && !driverName.trim();

  const applyLoggedInDriver = (profile: DriverSessionProfile) => {
    if (profile.authRole === 'driver' && profile.driverName) {
      setDriverName(profile.driverName.toUpperCase());
      if (profile.companyCode) {
        const carrier = getCarrierDisplayName(profile.companyCode);
        if (carrier) setCompany(carrier);
      }
    }
  };

  const resetFlowState = () => {
    setEventType('');
    setBolProtocol('');
    setCurrentStage('EVENT');
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
    setBolNumAcknowledged(false);
    setBolEditOpen(false);
    setExpectedBolPageCount(null);
    setBolSlotsEditMode(false);
    bolFreightPromptShownRef.current = false;
    setReviewEditCard(null);
    setManualPodPickupMatchStatus('');
  };

  const handleLogout = () => {
    authLogout();
    setDriverName('');
    setShowLogoutConfirm(false);
    setAssignmentEditReturnStage(null);
    resetFlowState();
    navigate('/login', { replace: true });
  };

  const openAssignmentEdit = (returnStage: Stage) => {
    setAssignmentEditReturnStage(returnStage);
    setCurrentStage('ASSIGNMENT');
  };

  const exitAssignmentEdit = () => {
    if (assignmentEditReturnStage) {
      setCurrentStage(assignmentEditReturnStage);
    } else if (hasAssignment) {
      setCurrentStage('EVIDENCE');
    }
    setAssignmentEditReturnStage(null);
  };

  const confirmBolNumber = () => {
    if (!bolNum.trim()) return;
    setBolNumAcknowledged(true);
  };

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bolNumInputRef = useRef<HTMLInputElement>(null);
  const activeBolSlotRef = useRef<number | null>(null);
  const bolFreightPromptShownRef = useRef(false);
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

  const reviewTheme = useMemo(() => {
    const green = themeMode === 'green';
    const blue = themeMode === 'blue';

    return {
      swipeTheme: (green ? 'glx' : blue ? 'bst' : 'neutral') as 'bst' | 'glx' | 'neutral',
      cardFrame: green
        ? 'review-card-frame-glx'
        : blue
          ? 'review-card-frame-bst'
          : 'review-card-frame-neutral',
      stepActive: green
        ? 'bg-green-600 text-white ring-2 ring-green-400/40'
        : blue
          ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
          : 'bg-indigo-600 text-white ring-2 ring-indigo-400/40',
      stepActivePulse: green
        ? 'review-step-active-pulse-glx'
        : blue
          ? 'review-step-active-pulse-bst'
          : 'review-step-active-pulse-neutral',
      stepDone: green
        ? 'bg-green-600/20 text-green-400 border border-green-500/40'
        : blue
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
          : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40',
      stepLineGradient: green
        ? 'review-step-line-glx'
        : blue
          ? 'review-step-line-bst'
          : 'review-step-line-neutral',
      stepLabelActive: green ? 'text-green-400' : blue ? 'text-blue-400' : 'text-indigo-400',
      statusVerified:
        'text-emerald-400 bg-emerald-500/10 border-emerald-400/30 shadow-[0_0_12px_rgba(52,211,153,0.18)]',
      statusReady:
        'bg-emerald-600/20 text-emerald-400 border border-emerald-500/45 shadow-[0_0_14px_rgba(52,211,153,0.22)]',
      readyCardGlow: 'shadow-[0_0_28px_rgba(52,211,153,0.14)]',
      glassInteractive: green
        ? 'cursor-pointer transition-all duration-200 hover:shadow-[0_0_28px_rgba(34,197,94,0.16)] active:scale-[0.99]'
        : blue
          ? 'cursor-pointer transition-all duration-200 hover:shadow-[0_0_28px_rgba(59,130,246,0.16)] active:scale-[0.99]'
          : 'cursor-pointer transition-all duration-200 active:scale-[0.99]',
      glassActive: green
        ? 'ring-1 ring-green-400/35 shadow-[0_0_32px_rgba(34,197,94,0.2)]'
        : blue
          ? 'ring-1 ring-blue-400/35 shadow-[0_0_32px_rgba(59,130,246,0.2)]'
          : 'ring-1 ring-indigo-400/35 shadow-[0_0_32px_rgba(99,102,241,0.2)]',
      accentText: green ? 'text-green-400' : blue ? 'text-blue-400' : 'text-indigo-400',
      accentBorder: green ? 'border-green-400/10' : blue ? 'border-blue-400/10' : 'border-zinc-700/60',
      eventPill: green
        ? 'bg-green-500/10 border-green-400/20 text-green-300'
        : blue
          ? 'bg-blue-500/10 border-blue-400/20 text-blue-300'
          : 'bg-zinc-900/50 border-zinc-600/20 text-zinc-300',
      eventPillActive: green
        ? 'bg-green-600/25 border-green-400/45 text-green-200 shadow-[0_0_16px_rgba(34,197,94,0.25)]'
        : blue
          ? 'bg-blue-600/25 border-blue-400/45 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.25)]'
          : 'bg-indigo-600/25 border-indigo-400/45 text-indigo-200',
      carrierPillIdle: green
        ? 'bg-zinc-900/50 border-green-400/15 text-zinc-300'
        : blue
          ? 'bg-zinc-900/50 border-blue-400/15 text-zinc-300'
          : 'bg-zinc-900/50 border-zinc-700/40 text-zinc-300',
      pickupEditActive: green
        ? 'bg-green-500/10 border-green-400/25 shadow-[0_0_20px_rgba(34,197,94,0.12)]'
        : blue
          ? 'bg-blue-500/10 border-blue-400/25 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
          : 'bg-indigo-500/10 border-indigo-400/25',
      confirmBtn: green
        ? 'bg-green-600 text-white shadow-[0_0_12px_rgba(34,197,94,0.35)]'
        : blue
          ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]'
          : 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]',
      optionActive: green
        ? 'bg-green-600 border-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.35)]'
        : blue
          ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]'
          : 'bg-indigo-600 border-indigo-500 text-white',
      thumbBorder: green ? 'border-green-500/30' : blue ? 'border-blue-500/30' : 'border-indigo-500/30',
      thumbOverlay: green ? 'text-green-300' : blue ? 'text-blue-300' : 'text-indigo-300',
    };
  }, [themeMode]);

  const hasManualAssignmentData = !!(
    puCity &&
    puState &&
    delCity &&
    delState &&
    effectiveCompany &&
    effectiveCompany !== 'Other Carrier'
  );

  const hasAssignment = !!(selectedLoad || hasManualAssignmentData);

  const needsManualPodPickupConfirm =
    eventType === 'DELIVERY' && !selectedLoad && (manualMode || loadSelectionError);

  const isManualPodPickupConfirmed =
    !needsManualPodPickupConfirm ||
    manualPodPickupMatchStatus === 'PICKUP_MATCHES_BOL' ||
    manualPodPickupMatchStatus === 'PICKUP_DOES_NOT_MATCH_BOL';

  const manualPodPickupReviewLabel =
    manualPodPickupMatchStatus === 'PICKUP_MATCHES_BOL'
      ? 'Pickup city/state matches BOL shipper'
      : manualPodPickupMatchStatus === 'PICKUP_DOES_NOT_MATCH_BOL'
        ? 'Pickup city/state does not match BOL shipper'
        : '';

  const bolReviewFiles = uploadedFiles.filter((f) => f.category === 'bol');
  const bolReviewFilesOrdered = bolReviewFiles
    .slice()
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
  const getBolFileForSlot = (slotIndex: number) =>
    bolReviewFiles.find((f) => f.slotIndex === slotIndex) ?? null;
  const bolSlotsFilledCount =
    expectedBolPageCount != null
      ? Array.from({ length: expectedBolPageCount }, (_, i) => getBolFileForSlot(i)).filter(
          Boolean
        ).length
      : 0;
  const bolSlotsComplete =
    expectedBolPageCount != null && bolSlotsFilledCount === expectedBolPageCount;
  const hasBolEvidence = bolSlotsComplete;
  const hasBolNumber = !!bolNum.trim();
  const bolNumberStepDone = bolNumAcknowledged && hasBolNumber;
  const bolDocumentComplete = hasBolNumber && bolSlotsComplete;
  const bolGuideCollapsed = bolDocumentComplete && !bolEditOpen;

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

  const getVisibleFlowIndex = (): number => {
    if (showVerification) return 3;
    if (currentStage === 'EVIDENCE') return 2;
    if (currentStage === 'REVIEW') return 3;
    if (currentStage === 'ASSIGNMENT' || currentStage === 'OPERATOR') return 1;
    return 0;
  };

  const headerStepLabelsByVisible: Record<number, string> = {
    0: 'Select Document Event',
    1: 'Logistics Path',
    2: 'BOL Number + Document Photos',
    3: 'Review & Submit',
  };

  const headerStepIndex = getVisibleFlowIndex();
  const headerStepLabel = headerStepLabelsByVisible[headerStepIndex] || 'Workflow';
  const headerStepTotal = VISIBLE_FLOW_STEP_COUNT;

  const inpStyle = (v: string) =>
    `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none terminal-input ${
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

  const reviewCompactInput = solarMode
    ? 'w-full p-3 rounded-xl font-mono text-sm border border-zinc-300 bg-white text-black outline-none focus:ring-2 focus:ring-blue-500/40'
    : 'w-full p-3 rounded-xl font-mono text-sm border border-zinc-700 bg-black/80 text-white outline-none focus:ring-2 focus:ring-blue-500/40';

  const premiumPanel = solarMode
    ? 'rounded-[1.75rem] border border-zinc-200/90 bg-white/95 backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
    : 'terminal-module-panel';

  const activeFlowIndex = getVisibleFlowIndex();
  const bolPhotoCount = bolReviewFiles.length;
  const freightReviewFiles = uploadedFiles.filter((f) => f.category === 'freight');
  const freightPhotoCount = uploadedFiles.filter((f) => f.category === 'freight').length;
  const hasFreightPhotos = freightPhotoCount > 0;
  const showFreightWaived = freightNotRequired && !hasFreightPhotos;
  const freightDocumentComplete = showFreightWaived || hasFreightPhotos;
  const documentProgressTotal = eventType === 'PICKUP' ? 2 : 1;
  const documentProgressDone =
    (hasBolEvidence && bolNum.trim() ? 1 : 0) +
    (eventType === 'PICKUP' && freightDocumentComplete ? 1 : 0);
  const documentsReadyForReview =
    bolDocumentComplete &&
    (eventType === 'DELIVERY' || freightDocumentComplete);
  const carrierLockedFromDispatch = Boolean(selectedLoad);

  useEffect(() => {
    if (bolSlotsComplete) {
      setBolSlotsEditMode(false);
      if (
        eventType === 'PICKUP' &&
        !freightNotRequired &&
        !hasFreightPhotos &&
        !bolFreightPromptShownRef.current
      ) {
        bolFreightPromptShownRef.current = true;
        setTimeout(() => setShowFreightPrompt(true), 500);
      }
    } else {
      bolFreightPromptShownRef.current = false;
    }
  }, [bolSlotsComplete, eventType, freightNotRequired, hasFreightPhotos]);

  const returnToFreightDocuments = () => {
    setReviewEditCard(null);
    setShowVerification(false);
    setCurrentStage('EVIDENCE');
  };

  const handleDispatchSubmit = async () => {
    setIsSubmitting(true);
    setShowUploadFailure(false);
    setUploadFailureMessage('');
    setUploadSavedLocally(false);

    const base64 = await Promise.all(
      [
        ...uploadedFiles
          .filter((f) => f.category === 'bol')
          .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0)),
        ...uploadedFiles.filter((f) => f.category === 'freight'),
      ].map(async (f) => {
        return {
          category: f.category as 'bol' | 'freight',
          base64: await new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result || ''));
            r.readAsDataURL(f.file);
          }),
        };
      })
    );

    const payload = buildSubmissionPayload(base64);

    try {
      await submitDocumentUpload(payload);
      navigate('/submissions/success', {
        replace: true,
        state: { submissionType: 'BOL_POD' },
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Upload failed. Please try again.';

      try {
        savePayloadToVault(payload);
        setUploadSavedLocally(true);
      } catch {
        setUploadSavedLocally(false);
      }

      setUploadFailureMessage(message);
      setShowUploadFailure(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickupRouteLabel =
    puCity || puState
      ? `${puCity || '—'}${puState ? `, ${puState}` : ''}`
      : '—';
  const destinationRouteLabel =
    delCity || delState
      ? `${delCity || '—'}${delState ? `, ${delState}` : ''}`
      : '—';

  const reopenFreightWaiverChoice = () => {
    setFreightNotRequired(false);
  };

  const selectBolPageCount = (count: number) => {
    setExpectedBolPageCount(count);
    setBolSlotsEditMode(true);
    setUploadedFiles((prev) => prev.filter((f) => f.category !== 'bol'));
  };

  const resetBolNumberStep = () => {
    setBolNumAcknowledged(false);
    setExpectedBolPageCount(null);
    setBolSlotsEditMode(false);
    setUploadedFiles((prev) => prev.filter((f) => f.category !== 'bol'));
  };

  const removeBolSlot = (slotIndex: number) => {
    setUploadedFiles((prev) =>
      prev.filter((f) => !(f.category === 'bol' && f.slotIndex === slotIndex))
    );
    setBolSlotsEditMode(true);
  };

  const openBolSlotCamera = (slotIndex: number) => {
    activeBolSlotRef.current = slotIndex;
    cameraInputRef.current?.click();
  };

  const openBolSlotGallery = (slotIndex: number) => {
    activeBolSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  const showBolSlotUploaders = Boolean(
    expectedBolPageCount != null && (bolSlotsEditMode || !bolSlotsComplete)
  );

  const renderBolPageCountSelector = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <h3 className="text-lg sm:text-xl font-black text-white normal-case tracking-tight leading-snug">
        How many pages is your BOL paperwork?
      </h3>
      <p className="text-[11px] text-zinc-400 normal-case">
        Tap the number of pages you need to photograph.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {([1, 2, 3, 4] as const).map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => selectBolPageCount(count)}
            className="min-h-[56px] rounded-2xl border-2 border-blue-500/35 bg-blue-500/10 px-4 py-4 text-[13px] font-black uppercase tracking-[0.12em] text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.12)] transition-all active:scale-[0.98] hover:border-blue-400/55 hover:bg-blue-500/15"
          >
            {count === 4 ? '4+ Pages' : `${count} Page${count === 1 ? '' : 's'}`}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBolSlotCard = (slotIndex: number) => {
    if (expectedBolPageCount == null) return null;
    const file = getBolFileForSlot(slotIndex);
    const pageLabel = `Page ${slotIndex + 1} of ${expectedBolPageCount}`;

    if (file) {
      return (
        <div
          key={slotIndex}
          className="relative rounded-2xl overflow-hidden border-2 border-blue-500/40 bg-zinc-950/60 aspect-[4/3] shadow-[0_0_24px_rgba(59,130,246,0.1)]"
        >
          <img src={file.preview} className="w-full h-full object-cover" alt={pageLabel} />
          <button
            type="button"
            onClick={() => setFullImage(file.preview)}
            className="absolute inset-x-0 bottom-0 bg-black/70 text-[8px] font-black uppercase tracking-widest text-blue-200 py-2"
          >
            Tap to view
          </button>
          <button
            type="button"
            onClick={() => removeBolSlot(slotIndex)}
            aria-label={`Remove ${pageLabel}`}
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-red-600 border-2 border-red-400 text-white text-base font-black shadow-[0_0_16px_rgba(239,68,68,0.55)] flex items-center justify-center active:scale-95"
          >
            ✕
          </button>
          <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/65 text-[8px] font-black uppercase tracking-widest text-white">
            {pageLabel}
          </span>
        </div>
      );
    }

    if (!showBolSlotUploaders) return null;

    return (
      <div
        key={slotIndex}
        className="rounded-2xl border-2 border-dashed border-blue-500/40 bg-blue-500/5 p-4 space-y-3 animate-in fade-in duration-300"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
          {pageLabel}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openBolSlotCamera(slotIndex)}
            className="min-h-[72px] rounded-xl border border-dashed border-blue-400/50 bg-zinc-950/50 active:scale-[0.98] transition-all hover:border-blue-400/70 hover:shadow-[0_0_16px_rgba(59,130,246,0.15)]"
          >
            <div className="text-2xl mb-1">📸</div>
            <div className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-200">
              Take Photo
            </div>
          </button>
          <button
            type="button"
            onClick={() => openBolSlotGallery(slotIndex)}
            className="min-h-[72px] rounded-xl border border-dashed border-blue-400/50 bg-zinc-950/50 active:scale-[0.98] transition-all hover:border-blue-400/70 hover:shadow-[0_0_16px_rgba(59,130,246,0.15)]"
          >
            <div className="text-2xl mb-1">🖼️</div>
            <div className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-200">
              Choose Existing
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderBolSlotUploadFlow = () => {
    if (expectedBolPageCount == null) return null;

    return (
      <div className="space-y-4 bol-photos-reveal">
        {bolSlotsComplete && !bolSlotsEditMode ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-green-500/35 bg-green-500/10 px-4 py-4 shadow-[0_0_20px_rgba(34,197,94,0.12)]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-green-600/25 border border-green-500/40 flex items-center justify-center text-green-400 font-black shrink-0">
                ✓
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-green-300 leading-relaxed">
                Paperwork Completed ({bolSlotsFilledCount} of {expectedBolPageCount} Pages Attached)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBolSlotsEditMode(true)}
              className="shrink-0 w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_16px_rgba(59,130,246,0.35)] active:scale-[0.98]"
            >
              Change / Add
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: expectedBolPageCount }, (_, i) => renderBolSlotCard(i))}
        </div>

        <p className="text-[8px] text-zinc-600 normal-case">{UPLOAD_FORMAT_HINT}</p>
      </div>
    );
  };

  const accentRing =
    themeMode === 'green'
      ? 'ring-green-500/35 shadow-[0_0_20px_rgba(34,197,94,0.18)]'
      : themeMode === 'blue'
        ? 'ring-blue-500/35 shadow-[0_0_20px_rgba(59,130,246,0.22)]'
        : 'ring-zinc-600/35';

  const renderFlowStepper = () => (
    <div className={`${premiumPanel} p-4 sm:p-5 lg:p-6`}>
      <div className="flex items-center justify-between gap-1">
        {VISIBLE_FLOW_STEPS.map((step, idx) => {
          const done = idx < activeFlowIndex;
          const active = idx === activeFlowIndex;
          return (
            <div key={step.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="flex items-center w-full">
                {idx > 0 ? (
                  <div
                    className={`h-px flex-1 ${done || active ? (themeMode === 'green' ? 'bg-green-500/50' : 'bg-blue-500/50') : 'bg-zinc-800'}`}
                  />
                ) : (
                  <div className="flex-1" />
                )}
                <div
                  className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[8px] lg:text-[9px] font-black shrink-0 transition-all ${
                    active
                      ? `bg-blue-600 text-white ${accentRing} ring-2`
                      : done
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/35'
                        : 'bg-zinc-950 text-zinc-600 border border-zinc-800'
                  }`}
                >
                  {done ? '✓' : String(idx + 1).padStart(2, '0')}
                </div>
                {idx < VISIBLE_FLOW_STEPS.length - 1 ? (
                  <div
                    className={`h-px flex-1 ${done ? (themeMode === 'green' ? 'bg-green-500/50' : 'bg-blue-500/50') : 'bg-zinc-800'}`}
                  />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <span
                className={`text-[7px] lg:text-[8px] font-black uppercase tracking-[0.1em] truncate w-full text-center ${
                  active ? themeTextClass : done ? 'text-zinc-500' : 'text-zinc-700'
                }`}
              >
                {step.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWorkflowSectionHeader = (
    stepNum: number,
    badge: string,
    title: string,
    subtitle?: string
  ) => (
    <div className="px-1">
      <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
        [0{stepNum}] {badge}
      </p>
      <h3 className="text-lg lg:text-xl font-black uppercase tracking-tight text-white">
        {title}
      </h3>
      {subtitle ? (
        <p className="text-[10px] lg:text-sm text-zinc-500 normal-case mt-1">{subtitle}</p>
      ) : null}
    </div>
  );

  const renderManualPodPickupConfirm = () => {
    if (!needsManualPodPickupConfirm || !hasManualAssignmentData) return null;

    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-4 animate-in fade-in duration-300">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">
            POD pickup reference
          </p>
          <p className="text-sm text-zinc-400 normal-case mt-2 leading-relaxed">
            For this manual delivery, confirm how the pickup city/state below relates to the BOL
            shipper.
          </p>
          <p className="text-xs font-mono text-zinc-300 mt-2">
            {puCity}, {puState} → {delCity}, {delState}
          </p>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setManualPodPickupMatchStatus('PICKUP_MATCHES_BOL')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all min-h-[52px] ${
              manualPodPickupMatchStatus === 'PICKUP_MATCHES_BOL'
                ? 'border-green-500/50 bg-green-500/10 text-green-300'
                : 'border-zinc-700 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            <span className="text-[10px] font-bold normal-case leading-snug">
              The pickup city/state listed here matches the BOL.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setManualPodPickupMatchStatus('PICKUP_DOES_NOT_MATCH_BOL')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all min-h-[52px] ${
              manualPodPickupMatchStatus === 'PICKUP_DOES_NOT_MATCH_BOL'
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                : 'border-zinc-700 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            <span className="text-[10px] font-bold normal-case leading-snug">
              The pickup city/state listed here is not the shipper on the BOL.
            </span>
          </button>
        </div>
        {isManualPodPickupConfirmed ? (
          <p className="text-[9px] font-black uppercase tracking-widest text-green-400 text-center">
            ✓ Confirmed — continue to BOL entry below
          </p>
        ) : (
          <p className="text-[9px] text-zinc-600 normal-case text-center">
            Select one option to continue.
          </p>
        )}
      </div>
    );
  };

  const renderVerifiedSummary = (
    title: string,
    value: string,
    onChange?: () => void
  ) => (
    <div
      className={`${premiumPanel} terminal-verified-card p-5 flex items-center justify-between gap-3 animate-in fade-in duration-300 ${accentRing} ring-1`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-green-600/15 border border-green-500/40 flex items-center justify-center text-green-400 text-sm font-black shrink-0 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
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
          className="terminal-btn-ghost shrink-0 text-[8px] font-black uppercase tracking-widest text-blue-400 px-3 py-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 active:scale-95"
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
    if (canSelectAnyDriver && !driverName.trim()) {
      logUiDiag('resetFlowFromEvent_blocked', { nextEvent, reason: 'admin_driver_required' });
      return;
    }

    logUiDiag('resetFlowFromEvent', { nextEvent, clearsSelectedLoad: true });
    setEventType(nextEvent);
    setBolProtocol(nextEvent);

    if (authSession?.authRole === 'driver' && authSession.driverName) {
      setDriverName(authSession.driverName.toUpperCase());
      setCurrentStage('OPERATOR');
      setManualMode(false);
    } else if (canSelectAnyDriver) {
      // Admin upload: keep selected driver and manual-entry mode; advance to assignment.
      setCurrentStage('ASSIGNMENT');
    } else {
      setDriverName('');
      setCurrentStage('OPERATOR');
      setManualMode(false);
    }

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

    setBolNumAcknowledged(false);
    setExpectedBolPageCount(null);
    setBolSlotsEditMode(false);
    bolFreightPromptShownRef.current = false;
    setManualPodPickupMatchStatus('');
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
    setBolNumAcknowledged(false);
    setExpectedBolPageCount(null);
    setBolSlotsEditMode(false);
    bolFreightPromptShownRef.current = false;
    setShowFreightPrompt(false);
    setShowFreightConfirm(false);
    setFreightNotRequired(false);
    setIsConnecting(false);
    setCurrentStage('ASSIGNMENT');
  };

  const buildSubmissionPayload = (
    files: { category: 'bol' | 'freight'; base64: string }[]
  ) => {
    const payloadLoadNum = assignedLoadNumber || 'NA';
    const payloadLoadId = selectedLoad
      ? String(selectedLoad.loadId || '').trim()
      : String(loadId || '').trim();

    return buildBolPodUploadPayload({
      company: effectiveCompany,
      driverName,
      loadNum: payloadLoadNum,
      loadId: payloadLoadId || undefined,
      bolNum: bolNum.trim(),
      bolProtocol: eventType as 'PICKUP' | 'DELIVERY',
      puCity,
      puState,
      delCity,
      delState,
      files,
    });
  };

  useEffect(() => {
    if (authSession?.authRole === 'driver') {
      applyLoggedInDriver(authSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      eventType &&
      driverName &&
      !canSelectAnyDriver &&
      currentStage === 'OPERATOR'
    ) {
      setCurrentStage('ASSIGNMENT');
    }
  }, [eventType, driverName, canSelectAnyDriver, currentStage]);

  useEffect(() => {
    if (!authSession || !canSelectAnyDriver) return;

    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=getDrivers`);
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
  }, [authSession, canSelectAnyDriver]);

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
          `${GAS_WEB_APP_URL}?action=getDriverLoads&driver=${encodeURIComponent(
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

    if (willAdvanceToEvidence && isManualPodPickupConfirmed) {
      setCurrentStage('EVIDENCE');
    }
  }, [
    manualMode,
    loadSelectionError,
    hasManualAssignmentData,
    selectedLoad,
    isManualPodPickupConfirmed,
  ]);

  useEffect(() => {
    if (hasAssignment && currentStage === 'EVIDENCE' && !bolNumberStepDone && !bolGuideCollapsed) {
      const timer = window.setTimeout(() => bolNumInputRef.current?.focus(), 350);
      return () => window.clearTimeout(timer);
    }
  }, [hasAssignment, currentStage, bolNumberStepDone, bolGuideCollapsed]);

  useEffect(() => {
    setManualPodPickupMatchStatus('');
  }, [puCity, puState, delCity, delState, eventType]);

  useEffect(() => {
    if (bolDocumentComplete) {
      setBolEditOpen(false);
    }
  }, [bolDocumentComplete]);

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
    setAssignmentEditReturnStage(null);
    setManualPodPickupMatchStatus('');
  };

  const onFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    cat: 'bol' | 'freight',
    bolSlotIndex?: number
  ) => {
    if (e.target.files) {
      const files =
        cat === 'bol' && bolSlotIndex != null
          ? Array.from(e.target.files).slice(0, 1)
          : Array.from(e.target.files);

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
            const withoutSlot =
              cat === 'bol' && bolSlotIndex != null
                ? prev.filter(
                    (item) => !(item.category === 'bol' && item.slotIndex === bolSlotIndex)
                  )
                : prev;
            return [
              ...withoutSlot,
              {
                file: enh,
                preview: URL.createObjectURL(enh),
                id: Math.random().toString(),
                category: cat,
                fingerprint,
                ...(cat === 'bol' && bolSlotIndex != null ? { slotIndex: bolSlotIndex } : {}),
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
          {renderWorkflowSectionHeader(2, 'Logistics Path', 'Logistics Path')}
          {renderVerifiedSummary(
            'Route confirmed',
            `${puCity}, ${puState} → ${delCity}, ${delState}`,
            () => openAssignmentEdit('EVIDENCE')
          )}
          <div className="text-center space-y-1 px-2">
            {renderAssignmentLoadRef()}
            {String(loadId || '').trim() && selectedLoad ? (
              <p className="text-[9px] font-mono text-zinc-600 normal-case">
                Load ID: <span className="text-zinc-400">{String(loadId).trim()}</span>
              </p>
            ) : null}
            <p className="text-[9px] text-zinc-500 normal-case">{reviewCarrierDisplay}</p>
          </div>
        </section>
      );
    }

    return (
      <section className={panelBase}>
        {assignmentEditReturnStage ? (
          <button
            type="button"
            onClick={exitAssignmentEdit}
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors mb-1 -mt-1"
          >
            <span aria-hidden>←</span>
            Back
          </button>
        ) : null}
        {renderWorkflowSectionHeader(
          2,
          'Logistics Path',
          'Logistics Path',
          'Confirm pickup and delivery for this stop.'
        )}

        <div className={`${premiumPanel} p-5 sm:p-6 lg:p-8`}>
        <div className="flex justify-end items-center mb-4 gap-4 min-h-[1.25rem]">
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
                Finding your load...
              </span>
            </div>
          )}
        </div>

        {isScanning ? (
          <div className="min-h-[280px] lg:min-h-[320px] rounded-[2rem] border-2 border-dashed border-zinc-800 bg-black/30 flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-500">
            <ConnectingGlyph
              accentClass={
                themeMode === 'green'
                  ? 'border-green-500 text-green-400'
                  : 'border-blue-500 text-blue-400'
              }
            />
            <div
              className={`mt-6 text-xl lg:text-2xl font-black uppercase tracking-[0.35em] ${
                themeMode === 'green' ? 'text-green-400' : 'text-blue-400'
              }`}
            >
              Looking up your loads...
            </div>
            <div className="mt-3 text-[10px] lg:text-xs font-black uppercase tracking-[0.25em] text-zinc-500 max-w-md leading-relaxed">
              Matching your active assignments
            </div>
          </div>
        ) : isConnecting ? (
          <div className="min-h-[280px] lg:min-h-[320px] rounded-[2rem] border-2 border-dashed border-zinc-800 bg-black/30 flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-500">
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
                Route confirmed
              </div>
              <p className="text-base font-bold text-white font-mono">
                {puCity}, {puState} → {delCity}, {delState}
              </p>

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

              {assignedLoadNumber || String(loadId || '').trim() ? (
                <div className="pt-2 border-t border-zinc-800/60 space-y-1">
                  {assignedLoadNumber ? (
                    <p className="text-[9px] font-mono text-zinc-500 normal-case">
                      Load # <span className="text-zinc-300">{assignedLoadNumber}</span>
                    </p>
                  ) : null}
                  {String(loadId || '').trim() ? (
                    <p className="text-[9px] font-mono text-zinc-500 normal-case">
                      Load ID <span className="text-zinc-300">{String(loadId).trim()}</span>
                    </p>
                  ) : null}
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
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 animate-in fade-in slide-in-from-top duration-500">
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
                  className={`terminal-load-card w-full p-6 rounded-[2rem] border-2 text-left transition-all active:scale-[0.99] ${
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
                setManualPodPickupMatchStatus('');
                setCurrentStage('ASSIGNMENT');
              }}
              className="w-full py-4 rounded-xl border border-dashed border-zinc-700/80 bg-zinc-950/40 text-[9px] font-black text-zinc-500 uppercase tracking-[0.25em] hover:border-blue-500/40 hover:text-blue-400 transition-colors lg:col-span-2"
            >
              Load not listed — enter manually
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
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-3 mb-2 space-y-1">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-400">
                  Manual route entry
                </p>
                <p className="text-[10px] text-zinc-500 normal-case">
                  Enter pickup, delivery, and carrier for this stop.
                </p>
                {renderAssignmentLoadRef()}
              </div>
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

            {hasManualAssignmentData ? (
              <div className="rounded-xl border border-green-500/25 bg-green-500/5 px-4 py-3 animate-in fade-in duration-300">
                <p className="text-[8px] font-black uppercase tracking-widest text-green-400">
                  Route entered
                </p>
                <p className="text-sm font-bold text-white mt-1 font-mono">
                  {puCity}, {puState} → {delCity}, {delState}
                </p>
                {isManualPodPickupConfirmed ? (
                  <p className="text-[10px] text-zinc-400 normal-case mt-2">
                    Logistics path saved — continue to BOL entry when ready.
                  </p>
                ) : needsManualPodPickupConfirm ? (
                  <p className="text-[10px] text-zinc-500 normal-case mt-2">
                    Confirm the POD pickup reference below to continue.
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 normal-case mt-2">
                    Your route is ready — continue to BOL entry below.
                  </p>
                )}
              </div>
            ) : null}

            {renderManualPodPickupConfirm()}

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

  return (
    <div
      className={`min-h-screen transition-all duration-700 pb-32 ${
        solarMode ? 'bg-zinc-100 text-black' : 'terminal-app-bg text-zinc-100'
      }`}
    >
      <TerminalAppHeader
        solarMode={solarMode}
        stepLabel={headerStepLabel}
        stepIndex={headerStepIndex}
        stepTotal={headerStepTotal}
        isAdmin={isAdminUploadMode}
        maskedEmail={authSession?.maskedEmail}
        eventType={eventType || undefined}
        companyLabel={effectiveCompany || undefined}
        themeBorderClass={themeBorderClass}
        themeBgClass={themeBgClass}
        themeTextClass={themeTextClass}
        onLogoutRequest={() => setShowLogoutConfirm(true)}
        onToggleSolar={() => setSolarMode(!solarMode)}
      />

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {assignmentEditReturnStage ? (
        <WorkflowEditBar onBack={exitAssignmentEdit} />
      ) : null}

      {effectiveCompany ? (
        <div className={`${TERMINAL_SHELL} ${TERMINAL_HEADER_OFFSET} pb-2`}>
          <div
            className={`${premiumPanel} px-4 py-3 flex items-center justify-center min-h-[72px] overflow-hidden`}
          >
            {effectiveCompany === 'Greenleaf Xpress' ? (
              <GreenleafLogo />
            ) : effectiveCompany === 'BST Expedite Inc' ? (
              <BstLogo />
            ) : (
              <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">
                {effectiveCompany}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={TERMINAL_HEADER_OFFSET} aria-hidden />
      )}

      <div className={`${TERMINAL_SHELL} mb-4`}>
        <button
          type="button"
          onClick={() => navigate('/capture')}
          className="text-[8px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Back to Submit
        </button>
      </div>

      <div className={`${TERMINAL_SHELL} mb-6`}>{renderFlowStepper()}</div>

      <div className={`${TERMINAL_SHELL} space-y-5 lg:space-y-6`}>
        {!canSelectAnyDriver && authSession?.driverName ? (
          <section className={`${premiumPanel} p-5 sm:p-6 lg:p-8 border-blue-500/15`}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Good to see you, {authSession.driverName}
            </h2>
            <p className="text-sm lg:text-base text-zinc-400 normal-case mt-2">
              Let&apos;s get your paperwork submitted.
            </p>
          </section>
        ) : null}

        {canSelectAnyDriver ? (
          <section className="space-y-3">
            <div className={`${premiumPanel} p-4 sm:p-5 lg:p-6 space-y-3`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.15em] border border-amber-500/50 bg-amber-500/15 text-amber-300">
                  Admin Upload Mode
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 normal-case">
                Select the driver you are submitting paperwork for.
              </p>
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
                      setManualPodPickupMatchStatus('');
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
                      setManualPodPickupMatchStatus('');
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
                />
              )}
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          {renderWorkflowSectionHeader(1, 'Event Selected', 'Select Document Event')}

          {eventType && currentStageIndex > 0 ? (
            renderVerifiedSummary(
              'Event selected',
              eventType === 'DELIVERY' ? 'Delivery / POD' : 'Pickup',
              () => setCurrentStage('EVENT')
            )
          ) : (
            <div className={`${premiumPanel} p-4 sm:p-5 lg:p-6`}>
              {canSelectAnyDriver && adminDriverRequired ? (
                <p className="text-[10px] text-amber-400/90 normal-case mb-3 leading-relaxed">
                  Select a driver above before choosing pickup or delivery.
                </p>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <button
                  type="button"
                  disabled={adminDriverRequired}
                  onClick={() => resetFlowFromEvent('PICKUP')}
                  className={`py-8 lg:py-10 rounded-2xl border font-black uppercase tracking-widest text-[11px] lg:text-xs transition-all active:scale-[0.98] ${
                    adminDriverRequired
                      ? 'opacity-50 cursor-not-allowed bg-zinc-950/50 border-zinc-800 text-zinc-600'
                      : eventType === 'PICKUP'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)]'
                        : 'bg-zinc-950/80 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  disabled={adminDriverRequired}
                  onClick={() => resetFlowFromEvent('DELIVERY')}
                  className={`py-8 lg:py-10 rounded-2xl border font-black uppercase tracking-widest text-[11px] lg:text-xs transition-all active:scale-[0.98] ${
                    adminDriverRequired
                      ? 'opacity-50 cursor-not-allowed bg-zinc-950/50 border-zinc-800 text-zinc-600'
                      : eventType === 'DELIVERY'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)]'
                        : 'bg-zinc-950/80 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  Delivery / POD
                </button>
              </div>
            </div>
          )}
        </section>

        {driverName && eventType && renderAssignmentPanel()}

        {hasAssignment && currentStage !== 'ASSIGNMENT' && !isConnecting && isManualPodPickupConfirmed && (
          <section className="space-y-4">
            {renderWorkflowSectionHeader(
              3,
              'BOL Number + Document Photos',
              'BOL Number + Document Photos',
              'Enter your BOL number, then add photos of the paperwork.'
            )}
            {bolGuideCollapsed ? (
              renderVerifiedSummary(
                'BOL complete',
                `BOL # ${bolNum} · ${bolSlotsFilledCount} of ${expectedBolPageCount ?? bolPhotoCount} page${(expectedBolPageCount ?? bolPhotoCount) === 1 ? '' : 's'}`,
                () => setBolEditOpen(true)
              )
            ) : (
              <div
                className={`${premiumPanel} p-5 sm:p-6 lg:p-8 space-y-4 ${
                  bolNumberStepDone && !bolDocumentComplete
                    ? 'ring-2 ring-blue-500/40 shadow-[0_0_32px_rgba(59,130,246,0.12)] animate-in slide-in-from-bottom-4 duration-500'
                    : ''
                }`}
              >
                {!bolNumberStepDone ? (
                  <div className="space-y-4 bol-input-step">
                    <label
                      htmlFor="bol-number-input"
                      className="block text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400"
                    >
                      BOL Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="bol-number-input"
                      ref={bolNumInputRef}
                      className={`${inpStyle(bolNum)} ring-2 ring-blue-500/50 border-blue-500/60 shadow-[0_0_24px_rgba(59,130,246,0.15)]`}
                      placeholder="Enter the BOL number from your paperwork (not the load number)"
                      value={bolNum}
                      onChange={(e) => {
                        const next = e.target.value.trim();
                        setBolNum(next);
                        if (!next) setBolNumAcknowledged(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && bolNum.trim()) {
                          e.preventDefault();
                          confirmBolNumber();
                        }
                      }}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      disabled={!hasBolNumber}
                      onClick={confirmBolNumber}
                      className={`w-full min-h-[52px] rounded-xl font-black uppercase tracking-[0.22em] text-[13px] transition-all duration-300 ${
                        hasBolNumber
                          ? 'bol-continue-btn text-white shadow-[0_4px_24px_rgba(37,99,235,0.4)] active:scale-[0.98]'
                          : 'bg-zinc-900/80 border border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      Continue to Photos →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80 bol-summary-collapse">
                      <div className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
                          BOL Number
                        </p>
                        <p className="text-lg font-bold text-white font-mono tracking-tight truncate">
                          {bolNum}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetBolNumberStep}
                        className="shrink-0 text-[8px] font-black uppercase tracking-widest text-blue-400 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10"
                      >
                        Edit
                      </button>
                    </div>

                    {expectedBolPageCount == null
                      ? renderBolPageCountSelector()
                      : renderBolSlotUploadFlow()}
                  </div>
                )}
              </div>
            )}

            {bolDocumentComplete && eventType === 'PICKUP' ? (
              showFreightWaived ? (
                <div
                  className={`${premiumPanel} p-4 border-amber-500/25 space-y-3 animate-in fade-in duration-300`}
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
                  {documentsReadyForReview && isReady ? (
                    <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400">
                        ✓ Documents complete
                      </p>
                      <p className="text-[10px] text-zinc-300 normal-case mt-1">
                        Scroll down and tap <span className="text-white font-bold">Ready for review</span> to continue.
                      </p>
                    </div>
                  ) : null}
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
                    {!freightDocumentComplete ? (
                      <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-300">
                          Next — freight photos
                        </p>
                        <p className="text-[10px] text-zinc-400 normal-case mt-1">
                          Document freight on the trailer, or tap Not Required if dispatch waived it.
                        </p>
                      </div>
                    ) : null}
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

            {documentsReadyForReview && isReady ? (
              <div
                className={`${premiumPanel} p-5 border-green-500/45 ring-2 ring-green-500/30 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-green-600/20 border border-green-500/50 flex items-center justify-center text-green-400 text-lg font-black shrink-0 shadow-[0_0_16px_rgba(34,197,94,0.35)]">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">
                      You&apos;re all set
                    </p>
                    <p className="text-[10px] text-zinc-400 normal-case mt-0.5 leading-relaxed">
                      {showFreightWaived
                        ? 'BOL complete and freight photos waived.'
                        : eventType === 'DELIVERY'
                          ? 'Your BOL number and photos are complete.'
                          : 'Your BOL and freight documents are complete.'}{' '}
                      Tap below to review before sending.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStage('REVIEW');
                    setShowVerification(true);
                  }}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.25em] text-[10px] text-white transition-all active:scale-[0.98] animate-pulse ${
                    themeMode === 'green'
                      ? 'bg-green-600 shadow-[0_0_24px_rgba(34,197,94,0.45)]'
                      : 'bg-blue-600 shadow-[0_0_24px_rgba(59,130,246,0.45)]'
                  }`}
                >
                  Ready for review →
                </button>
              </div>
            ) : (
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
                  {!bolNumberStepDone ? (
                    <p className="text-[9px] text-blue-400/80 normal-case mt-0.5">
                      Enter your BOL number to continue
                    </p>
                  ) : !bolDocumentComplete ? (
                    <p className="text-[9px] text-blue-400/80 normal-case mt-0.5">
                      {expectedBolPageCount == null
                        ? 'Select how many BOL pages to photograph'
                        : `Fill all ${expectedBolPageCount} page slot${expectedBolPageCount === 1 ? '' : 's'} to continue`}
                    </p>
                  ) : eventType === 'PICKUP' && !freightDocumentComplete ? (
                    <p className="text-[9px] text-zinc-500 normal-case mt-0.5">
                      Add freight photos or mark not required
                    </p>
                  ) : null}
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
            )}

            <p className="text-center text-[8px] text-zinc-600 normal-case flex items-center justify-center gap-1.5">
              <span>🔒</span>
              Ready for review — submit when your documents look correct.
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
        <div className="fixed inset-x-0 bottom-0 top-[3.75rem] sm:top-[4.25rem] z-[600] bg-[#050508] overflow-y-auto animate-in slide-in-from-right">
          <div className={`${TERMINAL_SHELL} py-2 sm:py-3 lg:py-6 pb-20 sm:pb-24 space-y-2.5 sm:space-y-3 lg:space-y-5 lg:max-w-6xl lg:mx-auto`}>
            <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  setReviewEditCard(null);
                  setShowVerification(false);
                  setCurrentStage('EVIDENCE');
                }}
                className="min-h-[36px] px-3 text-zinc-500 font-black uppercase text-[8px] tracking-widest border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors"
              >
                Close ✕
              </button>
            </div>

            <div className="flex items-center justify-between gap-1 px-0.5 pt-0.5 pb-1 lg:max-w-3xl lg:mx-auto">
              {[
                { label: 'Event', done: true },
                { label: 'Route', done: true },
                { label: 'Documents', done: hasBolEvidence },
                { label: 'Review', done: false, active: true },
              ].map((step, idx) => (
                <div key={step.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="flex items-center w-full">
                    {idx > 0 ? (
                      <div
                        className={`h-px flex-1 ${
                          step.done || step.active
                            ? reviewTheme.stepLineGradient
                            : 'bg-zinc-800'
                        }`}
                      />
                    ) : (
                      <div className="flex-1" />
                    )}
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 transition-all ${
                        step.active
                          ? `${reviewTheme.stepActive} ${reviewTheme.stepActivePulse}`
                          : step.done
                            ? reviewTheme.stepDone
                            : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                      }`}
                    >
                      {step.done && !step.active ? '✓' : step.active ? '●' : ''}
                    </div>
                    {idx < 3 ? (
                      <div
                        className={`h-px flex-1 ${
                          step.done ? reviewTheme.stepLineGradient : 'bg-zinc-800'
                        }`}
                      />
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                  <span
                    className={`text-[6px] sm:text-[7px] font-black uppercase tracking-[0.12em] truncate w-full text-center ${
                      step.active
                        ? reviewTheme.stepLabelActive
                        : step.done
                          ? 'text-zinc-500'
                          : 'text-zinc-700'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 sm:space-y-3 lg:grid lg:grid-cols-[3fr_2fr] lg:gap-5 lg:items-start lg:space-y-0">
              <div className="space-y-2.5 sm:space-y-3">
            <section className="space-y-1.5">
              <h3 className="text-[8px] font-black uppercase tracking-[0.32em] text-zinc-500 px-0.5">
                Trip Ticket
              </h3>

              <div
                className={`review-card-frame ${reviewTheme.cardFrame} ${
                  ['event', 'carrier', 'pickup', 'destination'].includes(reviewEditCard || '')
                    ? reviewTheme.glassActive
                    : ''
                }`}
              >
              <div className="review-card-frame-inner overflow-hidden">
                {manualPodPickupReviewLabel ? (
                  <div className="px-3 py-2 bg-amber-500/[0.08] border-b border-amber-500/20">
                    <p className="text-[7px] font-black uppercase tracking-[0.18em] text-amber-400">
                      POD pickup reference
                    </p>
                    <p className="text-[10px] text-zinc-300 normal-case mt-0.5 leading-snug">
                      {manualPodPickupReviewLabel}
                    </p>
                  </div>
                ) : null}

                <div className="p-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openReviewEdit('event')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[7px] font-black uppercase tracking-[0.16em] transition-all ${reviewTheme.glassInteractive} ${
                        reviewEditCard === 'event'
                          ? reviewTheme.eventPillActive
                          : reviewTheme.eventPill
                      }`}
                      aria-label="Edit event type"
                    >
                      <span aria-hidden>📦</span>
                      {eventType || 'Event'}
                    </button>
                    {carrierLockedFromDispatch ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-zinc-900/60 border-zinc-700/50 text-[7px] font-black uppercase tracking-[0.16em] text-zinc-400">
                        <span aria-hidden>🚛</span>
                        {reviewCarrierDisplay}
                        <span className="text-[7px] text-zinc-600 normal-case tracking-normal">
                          🔒
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openReviewEdit('carrier')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[7px] font-black uppercase tracking-[0.16em] transition-all ${reviewTheme.glassInteractive} ${
                          reviewEditCard === 'carrier'
                            ? reviewTheme.eventPillActive
                            : reviewTheme.carrierPillIdle
                        }`}
                        aria-label="Edit carrier"
                      >
                        <span aria-hidden>🚛</span>
                        {reviewCarrierDisplay}
                      </button>
                    )}
                  </div>

                  <div className="relative pl-1">
                    <div
                      className="absolute left-[1.2rem] top-4 bottom-4 w-px bg-gradient-to-b from-blue-500/75 via-blue-400/40 to-green-500/55 pointer-events-none"
                      aria-hidden
                    />

                    <button
                      type="button"
                      onClick={() => openReviewEdit('pickup')}
                      className={`w-full text-left rounded-lg px-2.5 py-2 -ml-1 border border-transparent ${reviewTheme.glassInteractive} ${
                        reviewEditCard === 'pickup'
                          ? reviewTheme.pickupEditActive
                          : 'hover:bg-white/[0.02]'
                      }`}
                      aria-label="Edit pickup location"
                    >
                        <div className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.65)] ring-2 ring-blue-400/30" />
                        </div>
                        <div className="min-w-0 flex-1 pb-0.5">
                          <p className="text-[6px] font-black uppercase tracking-[0.2em] text-blue-400/90">
                            Pickup
                          </p>
                          <p className="text-[12px] font-bold text-white uppercase tracking-tight mt-0.5 truncate">
                            {pickupRouteLabel}
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openReviewEdit('destination')}
                      className={`w-full text-left rounded-lg px-2.5 py-2 -ml-1 border border-transparent ${reviewTheme.glassInteractive} ${
                        reviewEditCard === 'destination'
                          ? 'bg-green-500/10 border-green-400/25 shadow-[0_0_16px_rgba(34,197,94,0.1)]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                      aria-label="Edit destination"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.55)] ring-2 ring-green-400/30" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[6px] font-black uppercase tracking-[0.2em] text-green-400/90">
                            Destination
                          </p>
                          <p className="text-[12px] font-bold text-white uppercase tracking-tight mt-0.5 truncate">
                            {destinationRouteLabel}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {reviewEditCard === 'event' ||
                reviewEditCard === 'carrier' ||
                reviewEditCard === 'pickup' ||
                reviewEditCard === 'destination' ? (
                  <div className={`px-3 pb-3 pt-0 border-t ${reviewTheme.accentBorder} animate-in slide-in-from-top-2 duration-300`}>
                    {reviewEditCard === 'event' ? (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {(['PICKUP', 'DELIVERY'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setReviewDraft((d) => ({ ...d, eventType: opt }))
                            }
                            className={`py-2.5 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${
                              reviewDraft.eventType === opt
                                ? reviewTheme.optionActive
                                : 'bg-zinc-950/80 border-zinc-800 text-zinc-500'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {reviewEditCard === 'carrier' ? (
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

                    {reviewEditCard === 'pickup' ? (
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

                    {reviewEditCard === 'destination' ? (
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

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={cancelReviewEdit}
                        className="flex-1 py-2 rounded-xl border border-zinc-700/80 text-[8px] font-black uppercase tracking-widest text-zinc-500 active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={confirmReviewEdit}
                        className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 ${reviewTheme.confirmBtn}`}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              </div>
            </section>

            <div
              className={`review-card-frame ${reviewTheme.cardFrame} ${
                isReady ? `${reviewTheme.glassActive} ${reviewTheme.readyCardGlow}` : ''
              }`}
            >
            <div className="review-card-frame-inner p-2.5 sm:p-3 lg:p-4 space-y-2 lg:space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                    isReady
                      ? reviewTheme.statusReady
                      : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                  }`}
                >
                  {isReady ? '✓' : '·'}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-[9px] font-black uppercase tracking-[0.22em] ${
                      isReady ? 'text-emerald-300' : 'text-zinc-500'
                    }`}
                  >
                    Ready to Submit
                  </p>
                  <p className="text-[8px] text-zinc-500 normal-case tracking-normal mt-0.5 hidden sm:block">
                    {isReady
                      ? 'Swipe right to submit.'
                      : 'Complete your documents before submitting.'}
                  </p>
                </div>
              </div>

              <SwipeToSubmit
                disabled={!isReady}
                loading={isSubmitting}
                onSubmit={handleDispatchSubmit}
                idleLabel="Swipe to submit →"
                slidingLabel="Keep sliding…"
                doneLabel="Submitting…"
                theme={reviewTheme.swipeTheme}
              />
            </div>
            </div>
              </div>

            <section className="space-y-1.5 lg:sticky lg:top-4">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-[8px] font-black uppercase tracking-[0.32em] text-zinc-500">
                  Documents & Photos
                </h3>
                <span
                  className={`text-[6px] font-black uppercase tracking-widest flex items-center gap-1 ${reviewTheme.accentText}`}
                >
                  <span>✓</span>
                  {uploadedFiles.length} item{uploadedFiles.length === 1 ? '' : 's'}
                </span>
              </div>

              <div
                className={`review-card-frame ${reviewTheme.cardFrame} ${
                  reviewEditCard === 'bol' ? reviewTheme.glassActive : ''
                }`}
              >
              <div className="review-card-frame-inner overflow-hidden">
                <div className="flex items-center gap-2 p-2 sm:p-2.5 lg:p-3">
                  {bolReviewFilesOrdered[0] ? (
                    <button
                      type="button"
                      onClick={() => setFullImage(bolReviewFilesOrdered[0].preview)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border ${reviewTheme.thumbBorder} relative`}
                      aria-label="View BOL photo"
                    >
                      <img
                        src={bolReviewFilesOrdered[0].preview}
                        className="w-full h-full object-cover"
                        alt="BOL"
                      />
                      {bolReviewFilesOrdered.length > 1 ? (
                        <span className="absolute top-0.5 right-0.5 min-w-[1rem] h-4 px-1 rounded bg-black/75 text-[6px] font-black text-white flex items-center justify-center">
                          +{bolReviewFilesOrdered.length - 1}
                        </span>
                      ) : null}
                      <span
                        className={`absolute inset-x-0 bottom-0 bg-black/75 text-[5px] font-black uppercase ${reviewTheme.thumbOverlay} py-0.5 text-center`}
                      >
                        Tap to view
                      </span>
                    </button>
                  ) : (
                    <div className="shrink-0 w-14 h-14 rounded-lg border border-dashed border-zinc-700/80 bg-zinc-950/50" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[7px] font-black uppercase tracking-[0.16em] leading-tight ${reviewTheme.accentText}`}
                    >
                      BOL (Proof of Load)
                    </p>
                    <p className="text-[10px] font-bold text-white truncate leading-tight mt-0.5">
                      BOL # {bolNum || '—'}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full border ${reviewTheme.statusVerified}`}
                  >
                    ✓ Verified
                  </span>

                  <button
                    type="button"
                    onClick={() => openReviewEdit('bol')}
                    className="shrink-0 w-8 h-8 rounded-lg border border-zinc-700/70 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
                    aria-label="Edit BOL number"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                </div>

                {reviewEditCard === 'bol' ? (
                  <div className={`px-2.5 pb-2.5 pt-0 border-t ${reviewTheme.accentBorder} animate-in slide-in-from-top-2`}>
                    <input
                      className={`${reviewCompactInput} mt-2`}
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
                        className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase text-white ${reviewTheme.confirmBtn}`}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              </div>

              {eventType === 'PICKUP' ? (
                <div className={`review-card-frame ${reviewTheme.cardFrame}`}>
                <div className="review-card-frame-inner overflow-hidden">
                  <div className="flex items-center gap-2 p-2 sm:p-2.5 lg:p-3">
                    {freightReviewFiles[0] ? (
                      <button
                        type="button"
                        onClick={() => setFullImage(freightReviewFiles[0].preview)}
                        className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-green-500/30 relative"
                        aria-label="View freight photo"
                      >
                        <img
                          src={freightReviewFiles[0].preview}
                          className="w-full h-full object-cover"
                          alt="Freight"
                        />
                        {freightReviewFiles.length > 1 ? (
                          <span className="absolute top-0.5 right-0.5 min-w-[1rem] h-4 px-1 rounded bg-black/75 text-[6px] font-black text-white flex items-center justify-center">
                            +{freightReviewFiles.length - 1}
                          </span>
                        ) : null}
                        <span className="absolute inset-x-0 bottom-0 bg-black/75 text-[5px] font-black uppercase text-green-300 py-0.5 text-center">
                          Tap to view
                        </span>
                      </button>
                    ) : (
                      <div className="shrink-0 w-14 h-14 rounded-lg border border-dashed border-zinc-700/80 bg-zinc-950/50 flex items-center justify-center text-lg opacity-40">
                        📷
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-[7px] font-black uppercase tracking-[0.16em] text-green-400 leading-tight">
                        Freight Photos
                      </p>
                      {showFreightWaived ? (
                        <p className="text-[9px] text-amber-400/90 normal-case truncate leading-tight mt-0.5">
                          Waived — dispatch confirmed
                        </p>
                      ) : hasFreightPhotos ? (
                        <p className="text-[9px] text-zinc-400 normal-case truncate leading-tight mt-0.5">
                          {freightPhotoCount} photo{freightPhotoCount === 1 ? '' : 's'} attached
                        </p>
                      ) : (
                        <p className="text-[9px] text-zinc-500 normal-case truncate leading-tight mt-0.5">
                          No photos yet
                        </p>
                      )}
                    </div>

                    {hasFreightPhotos || showFreightWaived ? (
                      <span
                        className={`shrink-0 text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full border ${reviewTheme.statusVerified}`}
                      >
                        ✓ Verified
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={returnToFreightDocuments}
                      className="shrink-0 w-8 h-8 rounded-lg border border-zinc-700/70 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
                      aria-label="Edit freight photos"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
                </div>
              ) : null}
            </section>
            </div>

            <p className="text-center text-[7px] text-zinc-600 normal-case tracking-normal flex items-center justify-center gap-1 pb-1">
              <span>🔒</span>
              Ready to submit
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
              📤
            </div>
          </div>

          <h2 className="text-4xl font-black italic text-blue-500 uppercase tracking-tighter mb-4">
            Submitting…
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
              Upload did not complete
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
              Submission received
            </h2>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-8">
              Upload complete
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
        onChange={(e) => {
          const slot = activeBolSlotRef.current;
          if (slot === null) return;
          onFileSelect(e, 'bol', slot);
          activeBolSlotRef.current = null;
        }}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png"
        onChange={(e) => {
          const slot = activeBolSlotRef.current;
          if (slot === null) return;
          onFileSelect(e, 'bol', slot);
          activeBolSlotRef.current = null;
        }}
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

export default BolPodWorkflow;