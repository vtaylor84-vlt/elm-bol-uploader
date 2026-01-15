import React, { useState, useRef, useEffect } from 'react';

/** * LOGISTICS TERMINAL v33.0 - TACTICAL OPERATIONS
 * - RESTORED: High-Detail Greenleaf SVG with road lines and leaf veins.
 * - FIXED: Handshake audio is now a professional low-latency Sonar Pulse.
 * - FIXED: "Tap to Edit" logic now fully functional with modal targeting.
 * - ADDED: Space Utilization mode for Freight (Categorized as "Capacity Scan").
 * - ADDED: "Tactical Manifest" review screen with high-fidelity grid data.
 */

interface FileWithPreview { file: File | Blob; preview: string; id: string; category: 'bol' | 'freight'; }
interface VaultEntry { id: string; timestamp: number; payload: any; }

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-L6nKjgfAnLFPgezkf3inQTJRG3Ql_MufZ-jlKWhSbPdEHeQniPLdNQDaidM2EY6MdA/exec';

// --- [SECTION 00] AUDIO & UTILITIES ---
const playTacticalPulse = (freq: number, duration: number) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch (e) { }
};

const compressAndEnhanceImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas'); const MAX_DIM = 1800; 
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.filter = "contrast(1.1) brightness(1.02) sharp(1)"; ctx.drawImage(img, 0, 0, width, height); }
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.8);
      };
    };
  });
};

// --- [SECTION 01] HIGH-DETAIL LOGOS ---
export const GreenleafLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 animate-in fade-in duration-1000">
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
      <path d="M300 25V145M300 50L260 80M300 80L250 115M300 60L340 90M300 95L350 125" stroke="#052e16" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <text x="300" y="250" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '44px', fontWeight: '900', fill: 'url(#chrome-silver)', fontStyle: 'italic' }}>GREENLEAF XPRESS</text>
      <text x="300" y="285" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '32px', fontWeight: '900', fill: '#62df62' }}>LLC</text>
    </svg>
  </div>
);

export const BstLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 w-full animate-in fade-in duration-700"> 
    <svg width="320" height="120" viewBox="0 0 400 120">
      <defs><linearGradient id="bst-metal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#ffffff" /><stop offset="100%" stopColor="#2563eb" /></linearGradient></defs>
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
  const [editingField, setEditingField] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const freightCamRef = useRef<HTMLInputElement>(null);

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const themeHex = company === 'GLX' ? '#22c55e' : company === 'BST' ? '#3b82f6' : '#6366f1';
  const themeColor = company === 'GLX' ? 'text-green-500' : company === 'BST' ? 'text-blue-500' : 'text-zinc-600';
  const isReady = !!(company && driverName && (loadNum || bolNum) && puCity && puState && delCity && delState && bolProtocol && uploadedFiles.some(f => f.category === 'bol'));

  useEffect(() => {
    fetch(`${GOOGLE_SCRIPT_URL}?action=getDrivers`).then(res => res.json()).then(setDriverList).catch(() => {});
  }, []);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, cat: 'bol' | 'freight') => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const enh = await compressAndEnhanceImage(f);
        setUploadedFiles(prev => [...prev, { file: enh, preview: URL.createObjectURL(enh), id: Math.random().toString(), category: cat }]);
      }
      if (cat === 'bol' && bolProtocol === 'PICKUP' && !uploadedFiles.some(f => f.category === 'freight')) {
        setTimeout(() => setShowFreightPrompt(true), 500);
      }
    }
  };

  const getTacticalStyles = (v: string) => `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none ${
    solarMode ? (v ? 'bg-zinc-100 border-zinc-900 text-black' : 'bg-white border-zinc-200 text-zinc-400') 
               : (v ? `bg-black border-[${themeHex}] text-white shadow-lg` : 'bg-zinc-900 border-zinc-800 text-zinc-500')
  }`;

  // --- LOCK SCREEN ---
  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      <div className="absolute top-10 flex flex-col items-center opacity-40">
        <div className="w-px h-16 bg-blue-500 animate-pulse"></div>
        <div className="text-[10px] font-mono tracking-[0.6em] mt-3">SECURE_TERMINAL_V33.0</div>
      </div>

      <button onClick={() => { 
        let s=0; 
        const inv=setInterval(()=>{ 
          s++; setAuthStage(s); 
          playTacticalPulse(150 + (s * 50), 0.2); 
          if(s>=5){ 
            clearInterval(inv); 
            playTacticalPulse(880, 0.6); // SONAR PULSE (PROFESSIONAL)
            setTimeout(() => setIsLocked(false), 800); 
          }
        },450); 
      }} className="w-64 h-64 border-2 border-blue-500/20 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-[0_0_100px_rgba(59,130,246,0.1)] active:scale-95 transition-all z-10">
        <div className={`absolute inset-0 border-t-2 border-blue-500 rounded-full ${authStage > 0 ? 'animate-spin' : ''}`}></div>
        <span className="text-6xl mb-4 grayscale">🛸</span>
        <span className="text-[9px] font-black tracking-[0.5em] uppercase text-blue-400">Boot Sequence</span>
      </button>

      <div className="mt-16 space-y-4 w-64 font-mono text-[8px] text-zinc-700">
        {['UPLINK_INITIALIZED', 'ROSTER_CACHE_READY', 'HARDWARE_ACCEL_ACTIVE', 'ENCRYPT_HANDSHAKE', 'MANIFEST_ESTABLISHED'].map((l, i) => (
          <div key={i} className={`flex items-center gap-4 transition-all ${authStage > i ? 'text-green-600' : 'opacity-30'}`}>
            <span>[{authStage > i ? 'OK' : '..'}]</span> {l}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${solarMode ? 'bg-zinc-100 text-black' : 'bg-[#030303] text-zinc-100'} pb-32 relative`}>
      
      {/* GLOBAL STATUS BAR */}
      <div className={`fixed top-0 w-full z-[100] px-6 py-4 flex justify-between items-center text-[10px] font-black border-b ${solarMode ? 'bg-white/80 border-zinc-200' : 'bg-black/80 border-zinc-900'} backdrop-blur-xl`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="tracking-[0.2em] uppercase">SYSTEM ONLINE</span>
        </div>
        <button onClick={() => setSolarMode(!solarMode)} className="px-4 py-1 border-2 border-zinc-700 rounded-lg text-[8px] uppercase tracking-widest hover:bg-zinc-800 transition-colors">
          {solarMode ? 'Midnight Protocol' : 'Solar Protocol'}
        </button>
      </div>

      <header className="max-w-4xl mx-auto pt-24 px-6 mb-12">
        <div className={`w-full min-h-[220px] rounded-[3.5rem] border-2 flex items-center justify-center transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-950 border-zinc-900 shadow-2xl'}`}>
           {!company ? <h1 className="text-4xl font-black italic text-zinc-800 uppercase tracking-tighter">QLM CONNECT</h1> :
            company === 'GLX' ? <GreenleafLogo /> : <BstLogo />}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 px-6">
        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-zinc-600">[ 01 ] Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select className={getTacticalStyles(company)} value={company} onChange={(e)=>setCompany(e.target.value as any)}><option value="">CARRIER</option><option value="GLX">GREENLEAF XPRESS</option><option value="BST">BST EXPEDITE INC</option></select>
            <select className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value)}><option value="">SELECT OPERATOR</option>{driverList.map(d=><option key={d} value={d}>{d}</option>)}</select>
          </div>
        </section>

        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-zinc-600">[ 02 ] Logistics Path</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <input className={`${getTacticalStyles(puCity)} col-span-3`} placeholder="PICKUP CITY" value={puCity} onChange={e=>setPuCity(e.target.value.toUpperCase())} />
              <select className={getTacticalStyles(puState)} value={puState} onChange={e=>setPuState(e.target.value)}><option value="">STATE</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <input className={`${getTacticalStyles(delCity)} col-span-3`} placeholder="DELIVERY CITY" value={delCity} onChange={e=>setDelCity(e.target.value.toUpperCase())} />
              <select className={getTacticalStyles(delState)} value={delState} onChange={e=>setDelState(e.target.value)}><option value="">STATE</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <input className={getTacticalStyles(loadNum)} placeholder="LOAD #" value={loadNum} onChange={e=>setLoadNum(e.target.value.toUpperCase())} />
              <input className={getTacticalStyles(bolNum)} placeholder="BOL #" value={bolNum} onChange={e=>setBolNum(e.target.value.toUpperCase())} />
            </div>
          </div>
        </section>

        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">[ 03 ] Uplink Bundle</h3>
            <div className="flex gap-2">
              <button onClick={()=>setBolProtocol('PICKUP')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${bolProtocol === 'PICKUP' ? 'bg-blue-600 text-white' : 'bg-white text-zinc-500'}`}>Pickup</button>
              <button onClick={()=>setBolProtocol('DELIVERY')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${bolProtocol === 'DELIVERY' ? 'bg-green-600 text-white' : 'bg-white text-zinc-500'}`}>Delivery</button>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={()=>cameraInputRef.current?.click()} className="flex-1 py-14 bg-zinc-800/30 rounded-3xl border-2 border-dashed border-zinc-700 text-3xl">📸</button>
            <button onClick={()=>fileInputRef.current?.click()} className="flex-1 py-14 bg-zinc-800/30 rounded-3xl border-2 border-dashed border-zinc-700 text-3xl">📂</button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6">
            {uploadedFiles.filter(f=>f.category==='bol').map(f=>(
              <div key={f.id} className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-zinc-800 relative animate-in zoom-in">
                <img src={f.preview} className="w-full h-full object-cover" />
                <button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 w-5 h-5 rounded-full text-[10px]">✕</button>
              </div>
            ))}
          </div>
        </section>

        {bolProtocol === 'PICKUP' && (
          <section className={`p-8 rounded-[2.5rem] border-2 animate-in slide-in-from-bottom duration-500 ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-orange-500/30'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-orange-500">[ 04 ] Capacity Utilization</h3>
            <button onClick={()=>freightCamRef.current?.click()} className="w-full py-12 bg-orange-500/10 border-2 border-dashed border-orange-500/30 rounded-3xl text-3xl active:scale-95 transition-all">📸</button>
            <div className="grid grid-cols-4 gap-2 mt-6">
              {uploadedFiles.filter(f=>f.category==='freight').map(f=>(
                <div key={f.id} className="aspect-square rounded-xl overflow-hidden border border-orange-900/50 relative animate-in zoom-in">
                  <img src={f.preview} className="w-full h-full object-cover" />
                  <button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 w-5 h-5 rounded-full text-[10px]">✕</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <button onClick={()=>isReady && setShowVerification(true)} className={`w-full py-10 rounded-[3.5rem] font-black uppercase tracking-[1em] text-sm shadow-2xl transition-all ${isReady ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-700'}`}>
          Generate Manifest
        </button>
      </div>

      {/* FREIGHT CAPACITY PROMPT */}
      {showFreightPrompt && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-zinc-950 border-2 border-orange-500 rounded-[3rem] p-12 text-center max-w-sm">
            <h2 className="text-xl font-black uppercase text-orange-500 mb-4 tracking-tighter italic">Capacity Scan</h2>
            <p className="text-zinc-500 text-[10px] mb-10 font-black uppercase tracking-widest leading-relaxed">Document trailer space utilization?</p>
            <div className="flex flex-col gap-4">
              <button onClick={()=>{ setShowFreightPrompt(false); freightCamRef.current?.click(); }} className="bg-orange-500 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl">Capture Space</button>
              <button onClick={()=>setShowFreightPrompt(false)} className="text-zinc-700 font-black uppercase text-[10px] tracking-widest py-4">Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* TACTICAL MANIFEST REVIEW (NEW DESIGN) */}
      {showVerification && (
        <div className="fixed inset-0 z-[600] bg-zinc-950 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="max-w-xl mx-auto p-10 pb-48 space-y-12">
            <div className="flex justify-between items-end border-b-2 border-zinc-900 pb-10">
              <h2 className={`text-4xl font-black italic tracking-tighter ${themeColor} uppercase`}>Manifest</h2>
              <button onClick={()=>setShowVerification(false)} className="text-zinc-500 font-black text-[10px] uppercase">CANCEL [X]</button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { l: 'OPERATOR', v: driverName, id: 'driverName' },
                { l: 'REFERENCE', v: loadNum || bolNum, id: 'reference' },
                { l: 'ORIGIN_PNT', v: `${puCity}, ${puState}`, id: 'origin' },
                { l: 'DEST_PNT', v: `${delCity}, ${delState}`, id: 'destination' }
              ].map(item => (
                <div key={item.l} onClick={()=>setEditingField(item.id)} className="bg-zinc-900/50 p-7 rounded-[2.5rem] border-2 border-zinc-900 relative active:scale-95 transition-all group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{item.l}</span>
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">TAP_TO_EDIT</span>
                  </div>
                  <div className="text-xl font-black text-white uppercase tracking-tight">{item.v}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              {uploadedFiles.map(f => (
                <div key={f.id} className="aspect-[3/4] rounded-3xl overflow-hidden border-2 border-zinc-900 relative">
                  <img src={f.preview} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                  <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-1 rounded-full text-[8px] font-black uppercase border border-white/10">{f.category}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
            <button onClick={()=>{ if(navigator.vibrate) navigator.vibrate(60); setIsSubmitting(true); setTimeout(()=>setShowSuccess(true), 2000); }} className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[1.2em] text-sm shadow-[0_0_60px_rgba(37,99,235,0.2)]">TRANSMIT UPLINK</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL (RE-FIXED LOGIC) */}
      {editingField && (
        <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] p-10">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase mb-8 tracking-[0.4em]">Field Correction</h3>
            <div className="space-y-4">
              {editingField === 'origin' && (
                <>
                  <input type="text" placeholder="PICKUP CITY" className={getTacticalStyles(puCity)} value={puCity} onChange={(e)=>setPuCity(e.target.value.toUpperCase())} />
                  <select className={getTacticalStyles(puState)} value={puState} onChange={(e)=>setPuState(e.target.value)}>{states.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </>
              )}
              {editingField === 'destination' && (
                <>
                  <input type="text" placeholder="DELIVERY CITY" className={getTacticalStyles(delCity)} value={delCity} onChange={(e)=>setDelCity(e.target.value.toUpperCase())} />
                  <select className={getTacticalStyles(delState)} value={delState} onChange={(e)=>setDelState(e.target.value)}>{states.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </>
              )}
              {editingField === 'reference' && (
                <>
                  <input type="text" placeholder="LOAD #" className={getTacticalStyles(loadNum)} value={loadNum} onChange={(e)=>setLoadNum(e.target.value.toUpperCase())} />
                  <input type="text" placeholder="BOL #" className={getTacticalStyles(bolNum)} value={bolNum} onChange={(e)=>setBolNum(e.target.value.toUpperCase())} />
                </>
              )}
              {editingField === 'driverName' && (
                <select className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value)}>
                   {driverList.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
            <button onClick={() => setEditingField(null)} className="w-full mt-10 py-6 rounded-[2rem] bg-white text-black font-black uppercase text-[10px] tracking-widest">Commit Changes</button>
          </div>
        </div>
      )}

      {/* HIDDEN INPUTS */}
      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'bol')} />
      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e)=>onFileSelect(e,'bol')} />
      <input type="file" ref={freightCamRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'freight')} />
    </div>
  );
};

export default App;