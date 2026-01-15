import React, { useState, useRef, useEffect } from 'react';

/** * LOGISTICS TERMINAL v32.4 - TACTICAL VERIFICATION
 * - FIXED: Carousel navigation for multi-page BOLs.
 * - FIXED: CSS Scrollbar isolation to prevent main page scrolling issues.
 * - ADDED: Click-to-Zoom and Left/Right navigation for Review.
 */

interface FileWithPreview { file: File | Blob; preview: string; id: string; category: 'bol' | 'freight'; }
interface VaultEntry { id: string; timestamp: number; payload: any; }

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-L6nKjgfAnLFPgezkf3inQTJRG3Ql_MufZ-jlKWhSbPdEHeQniPLdNQDaidM2EY6MdA/exec';

// --- [SECTION 00] AUDIO & UTILITIES ---
let globalAudioCtx: AudioContext | null = null;
const playSound = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  try {
    if (!globalAudioCtx) globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
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

// --- [SECTION 01] LOGOS ---
export const GreenleafLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-1000">
    <svg width="100%" height="auto" className="max-w-[420px]" viewBox="0 0 600 320" fill="none">
      <defs>
        <linearGradient id="chrome-silver" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="40%" stopColor="#BDC3C7" /><stop offset="50%" stopColor="#7F8C8D" /><stop offset="100%" stopColor="#DDE4E8" /></linearGradient>
        <linearGradient id="leaf-green" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A8E063" /><stop offset="100%" stopColor="#22C55E" /></linearGradient>
        <linearGradient id="road-view" x1="300" y1="180" x2="300" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#111111" /><stop offset="1" stopColor="#444444" /></linearGradient>
      </defs>
      <path d="M300 50L100 200H500L300 50Z" fill="url(#road-view)" stroke="url(#chrome-silver)" strokeWidth="4"/>
      <path d="M150 200L300 50M210 200L300 50M270 200L300 50M330 200L300 50M390 200L300 50M450 200L300 50" stroke="white" strokeWidth="1" opacity="0.2"/>
      <path d="M300 190V175M300 160V150M300 135V130" stroke="white" strokeWidth="4" opacity="0.6"/>
      <path d="M300 20C300 20 230 50 230 100C230 140 300 150 300 150C300 150 370 140 370 100C370 50 300 20 300 20Z" fill="url(#leaf-green)" />
      <path d="M300 25V145M300 50L260 80M300 80L250 115M300 60L340 90M300 95L350 125" stroke="#052e16" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <text x="300" y="250" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '44px', fontWeight: '900', fill: 'url(#chrome-silver)', fontStyle: 'italic' }}>GREENLEAF XPRESS</text>
      <text x="300" y="285" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '32px', fontWeight: '900', fill: '#62df62' }}>LLC</text>
      <text x="300" y="310" textAnchor="middle" style={{ fontFamily: 'monospace', fontSize: '14px', fill: '#BDC3C7', fontWeight: 'bold', letterSpacing: '6px' }}>WATERLOO, IOWA</text>
    </svg>
  </div>
);

export const BstLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 w-full min-h-[180px] animate-in fade-in duration-700"> 
    <svg width="320" height="120" viewBox="0 0 400 120">
      <defs><linearGradient id="bst-metal"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#ffffff" /><stop offset="100%" stopColor="#2563eb" /></linearGradient></defs>
      <text x="200" y="75" textAnchor="middle" style={{ fontSize: '95px', fill: 'url(#bst-metal)', fontFamily: 'Arial Black', fontWeight: '900', fontStyle: 'italic' }}>BST</text>
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
  const [manualMode, setManualMode] = useState(false);
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
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const freightCamRef = useRef<HTMLInputElement>(null);
  const freightFileRef = useRef<HTMLInputElement>(null);

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const themeHex = company === 'GLX' ? '#22c55e' : company === 'BST' ? '#3b82f6' : '#6366f1';
  const themeColor = company === 'GLX' ? 'text-green-500' : company === 'BST' ? 'text-blue-500' : 'text-zinc-600';
  const isReady = !!(company && driverName && (loadNum || bolNum) && puCity && puState && delCity && delState && bolProtocol && uploadedFiles.some(f => f.category === 'bol'));

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getDrivers`);
        const data = await res.json();
        setDriverList(Array.isArray(data) ? data : []);
      } catch (e) { console.error("Roster Offline"); }
    };
    fetchDrivers();
    setVaultEntries(JSON.parse(localStorage.getItem('multi_vault') || '[]'));
  }, []);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, cat: 'bol' | 'freight') => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const fingerprint = `${f.name}-${f.size}-${f.lastModified}`;
        if (uploadedFiles.some(ex => ex.id === fingerprint)) {
          playSound(150, 'square', 0.4); continue; 
        }
        const enh = await compressAndEnhanceImage(f);
        setUploadedFiles(prev => [...prev, { file: enh, preview: URL.createObjectURL(enh), id: fingerprint, category: cat }]);
      }
      if (cat === 'bol' && bolProtocol === 'PICKUP') setShowFreightPrompt(true);
    }
  };

  const clearForm = () => {
    setCompany(''); setDriverName(''); setManualMode(false); setLoadNum(''); setBolNum('');
    setPuCity(''); setPuState(''); setDelCity(''); setDelState(''); setBolProtocol('');
    setUploadedFiles([]); playSound(100, 'square', 0.2);
  };

  const getTacticalStyles = (v: string) => `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none ${v ? `bg-black text-white border-[${themeHex}] shadow-lg` : 'bg-zinc-100 text-black border-zinc-200'}`;

  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
        <div className={`w-2 h-2 rounded-full animate-pulse ${GOOGLE_SCRIPT_URL ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">STATUS: {GOOGLE_SCRIPT_URL ? 'CONNECTED' : 'OFFLINE'}</span>
      </div>
      <button onClick={() => { let s=0; const inv=setInterval(()=>{ s++; setAuthStage(s); playSound(200+(s*100),'sine',0.1); if(s>=4){ clearInterval(inv); playSound(800,'square',0.3,0.1); setIsLocked(false); }},600); }} className="w-48 h-48 border-4 border-blue-500/30 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-2xl active:scale-90 transition-all">
        <span className="text-6xl mb-2 drop-shadow-[0_0_15px_white]">🛡️</span>
        <span className="text-[10px] font-black text-blue-400 tracking-widest animate-pulse uppercase">Initialize</span>
      </button>
      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 text-center animate-pulse">Click to Connect</p>
      <div className="mt-10 space-y-3 font-mono text-[10px]">
        {['ENCRYPTING...', 'VERIFYING...', 'HANDSHAKE SECURE'].map((l, i) => (<div key={i} className={authStage > i ? (i===2?'text-green-500':'text-blue-400') : 'text-zinc-800'}>{`> ${l}`}</div>))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${solarMode ? 'bg-white text-black' : 'bg-[#020202] text-zinc-100'} pb-24 font-sans relative`}>
      
      {/* CSS ISOLATION: ONLY HIDES SCROLLBARS ON CAROUSELS */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .snap-x { scroll-snap-type: x mandatory !important; }
        .snap-center { scroll-snap-align: center !important; }
      `}</style>

      <header className="max-w-4xl mx-auto pt-10 px-4 mb-12">
        <div className="flex justify-between items-center mb-4">
           <button onClick={clearForm} 
             className={`px-4 py-2 border-2 rounded-full font-black uppercase text-[9px] transition-all 
             ${company === 'GLX' ? 'border-green-600 text-green-500 hover:bg-green-600 hover:text-white' : 
               company === 'BST' ? 'border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white' : 
               'border-zinc-800 text-zinc-600'}`}>Clear All</button>
           <button onClick={() => setSolarMode(!solarMode)} className="p-3 rounded-full border-2 bg-white text-black text-[9px] font-black">{solarMode ? '🌙 Midnight' : '☀️ Solar'}</button>
        </div>
        <div className={`w-full min-h-[220px] rounded-[3.5rem] border-2 flex items-center justify-center ${company ? 'bg-black shadow-2xl' : 'bg-zinc-900/50'}`} style={{ borderColor: company ? themeHex : '' }}>
           {!company && <h1 className="text-5xl font-black italic text-zinc-700 uppercase tracking-tighter">QLM<span className="text-zinc-500">CONNECT</span></h1>}
           {company === 'GLX' && <GreenleafLogo />} {company === 'BST' && <BstLogo />}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 px-4">
        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 border-zinc-800" style={{ borderColor: (company && driverName) ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${(company && driverName) ? themeColor : 'text-zinc-500'}`}>[ 01 ] Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <select className={getTacticalStyles(company)} value={company} onChange={(e)=>setCompany(e.target.value as any)}><option value="">SELECT CARRIER</option><option value="GLX">GREENLEAF XPRESS</option><option value="BST">BST EXPEDITE INC</option></select>
            {!manualMode ? (
              <select className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>{ if(e.target.value==='MANUAL') setManualMode(true); else setDriverName(e.target.value); }}><option value="">SELECT DRIVER</option>{driverList.map(d=><option key={d} value={d}>{d}</option>)}<option value="MANUAL">+ MANUAL ENTRY</option></select>
            ) : (
              <input type="text" placeholder="TYPE FULL NAME" className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value.toUpperCase())} />
            )}
          </div>
        </section>

        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 border-zinc-800" style={{ borderColor: (loadNum || bolNum) ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${(loadNum || bolNum) ? themeColor : 'text-zinc-500'}`}>[ 02 ] References</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="LOAD #" className={getTacticalStyles(loadNum)} value={loadNum} onChange={(e)=>setLoadNum(e.target.value.toUpperCase())} />
            <input type="text" placeholder="BOL #" className={getTacticalStyles(bolNum)} value={bolNum} onChange={(e)=>setBolNum(e.target.value.toUpperCase())} />
          </div>
        </section>

        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 border-zinc-800" style={{ borderColor: puCity ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${puCity ? themeColor : 'text-zinc-500'}`}>[ 03 ] Route</h3>
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
          <div className="flex justify-center gap-16 py-6 text-white uppercase text-[10px] font-black">
            <button onClick={()=>cameraInputRef.current?.click()} className="flex flex-col items-center gap-4 group"><div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl border border-zinc-700 shadow-xl group-active:scale-95">📸</div><span>Camera</span></button>
            <button onClick={()=>fileInputRef.current?.click()} className="flex flex-col items-center gap-4 group"><div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl border border-zinc-700 shadow-xl group-active:scale-95">📂</div><span>Gallery</span></button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6">
            {uploadedFiles.filter(f=>f.category==='bol').map(f=>(
              <div key={f.id} className="aspect-[3/4] border border-zinc-800 rounded-xl relative overflow-hidden animate-in zoom-in">
                <img src={f.preview} className="w-full h-full object-cover" alt="BOL"/>
                <button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center">✕</button>
              </div>
            ))}
          </div>
        </section>

        {bolProtocol === 'PICKUP' && (
          <section className={`bg-zinc-900/40 border-2 rounded-[2.5rem] p-8 shadow-2xl border-zinc-800 mt-8`} style={{ borderColor: uploadedFiles.some(f=>f.category==='freight') ? themeHex : '' }}>
            <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${uploadedFiles.some(f=>f.category==='freight') ? themeColor : 'text-zinc-500'}`}>[ 05 ] PHOTOS OF FREIGHT</h3>
            <div className="flex justify-center gap-16 py-6 text-white uppercase text-[10px] font-black">
              <button onClick={()=>freightCamRef.current?.click()} className="flex flex-col items-center gap-4 group"><div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl border border-zinc-700 shadow-xl group-active:scale-95">📸</div><span>Camera</span></button>
              <button onClick={()=>freightFileRef.current?.click()} className="flex flex-col items-center gap-4 group"><div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl border border-zinc-700 shadow-xl group-active:scale-95">📂</div><span>Gallery</span></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-6">
              {uploadedFiles.filter(f=>f.category==='freight').map(f=>(
                <div key={f.id} className="aspect-square border border-zinc-800 rounded-xl relative overflow-hidden animate-in zoom-in">
                  <img src={f.preview} className="w-full h-full object-cover" alt="Freight"/>
                  <button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center">✕</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <button onClick={()=>isReady && setShowVerification(true)} 
          className={`w-full py-10 rounded-[2.5rem] font-black uppercase tracking-[1.5em] border-[3px] border-white transition-all duration-700 
          ${isReady ? (company === 'GLX' ? 'bg-green-600 shadow-[0_0_80px_rgba(34,197,94,0.3)]' : 'bg-blue-600 shadow-[0_0_80px_rgba(59,130,246,0.3)]') : 'bg-zinc-900 text-zinc-700 opacity-50'} scale-[1.02] text-white`}>
          {isReady ? 'REVIEW DOCUMENTS' : 'COMPLETE FIELDS'}
        </button>
      </div>

      {showFreightPrompt && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6">
          <div className={`bg-zinc-900 border-2 rounded-[3.5rem] p-10 text-center ${company==='GLX'?'border-green-500':'border-blue-500'}`}>
            <h2 className={`text-xl font-black uppercase mb-4 ${themeColor}`}>Pickup Detected</h2>
            <p className="text-zinc-400 text-sm mb-8 font-bold uppercase tracking-widest">Take photos of freight loaded on trailer?</p>
            <div className="flex flex-col gap-4">
              <button onClick={()=>{ setShowFreightPrompt(false); freightCamRef.current?.click(); }} className={`${company==='GLX'?'bg-green-600':'bg-blue-600'} text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl active:scale-95`}>Yes, Open Camera</button>
              <button onClick={()=>setShowFreightPrompt(false)} className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">No, Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* STATE-OF-THE-ART LOAD VERIFICATION DASHBOARD */}
      {showVerification && (
        <div className="fixed inset-0 z-[400] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
          <div className={`w-full max-w-2xl bg-zinc-950 border-[3px] rounded-[3.5rem] p-8 md:p-12 relative shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden`} style={{ borderColor: themeHex }}>
            <div className="flex justify-between items-start mb-8 border-b border-zinc-800 pb-6">
              <div>
                <h2 className={`text-3xl font-black italic uppercase tracking-tighter ${themeColor}`}>Review Load Details</h2>
                <div className="flex items-center gap-2 mt-1"><div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: themeHex }}></div><p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">Ready for Transmission</p></div>
              </div>
              <div className="text-right font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Terminal: v32.4<br/>Status: Verified</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                {[
                  { label: 'Carrier', value: company === 'GLX' ? 'GREENLEAF XPRESS' : 'BST EXPEDITE' },
                  { label: 'Operator', value: driverName },
                  { label: 'Reference', value: loadNum || bolNum || '---', sub: loadNum ? 'PRIMARY: LOAD #' : 'PRIMARY: BOL #' },
                  { label: 'Route', value: `${puCity} → ${delCity}` },
                ].map((item, idx) => (
                  <div key={idx} className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl">
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest block mb-1">{item.label}</span>
                    <div className="text-sm font-bold text-white uppercase truncate">{item.value}</div>
                    {item.sub && <div className={`text-[8px] font-bold mt-1 opacity-60 ${themeColor}`}>{item.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Right Column: Interactive Page Carousel */}
              <div className="flex flex-col gap-3">
                <div className="aspect-[3/4] rounded-3xl border border-zinc-800 overflow-hidden bg-zinc-900 relative group">
                  {uploadedFiles.filter(f => f.category === 'bol').length > 1 && (
                    <>
                      <div className="absolute inset-y-0 left-0 z-30 flex items-center pl-2">
                        <button onClick={(e) => { e.stopPropagation(); const el = e.currentTarget.parentElement?.nextElementSibling; if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' }); playSound(300, 'sine', 0.05); }} className="w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center text-xl active:scale-90 shadow-xl">←</button>
                      </div>
                      <div className="absolute inset-y-0 right-0 z-30 flex items-center pr-2">
                        <button onClick={(e) => { e.stopPropagation(); const el = e.currentTarget.parentElement?.previousElementSibling; if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' }); playSound(300, 'sine', 0.05); }} className="w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center text-xl active:scale-90 shadow-xl">→</button>
                      </div>
                    </>
                  )}
                  <div className="flex overflow-x-auto snap-x snap-mandatory h-full no-scrollbar scroll-smooth">
                    {uploadedFiles.filter(f => f.category === 'bol').map((file, idx) => (
                      <div key={file.id} className="min-w-full h-full snap-center relative cursor-zoom-in" onClick={() => { setFullScreenImage(file.preview); playSound(400, 'sine', 0.1); }}>
                        <img src={file.preview} className="w-full h-full object-cover opacity-80" alt={`Page ${idx + 1}`} />
                        <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-black/70 border border-white/10 text-[8px] font-black text-white tracking-[0.2em] uppercase">PAGE {idx + 1} / {uploadedFiles.filter(f => f.category === 'bol').length}</div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-10"></div>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Verification</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${themeColor}`}>{uploadedFiles.filter(f => f.category === 'bol').length} Pages</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button onClick={async ()=>{ playSound(800, 'square', 0.1); setIsSubmitting(true); const base64=await Promise.all(uploadedFiles.map(async f=>{ return new Promise(resolve=>{ const r=new FileReader(); r.onload=()=>resolve({category: f.category, base64: r.result}); r.readAsDataURL(f.file); })} )); const payload={company,driverName,loadNum,bolNum,puCity,puState,delCity,delState,bolProtocol,files:base64}; try { await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',body:JSON.stringify(payload)}); setShowSuccess(true); } catch(e){ localStorage.setItem('multi_vault', JSON.stringify([...vaultEntries,{id:Math.random().toString(),payload}])); setShowSuccess(true); } }} className={`w-full py-8 rounded-[2rem] font-black uppercase tracking-[1em] text-sm transition-all active:scale-95 shadow-2xl relative overflow-hidden group ${company === 'GLX' ? 'bg-green-600 shadow-green-600/30' : 'bg-blue-600 shadow-blue-600/30'} text-white ${!isSubmitting ? 'animate-pulse' : ''}`}>{isSubmitting ? 'TRANSMITTING...' : 'AUTHORIZE UPLINK'}</button>
              <button onClick={() => { playSound(200, 'sine', 0.1); setShowVerification(false); }} className="w-full text-zinc-500 font-black uppercase text-[10px] tracking-[0.5em] py-4 hover:text-white transition-all">[ EDIT LOAD INFO ]</button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE MODAL */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-4 animate-in zoom-in duration-300" onClick={() => setFullScreenImage(null)}>
          <div className="absolute top-10 right-10 text-white font-black uppercase text-xs tracking-widest border-2 border-white/20 px-6 py-2 rounded-full">Close [X]</div>
          <img src={fullScreenImage} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl shadow-white/5" alt="Full BOL" />
          <p className="mt-8 text-zinc-500 font-black text-[10px] uppercase tracking-[0.6em]">Inspect for Legibility</p>
        </div>
      )}

      {showSuccess && <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center text-white text-5xl font-black animate-bounce" onClick={()=>window.location.reload()}>✓ TRANSMITTED</div>}

      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'bol')} />
      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e)=>onFileSelect(e,'bol')} />
      <input type="file" ref={freightCamRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'freight')} />
      <input type="file" ref={freightFileRef} className="hidden" multiple accept="image/*" onChange={(e)=>onFileSelect(e,'freight')} />
    </div>
  );
};

export default App;