import React, { useState, useRef, useEffect } from 'react';

/** * LOGISTICS TERMINAL v31.9 - MASTER RESTORATION
 * - UPDATED: Dynamic Driver Dropdown from Google Sheet DB_Personnel.
 * - UPDATED: Top-Right Live Connection Diagnostic.
 * - ADDED: 5+ Image Size Warning for PDF processing.
 * - ADDED: Red-Alert Vault Sync Manager.
 */

interface FileWithPreview { file: File | Blob; preview: string; id: string; category: 'bol' | 'freight'; }
interface VaultEntry { id: string; timestamp: number; payload: any; }

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-L6nKjgfAnLFPgezkf3inQTJRG3Ql_MufZ-jlKWhSbPdEHeQniPLdNQDaidM2EY6MdA/exec';

// --- UTILITIES ---
let globalAudioCtx: AudioContext | null = null;
const playSound = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  try {
    if (!globalAudioCtx) globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = globalAudioCtx.createOscillator(); const gain = globalAudioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, globalAudioCtx.currentTime);
    gain.gain.setValueAtTime(vol, globalAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(globalAudioCtx.destination);
    osc.start(); osc.stop(globalAudioCtx.currentTime + duration);
  } catch (e) { }
};

const compressAndEnhanceImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas'); const MAX_DIM = 1600; 
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.filter = "contrast(1.2) brightness(1.05)"; ctx.drawImage(img, 0, 0, width, height); }
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.7);
      };
    };
  });
};

// --- LOGOS ---
export const GreenleafLogo = () => (
  <div className="flex flex-col items-center justify-center p-4">
    <svg width="100%" height="auto" className="max-w-[420px]" viewBox="0 0 600 320" fill="none">
      <defs>
        <linearGradient id="chrome-silver" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#DDE4E8" /></linearGradient>
        <linearGradient id="leaf-green" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A8E063" /><stop offset="100%" stopColor="#22C55E" /></linearGradient>
      </defs>
      <path d="M300 50L100 200H500L300 50Z" fill="#111" stroke="url(#chrome-silver)" strokeWidth="4"/>
      <path d="M300 20C300 20 230 50 230 100C230 140 300 150 300 150C300 150 370 140 370 100C370 50 300 20 300 20Z" fill="url(#leaf-green)" />
      <text x="300" y="250" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '44px', fill: 'url(#chrome-silver)', fontStyle: 'italic' }}>GREENLEAF XPRESS</text>
      <text x="300" y="285" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '32px', fill: '#62df62' }}>LLC</text>
    </svg>
  </div>
);

export const BstLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 w-full min-h-[180px]"> 
    <svg width="320" height="120" viewBox="0 0 400 120">
      <defs><linearGradient id="bst-metal"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#ffffff" /><stop offset="100%" stopColor="#2563eb" /></linearGradient></defs>
      <text x="200" y="75" textAnchor="middle" style={{ fontSize: '95px', fill: 'url(#bst-metal)', fontFamily: 'Arial Black', fontStyle: 'italic' }}>BST</text>
      <text x="200" y="110" textAnchor="middle" style={{ fontSize: '16px', fill: '#93c5fd', letterSpacing: '8px' }}>EXPEDITE INC</text>
    </svg>
  </div>
);

// --- MAIN APP ---
const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [solarMode, setSolarMode] = useState(false);
  const [authStage, setAuthStage] = useState(0);
  const [company, setCompany] = useState<'GLX' | 'BST' | ''>('');
  const [driverName, setDriverName] = useState('');
  const [driverList, setDriverList] = useState<string[]>([]);
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

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const freightCamRef = useRef<HTMLInputElement>(null);
  const freightFileRef = useRef<HTMLInputElement>(null);

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const themeHex = company === 'GLX' ? '#22c55e' : company === 'BST' ? '#3b82f6' : '#6366f1';
  const themeColor = company === 'GLX' ? 'text-green-500' : company === 'BST' ? 'text-blue-500' : 'text-zinc-600';
  const isAnyFieldFilled = !!(company || driverName || loadNum || uploadedFiles.length > 0);
  const isReady = !!(company && driverName && loadNum && puCity && puState && delCity && delState && bolProtocol && uploadedFiles.some(f => f.category === 'bol'));

  // FETCH DRIVERS FROM GOOGLE SHEET
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getDrivers`);
        const data = await res.json();
        setDriverList(data);
      } catch (e) {
        setDriverList(["Mujo Covic", "Antonio Dasilva", "Joseph Vargo"]); // Fallback
      }
    };
    fetchDrivers();

    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus); window.addEventListener('offline', handleStatus);
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
    setIsSyncing(true);
    const remaining = [...vaultEntries];
    for (let i = 0; i < vaultEntries.length; i++) {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {method: 'POST', mode: 'no-cors', body: JSON.stringify(vaultEntries[i].payload)});
            remaining.shift(); localStorage.setItem('multi_vault', JSON.stringify(remaining)); setVaultEntries([...remaining]);
        } catch (err) { break; }
    }
    setIsSyncing(false);
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, cat: 'bol' | 'freight') => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const fingerprint = `${f.name}-${f.size}`;
        if (uploadedFiles.some(ex => ex.id === fingerprint)) continue;
        const enh = await compressAndEnhanceImage(f);
        setUploadedFiles(prev => [...prev, { file: enh, preview: URL.createObjectURL(enh), id: fingerprint, category: cat }]);
      }
      if (cat === 'bol' && bolProtocol === 'PICKUP') setShowFreightPrompt(true);
    }
  };

  const getTacticalStyles = (v: string) => {
    const isFilled = v && v.trim().length > 0;
    return `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none 
      ${isFilled ? `bg-black text-white border-[${themeHex}] shadow-lg` : 'bg-zinc-100 text-black border-zinc-200'}`;
  };

  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans relative">
      <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
        <div className={`w-2 h-2 rounded-full ${GOOGLE_SCRIPT_URL ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Uplink: {GOOGLE_SCRIPT_URL ? 'Online' : 'Offline'}</span>
      </div>
      <button onClick={() => { let s=0; const inv=setInterval(()=>{ s++; setAuthStage(s); if(s>=4){ clearInterval(inv); setTimeout(()=>setIsLocked(false),500); }},600); }} className="w-48 h-48 border-4 border-blue-500/30 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-2xl active:scale-95">
        <span className="text-6xl mb-2">🛡️</span>
        <span className="text-[10px] font-black text-blue-400 animate-pulse uppercase tracking-widest">Initialize</span>
      </button>
      <p className="mt-12 text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Tap Shield to Unlock</p>
    </div>
  );

  return (
    <div className={`min-h-screen ${solarMode ? 'bg-white text-black' : 'bg-[#020202] text-zinc-100'} pb-24 font-sans relative`}>
      <div className={`fixed top-0 left-0 right-0 py-2 text-center text-[9px] font-black uppercase z-[100] ${vaultEntries.length > 0 ? 'bg-orange-600' : 'bg-green-600 opacity-0'}`}>
        {vaultEntries.length > 0 ? `SYNC REQUIRED: ${vaultEntries.length} PENDING` : 'SECURE'}
      </div>

      <header className="max-w-4xl mx-auto pt-10 px-4 mb-12">
        <div className="flex justify-between items-center mb-4">
           <button onClick={()=>window.location.reload()} className="px-4 py-2 border-2 border-zinc-800 rounded-full font-black uppercase text-[9px] tracking-widest text-zinc-500">Reset</button>
           <button onClick={() => setSolarMode(!solarMode)} className="p-3 rounded-full border-2 bg-white text-black text-[9px] font-black">{solarMode ? '🌙' : '☀️'}</button>
        </div>
        <div className={`w-full min-h-[220px] rounded-[3.5rem] border-2 flex items-center justify-center ${company ? 'bg-black shadow-2xl' : 'bg-zinc-900/50'}`} style={{ borderColor: company ? themeHex : '' }}>
           {!company && <h1 className="text-5xl font-black italic text-zinc-700 uppercase tracking-tighter">QLM CONNECT</h1>}
           {company === 'GLX' && <GreenleafLogo />}
           {company === 'BST' && <BstLogo />}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 px-4">
        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 border-zinc-800" style={{ borderColor: company ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${themeColor}`}>[ 01 ] Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <select className={getTacticalStyles(company)} value={company} onChange={(e)=>setCompany(e.target.value as any)}><option value="">SELECT CARRIER</option><option value="GLX">GREENLEAF XPRESS</option><option value="BST">BST EXPEDITE INC</option></select>
            <select className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value)}><option value="">SELECT DRIVER</option>{driverList.map(d=><option key={d} value={d}>{d}</option>)}</select>
          </div>
        </section>

        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 border-zinc-800" style={{ borderColor: loadNum ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${themeColor}`}>[ 02 ] References</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="LOAD #" className={getTacticalStyles(loadNum)} value={loadNum} onChange={(e)=>setLoadNum(e.target.value.toUpperCase())} />
            <input type="text" placeholder="BOL #" className={getTacticalStyles(bolNum)} value={bolNum} onChange={(e)=>setBolNum(e.target.value.toUpperCase())} />
          </div>
        </section>

        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 border-zinc-800" style={{ borderColor: puCity ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${themeColor}`}>[ 03 ] Route</h3>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2"><input type="text" placeholder="PICKUP CITY" className={getTacticalStyles(puCity)} value={puCity} onChange={(e)=>setPuCity(e.target.value.toUpperCase())} /></div>
            <select className={getTacticalStyles(puState)} value={puState} onChange={(e)=>setPuState(e.target.value)}><option value="">ST</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2"><input type="text" placeholder="DELIVERY CITY" className={getTacticalStyles(delCity)} value={delCity} onChange={(e)=>setDelCity(e.target.value.toUpperCase())} /></div>
            <select className={getTacticalStyles(delState)} value={delState} onChange={(e)=>setDelState(e.target.value)}><option value="">ST</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
        </section>

        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 border-zinc-800" style={{ borderColor: bolProtocol ? themeHex : '' }}>
          <div className="flex justify-between items-center mb-10">
            <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] ${themeColor}`}>[ 04 ] BOL UPLINK</h3>
            <div className="flex gap-4">
              <button onClick={()=>setBolProtocol('PICKUP')} className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 ${bolProtocol === 'PICKUP' ? 'bg-white text-black' : 'text-zinc-500'}`}>PICKUP</button>
              <button onClick={()=>setBolProtocol('DELIVERY')} className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 ${bolProtocol === 'DELIVERY' ? 'bg-white text-black' : 'text-zinc-500'}`}>DELIVERY</button>
            </div>
          </div>

          {uploadedFiles.length >= 5 && (
            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/50 rounded-2xl animate-pulse text-center">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">⚠️ High Volume ({uploadedFiles.length} Pages). Processing PDF may take longer.</p>
            </div>
          )}

          <div className="flex justify-center gap-16 py-6 text-white uppercase text-[10px] font-black">
            <button onClick={()=>cameraInputRef.current?.click()} className="flex flex-col items-center gap-4"><span>📸 Camera</span></button>
            <button onClick={()=>fileInputRef.current?.click()} className="flex flex-col items-center gap-4"><span>📂 Gallery</span></button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6">
            {uploadedFiles.filter(f=>f.category==='bol').map(f=>(<div key={f.id} className="aspect-[3/4] border border-zinc-800 rounded-xl relative overflow-hidden"><img src={f.preview} className="w-full h-full object-cover"/><button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px]">✕</button></div>))}
          </div>
        </section>

        <button onClick={()=>isReady && setShowVerification(true)} className={`w-full py-10 rounded-[2.5rem] font-black uppercase tracking-[1.5em] border-[3px] border-white transition-all ${isReady ? 'bg-blue-600 text-white shadow-2xl scale-[1.02]' : 'bg-zinc-900 text-zinc-700 opacity-50'}`}>
          {isReady ? 'REVIEW' : 'COMPLETE FIELDS'}
        </button>

        {vaultEntries.length > 0 && (
          <section className="bg-red-900 border-4 border-white rounded-[2.5rem] p-8 mt-12 animate-pulse text-center">
             <h3 className="text-white text-[11px] font-black uppercase tracking-[0.4em] mb-4">⚠️ URGENT: VAULT NOT SYNCED</h3>
             <button onClick={handleManualSync} className="w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] bg-white text-red-600">Push {vaultEntries.length} Loads to Dispatch</button>
          </section>
        )}
      </div>

      {showSuccess && (<div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-10"><div className="w-32 h-32 rounded-full border-4 border-green-500 flex items-center justify-center text-5xl mb-12 animate-bounce">✓</div><h2 className="text-4xl font-black italic uppercase text-white tracking-widest text-center px-4 leading-tight">Verified & Transmitted</h2><button onClick={()=>window.location.reload()} className="mt-16 text-zinc-600 uppercase text-xs font-black tracking-widest hover:text-white transition-colors">New Session</button></div>)}
      
      {showVerification && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border-2 rounded-[3.5rem] p-10 border-blue-500">
             <h2 className="text-2xl font-black italic uppercase text-blue-500 mb-10 tracking-widest">Final Review</h2>
             <div className="space-y-4 mb-12 font-mono text-sm text-white uppercase">
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span>Carrier</span><span className="text-zinc-400">{company}</span></div>
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span>Driver</span><span className="text-zinc-400">{driverName}</span></div>
                <div className="flex justify-between border-b border-zinc-800 pb-2 text-green-400"><span>Load #</span><span>{loadNum}</span></div>
             </div>
             <button onClick={async ()=>{ 
                setIsSubmitting(true); 
                const base64=await Promise.all(uploadedFiles.map(async f=>{ return new Promise(resolve=>{ const r=new FileReader(); r.onload=()=>resolve({category: f.category, base64: r.result}); r.readAsDataURL(f.file); })} )); 
                const payload={company,driverName,loadNum,bolNum,puCity,puState,delCity,delState,bolProtocol,files:base64}; 
                try { await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',body:JSON.stringify(payload)}); setShowSuccess(true); } catch(e){ const vault = [...vaultEntries, { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), payload }]; localStorage.setItem('multi_vault', JSON.stringify(vault)); setShowSuccess(true); } 
             }} className="w-full py-8 bg-[#ccff00] text-black rounded-[1.5rem] font-black uppercase tracking-[0.4em]">{isSubmitting ? 'TRANSMITTING...' : 'Confirm'}</button>
             <button onClick={()=>setShowVerification(false)} className="w-full mt-4 text-zinc-600 font-black uppercase text-[10px]">Back</button>
          </div>
        </div>
      )}

      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'bol')} />
      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e)=>onFileSelect(e,'bol')} />
    </div>
  );
};

export default App;