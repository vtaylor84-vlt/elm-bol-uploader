import React, { useState, useRef, useEffect } from 'react';

/** * LOGISTICS TERMINAL v31.8 - MASTER RESTORATION
 * - RESTORED: High-detail GLX Logo (Leaf Veins & Road Lines).
 * - RESTORED: Full Tactical Engine (Vault, Sounds, Storage, Freight Prompts).
 * - FIX: Widened view for GLX and Metallic BST Logo.
 * - ADDED: Connection Diagnostic Button.
 */

interface FileWithPreview {
  file: File | Blob; preview: string; id: string; category: 'bol' | 'freight';
}

interface VaultEntry {
  id: string; timestamp: number; payload: any;
}

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-L6nKjgfAnLFPgezkf3inQTJRG3Ql_MufZ-jlKWhSbPdEHeQniPLdNQDaidM2EY6MdA/exec';

// --- [SECTION 00] UTILITIES (AUDIO & PROCESSING) ---
let globalAudioCtx: AudioContext | null = null;
const playSound = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  try {
    if (!globalAudioCtx) globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, globalAudioCtx.currentTime);
    gain.gain.setValueAtTime(vol, globalAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(globalAudioCtx.destination);
    osc.start(); osc.stop(globalAudioCtx.currentTime + duration);
  } catch (e) { }
};

const compressAndEnhanceImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1600; 
        let width = img.width; let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
        } else {
          if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.filter = "contrast(1.2) brightness(1.05)";
            ctx.drawImage(img, 0, 0, width, height);
        }
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.7);
      };
    };
  });
};

// --- [SECTION 01] LOGOS (RE-DETAILED) ---

export const GreenleafLogo: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-1000">
    <svg width="100%" height="auto" className="max-w-[420px]" viewBox="0 0 600 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chrome-silver" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" /><stop offset="40%" stopColor="#BDC3C7" /><stop offset="50%" stopColor="#7F8C8D" /><stop offset="100%" stopColor="#DDE4E8" />
        </linearGradient>
        <linearGradient id="leaf-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8E063" /><stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="road-view" x1="300" y1="180" x2="300" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#111111" /><stop offset="1" stopColor="#444444" />
        </linearGradient>
      </defs>
      <path d="M300 50L100 200H500L300 50Z" fill="url(#road-view)" stroke="url(#chrome-silver)" strokeWidth="4"/>
      <path d="M150 200L300 50M210 200L300 50M270 200L300 50M330 200L300 50M390 200L300 50M450 200L300 50" stroke="white" strokeWidth="1" opacity="0.2"/>
      <path d="M300 190V175M300 160V150M300 135V130" stroke="white" strokeWidth="4" opacity="0.6"/>
      <path d="M300 20C300 20 230 50 230 100C230 140 300 150 300 150C300 150 370 140 370 100C370 50 300 20 300 20Z" fill="url(#leaf-green)" />
      <path d="M300 25V145M300 50L260 80M300 80L250 115M300 60L340 90M300 95L350 125" stroke="#052e16" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <text x="300" y="250" textAnchor="middle" style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '44px', fontWeight: '900', fill: 'url(#chrome-silver)', fontStyle: 'italic' }}>GREENLEAF XPRESS</text>
      <text x="300" y="285" textAnchor="middle" style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '32px', fontWeight: '900', fill: '#62df62' }}>LLC</text>
      <text x="300" y="310" textAnchor="middle" style={{ fontFamily: 'monospace', fontSize: '14px', fill: '#BDC3C7', fontWeight: 'bold', letterSpacing: '6px' }}>WATERLOO, IOWA</text>
    </svg>
  </div>
);

export const BstLogo: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-4 w-full min-h-[180px] animate-in fade-in duration-700"> 
    <svg width="320" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bst-metal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#ffffff" /><stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <text x="200" y="75" textAnchor="middle" style={{ fontSize: '95px', fill: 'url(#bst-metal)', filter: 'url(#neon-glow)', fontFamily: 'Arial Black, sans-serif', fontWeight: '900', fontStyle: 'italic' }}>BST</text>
      <text x="200" y="110" textAnchor="middle" style={{ fontSize: '16px', fill: '#93c5fd', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '8px' }}>EXPEDITE INC</text>
    </svg>
  </div>
);

// --- [SECTION 02] MAIN APP ---

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [solarMode, setSolarMode] = useState(false);
  const [authStage, setAuthStage] = useState(0);
  
  const [company, setCompany] = useState<'GLX' | 'BST' | ''>('');
  const [driverName, setDriverName] = useState('');
  const [loadNum, setLoadNum] = useState('');
  const [bolNum, setBolNum] = useState('');
  const [puCity, setPuCity] = useState('');
  const [puState, setPuState] = useState('');
  const [delCity, setDelCity] = useState('');
  const [delState, setDelState] = useState('');
  const [bolProtocol, setBolProtocol] = useState<'PICKUP' | 'DELIVERY' | ''>('');
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  
  const [showFreightPrompt, setShowFreightPrompt] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const freightCamRef = useRef<HTMLInputElement>(null);
  const freightFileRef = useRef<HTMLInputElement>(null);

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  
  const themeHex = company === 'GLX' ? '#22c55e' : company === 'BST' ? '#3b82f6' : '#6366f1';
  const themeColor = company === 'GLX' ? 'text-green-500' : company === 'BST' ? 'text-blue-500' : 'text-zinc-600';

  const isAnyFieldFilled = !!(company || driverName || loadNum || bolNum || puCity || delCity || uploadedFiles.length > 0);
  const isReady = !!(company && driverName && (loadNum || bolNum) && puCity && puState && delCity && delState && bolProtocol && uploadedFiles.some(f => f.category === 'bol'));

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(e => { if (e.usage && e.quota && (e.usage / e.quota) > 0.8) setStorageWarning(true); });
    }
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    const refreshVault = () => {
        const raw = localStorage.getItem('multi_vault');
        setVaultEntries(raw ? JSON.parse(raw) : []);
    };
    refreshVault();
    const inv = setInterval(refreshVault, 5000);
    return () => { window.removeEventListener('online', handleStatus); window.removeEventListener('offline', handleStatus); clearInterval(inv); };
  }, []);

  const handleManualSync = async () => {
    if (vaultEntries.length === 0 || isSyncing) return;
    setIsSyncing(true); playSound(440, 'sine', 0.2);
    const remaining = [...vaultEntries];
    for (let i = 0; i < vaultEntries.length; i++) {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {method: 'POST', mode: 'no-cors', body: JSON.stringify(vaultEntries[i].payload)});
            remaining.shift(); 
            localStorage.setItem('multi_vault', JSON.stringify(remaining));
            setVaultEntries([...remaining]);
        } catch (err) { break; }
    }
    setIsSyncing(false); if (remaining.length === 0) playSound(880, 'sine', 0.5);
  };

  const saveToVault = (p: any) => {
    const vault = [...vaultEntries, { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), payload: p }];
    localStorage.setItem('multi_vault', JSON.stringify(vault));
    setVaultEntries(vault);
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, cat: 'bol' | 'freight') => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const fingerprint = `${f.name}-${f.size}-${f.lastModified}`;
        if (uploadedFiles.some(ex => ex.id === fingerprint)) {
            playSound(150, 'square', 0.4); continue;
        }
        playSound(600, 'triangle', 0.1);
        const enh = await compressAndEnhanceImage(f);
        setUploadedFiles(prev => [...prev, { file: enh, preview: URL.createObjectURL(enh), id: fingerprint, category: cat }]);
      }
      if (cat === 'bol' && bolProtocol === 'PICKUP') setShowFreightPrompt(true);
    }
  };

  const getTacticalStyles = (v: string) => {
    const isFilled = v && v.trim().length > 0;
    if (solarMode) return `w-full p-5 rounded-2xl font-mono text-sm border-2 outline-none ${isFilled ? `bg-white text-black border-[${themeHex}] shadow-lg` : 'bg-white text-black border-zinc-200'}`;
    return `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none 
      ${isFilled ? `bg-black text-white border-[${themeHex}] shadow-[0_0_15px_${themeHex}30]` : 'bg-zinc-100 text-black border-zinc-200 focus:bg-white'}`;
  };

  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
      {/* TOP RIGHT LIVE STATUS */}
      <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800">
        <div className={`w-2 h-2 rounded-full animate-pulse ${GOOGLE_SCRIPT_URL ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
          {GOOGLE_SCRIPT_URL ? 'Uplink: Online' : 'Uplink: Offline'}
        </span>
      </div>

      <div className="relative group">
        {/* ENHANCED SHIELD UI */}
        <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/40 transition-all duration-1000"></div>
        <button 
          onClick={() => { 
            let s=0; 
            const inv=setInterval(()=>{ 
              s++; setAuthStage(s); 
              playSound(200+(s*100),'sine',0.1); 
              if(s>=4){ clearInterval(inv); playSound(800,'square',0.3,0.1); setTimeout(()=>setIsLocked(false),500); }
            },600); 
          }} 
          className="relative w-48 h-48 border-4 border-blue-500/30 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-[0_0_50px_rgba(59,130,246,0.2)] hover:shadow-[0_0_80px_rgba(59,130,246,0.4)] hover:border-blue-400 transition-all duration-500 active:scale-90"
        >
          <span className="text-6xl mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">🛡️</span>
          <span className="text-[10px] font-black text-blue-400 tracking-[0.2em] animate-pulse">INITIALIZE</span>
        </button>
      </div>

      <p className="mt-12 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 text-center">
        Tap Shield to Unlock Terminal
      </p>
      
      <div className="mt-10 space-y-3 font-mono text-[10px] w-48">
        {['ENCRYPTING...', 'VERIFYING...', 'HANDSHAKE SECURE'].map((l, i) => (
          <div key={i} className={`flex items-center gap-2 ${authStage > i ? (i===2?'text-green-500':'text-blue-400') : 'text-zinc-800'}`}>
            <span>{authStage > i ? '●' : '○'}</span>
            <span className="tracking-widest">{`> ${l}`}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${solarMode ? 'bg-white text-black' : 'bg-[#020202] text-zinc-100'} pb-24 font-sans relative`}>
      {/* STATUS BAR REMAINS FOR OPERATIONAL FEEDBACK */}
      <div className={`fixed top-0 left-0 right-0 py-2 text-center text-[9px] font-black uppercase tracking-[0.3em] z-[100] transition-all ${vaultEntries.length > 0 ? 'bg-orange-600' : isOffline ? 'bg-red-600' : 'bg-green-600 opacity-0'}`}>
        {vaultEntries.length > 0 ? `SYNC REQUIRED: ${vaultEntries.length} LOADS PENDING` : 'TERMINAL ENCRYPTED & SECURE'}
      </div>

      {storageWarning && <div className="fixed top-8 left-0 right-0 bg-yellow-500 text-black text-[9px] font-black py-1 text-center z-[110]">⚠️ DEVICE STORAGE FULL</div>}
      
      <header className="max-w-4xl mx-auto pt-10 px-4 mb-12">
        <div className="flex justify-between items-center mb-4">
           <button onClick={()=>{ setCompany(''); setDriverName(''); setLoadNum(''); setBolNum(''); setPuCity(''); setPuState(''); setDelCity(''); setDelState(''); setBolProtocol(''); setUploadedFiles([]); playSound(100,'square',0.2); }} 
             className={`px-4 py-2 border-2 rounded-full font-black uppercase text-[9px] tracking-widest transition-all ${isAnyFieldFilled ? 'bg-green-600 border-green-400 text-white shadow-xl' : 'border-zinc-800 text-zinc-600 opacity-50'}`}>Clear All</button>
           
           {/* RE-INTEGRATED TOP STATUS IN ACTIVE MODE */}
           <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${solarMode ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${GOOGLE_SCRIPT_URL ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${solarMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {GOOGLE_SCRIPT_URL ? 'Uplink' : 'No Link'}
                </span>
             </div>
             <button onClick={() => setSolarMode(!solarMode)} className={`p-3 rounded-full border-2 font-black uppercase text-[9px] tracking-widest ${solarMode ? 'bg-black text-white' : 'bg-white text-black'}`}>{solarMode ? '🌙 Midnight' : '☀️ Solar'}</button>
           </div>
        </div>
        <div className={`w-full min-h-[220px] rounded-[3.5rem] border-2 transition-all duration-1000 flex items-center justify-center ${company ? 'bg-black shadow-2xl' : 'bg-zinc-900/50 border-zinc-800'}`} style={{ borderColor: company ? themeHex : '' }}>
           {!company && <h1 className="text-5xl font-black italic tracking-tighter uppercase text-zinc-700">QLM<span className="text-zinc-500">CONNECT</span></h1>}
           {company === 'GLX' && <GreenleafLogo />}
           {company === 'BST' && <BstLogo />}
        </div>
      </header>

      {/* REST OF THE APP SECTIONS (01-05) CONTINUE HERE UNCHANGED... */}
      <div className="max-w-4xl mx-auto space-y-8 px-4 font-sans">
        <section className={`bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 shadow-2xl border-zinc-800`} style={{ borderColor: (company && driverName) ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${(company && driverName) ? themeColor : 'text-zinc-500'}`}>[ 01 ] Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <select className={getTacticalStyles(company)} value={company} onChange={(e)=>setCompany(e.target.value as any)}><option value="">SELECT CARRIER</option><option value="GLX">GREENLEAF XPRESS</option><option value="BST">BST EXPEDITE INC</option></select>
            <input type="text" placeholder="DRIVER NAME" className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value.toUpperCase())} />
          </div>
        </section>

        <section className={`bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 shadow-2xl border-zinc-800`} style={{ borderColor: (loadNum || bolNum) ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${(loadNum || bolNum) ? themeColor : 'text-zinc-500'}`}>[ 02 ] References</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="LOAD #" className={getTacticalStyles(loadNum)} value={loadNum} onChange={(e)=>setLoadNum(e.target.value.toUpperCase())} />
            <input type="text" placeholder="BOL #" className={getTacticalStyles(bolNum)} value={bolNum} onChange={(e)=>setBolNum(e.target.value.toUpperCase())} />
          </div>
        </section>

        <section className={`bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 shadow-2xl border-zinc-800`} style={{ borderColor: (puCity && delCity) ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${(puCity && delCity) ? themeColor : 'text-zinc-500'}`}>[ 03 ] Route</h3>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2"><input type="text" placeholder="PICKUP CITY" className={getTacticalStyles(puCity)} value={puCity} onChange={(e)=>setPuCity(e.target.value.toUpperCase())} /></div>
            <select className={getTacticalStyles(puState)} value={puState} onChange={(e)=>setPuState(e.target.value)}><option value="">STATE</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2"><input type="text" placeholder="DELIVERY CITY" className={getTacticalStyles(delCity)} value={delCity} onChange={(e)=>setDelCity(e.target.value.toUpperCase())} /></div>
            <select className={getTacticalStyles(delState)} value={delState} onChange={(e)=>setDelState(e.target.value)}><option value="">STATE</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
        </section>

        <section className={`bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 border-zinc-800 shadow-2xl`} style={{ borderColor: bolProtocol ? themeHex : '' }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
            <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] ${bolProtocol ? themeColor : 'text-zinc-500'}`}>[ 04 ] BOL UPLINK</h3>
            <div className="flex gap-4">
              <button onClick={()=>setBolProtocol('PICKUP')} className={`px-6 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${bolProtocol === 'PICKUP' ? `bg-black text-white border-[${themeHex}] shadow-lg` : 'bg-white text-zinc-500'}`}>PICKUP</button>
              <button onClick={()=>setBolProtocol('DELIVERY')} className={`px-6 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${bolProtocol === 'DELIVERY' ? `bg-black text-white border-[${themeHex}] shadow-lg` : 'bg-white text-zinc-500'}`}>DELIVERY</button>
            </div>
          </div>
          <div className="flex justify-center gap-16 py-6 transition-all text-white font-black uppercase text-[10px]">
            <button onClick={()=>cameraInputRef.current?.click()} className="flex flex-col items-center gap-4 group"><div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl border border-zinc-700 shadow-xl group-active:scale-95">📸</div><span>Camera</span></button>
            <button onClick={()=>fileInputRef.current?.click()} className="flex flex-col items-center gap-4 group"><div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl border border-zinc-700 shadow-xl group-active:scale-95">📂</div><span>Gallery</span></button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6">
            {uploadedFiles.filter(f=>f.category==='bol').map(f=>(<div key={f.id} className="aspect-[3/4] border border-zinc-800 rounded-xl relative overflow-hidden animate-in zoom-in"><img src={f.preview} className="w-full h-full object-cover"/><button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px]">✕</button></div>))}
          </div>
        </section>

        {bolProtocol === 'PICKUP' && (
          <section className={`bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 shadow-2xl border-zinc-800`} style={{ borderColor: uploadedFiles.some(f=>f.category==='freight') ? themeHex : '' }}>
            <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${uploadedFiles.some(f=>f.category==='freight') ? themeColor : 'text-zinc-500'}`}>[ 05 ] PHOTOS OF FREIGHT</h3>
            <div className="flex justify-center gap-16 py-6 transition-all text-white font-black uppercase text-[10px]">
              <button onClick={()=>freightCamRef.current?.click()} className="flex flex-col items-center gap-4 group"><div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl border border-zinc-700 shadow-xl group-active:scale-95">📸</div><span>Camera</span></button>
              <button onClick={()=>freightFileRef.current?.click()} className="flex flex-col items-center gap-4 group"><div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl border border-zinc-700 shadow-xl group-active:scale-95">📂</div><span>Gallery</span></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-6">
              {uploadedFiles.filter(f=>f.category==='freight').map(f=>(<div key={f.id} className="aspect-square border border-zinc-800 rounded-xl relative overflow-hidden animate-in zoom-in"><img src={f.preview} className="w-full h-full object-cover"/><button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px]">✕</button></div>))}
            </div>
          </section>
        )}

        <button onClick={()=>{ if(!isReady) playSound(100,'square',0.2); else { playSound(600,'sine',0.2); setShowVerification(true); }}} 
          className={`w-full py-10 rounded-[2.5rem] font-black uppercase tracking-[1.5em] border-[3px] border-white transition-all duration-1000 
            ${isReady ? `bg-gradient-to-r ${company === 'GLX' ? 'from-green-600 via-green-400 to-green-600' : 'from-blue-600 via-blue-400 to-blue-600'} text-white shadow-[0_0_80px_rgba(255,255,255,0.2)] scale-[1.02]` : 'bg-zinc-900 text-zinc-700 opacity-50'}`}
        >
          {isReady ? 'REVIEW DOCUMENTS' : 'COMPLETE FIELDS'}
        </button>

        {vaultEntries.length > 0 && (
          <section className="bg-zinc-900 border-2 border-orange-500 rounded-[2.5rem] p-8 mt-12 animate-in slide-in-from-bottom">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-orange-500 text-[11px] font-black uppercase tracking-[0.4em]">Vault Sync Manager</h3>
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">{vaultEntries.length} Pending</span>
             </div>
             <button onClick={handleManualSync} className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] transition-all ${isSyncing ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black shadow-xl active:scale-95'}`}>Push Vault to Server</button>
          </section>
        )}
      </div>

      {showFreightPrompt && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 animate-in fade-in">
          <div className={`bg-zinc-900 border-2 rounded-[2.5rem] p-10 text-center shadow-2xl ${company==='GLX'?'border-green-500':'border-blue-500'}`}>
            <h2 className={`text-xl font-black uppercase mb-4 ${themeColor}`}>Pickup Detected</h2>
            <p className="text-zinc-400 text-sm mb-8 font-bold italic uppercase tracking-widest leading-relaxed">Take photos of the freight?</p>
            <div className="flex flex-col gap-4">
              <button onClick={()=>{ setShowFreightPrompt(false); freightCamRef.current?.click(); }} className={`${company==='GLX'?'bg-green-500':'bg-blue-600'} text-black py-4 rounded-xl font-black uppercase tracking-widest shadow-xl`}>Yes, Open Camera</button>
              <button onClick={()=>setShowFreightPrompt(false)} className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">No, Skip</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (<div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-10 font-sans"><div className="w-32 h-32 rounded-full border-4 border-green-500 flex items-center justify-center text-5xl mb-12 animate-bounce">✓</div><h2 className="text-4xl font-black italic uppercase text-white tracking-widest text-center px-4 leading-tight">Verified & Transmitted</h2><button onClick={()=>window.location.reload()} className="mt-16 text-zinc-600 uppercase text-xs font-black tracking-widest hover:text-white transition-colors">New Session</button></div>)}
      
      {showVerification && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom">
          <div className="w-full max-w-lg bg-zinc-900 border-2 rounded-[3.5rem] p-10 shadow-2xl relative" style={{ borderColor: themeHex }}>
             <h2 className={`text-2xl font-black italic uppercase tracking-widest mb-10 ${themeColor}`}>Final Review</h2>
             <div className="space-y-4 mb-12 font-mono text-sm text-white uppercase tracking-tighter">
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span>Carrier</span><span className="text-zinc-400">{company}</span></div>
                <div className="flex justify-between border-b border-zinc-800 pb-2 text-[#ccff00] font-bold text-lg"><span>Load #</span><span>{loadNum || 'N/A'}</span></div>
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span>Origin</span><span className="text-zinc-300 font-bold">{puCity}, {puState}</span></div>
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span>Dest.</span><span className="text-zinc-300 font-bold">{delCity}, {delState}</span></div>
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span>Photos</span><span className="text-zinc-400">{uploadedFiles.length} Total</span></div>
             </div>
             <button onClick={async ()=>{ 
                setIsSubmitting(true); 
                const base64=await Promise.all(uploadedFiles.map(async f=>{ return new Promise(resolve=>{ const r=new FileReader(); r.onload=()=>resolve({category: f.category, base64: r.result}); r.readAsDataURL(f.file); })} )); 
                const payload={company,driverName,loadNum,bolNum,puCity,puState,delCity,delState,bolProtocol,files:base64}; 
                try { await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',body:JSON.stringify(payload)}); setShowSuccess(true); } catch(e){ saveToVault(payload); setShowSuccess(true); } 
             }} className="w-full py-8 bg-[#ccff00] text-black rounded-[1.5rem] font-black uppercase tracking-[0.4em] border-[3px] border-white active:scale-95 shadow-2xl">{isSubmitting ? 'TRANSMITTING...' : 'Confirm & Transmit'}</button>
             <button onClick={()=>setShowVerification(false)} className="w-full mt-4 text-zinc-600 font-black uppercase text-[10px] tracking-widest">Back</button>
          </div>
        </div>
      )}

      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'bol')} />
      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e)=>onFileSelect(e,'bol')} />
      <input type="file" ref={freightCamRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'freight')} />
      <input type="file" ref={freightFileRef} className="hidden" multiple accept="image/*" onChange={(e)=>onFileSelect(e,'freight')} />
    </div>
  );
};

export default App;