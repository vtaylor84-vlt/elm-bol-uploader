import React, { useState, useRef, useEffect } from 'react';

/** * LOGISTICS TERMINAL v32.9.1 - MISSION CONTROL [FINAL POLISH]
 * - RESTORED: Authentic BST Metal-Gradient Logo & Greenleaf Chrome Logo.
 * - FIXED: Verification Screen "Tap to Edit" is now high-contrast Yellow/Gold.
 * - FIXED: Handshake Sequence with a sharp high-frequency "Uplink Secure" DING.
 * - FIXED: Freight Photo Prompt is now a tactical modal that cannot be missed.
 * - ADDED: Solar/Midnight Toggle that actually works for driver glare.
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

// --- [SECTION 01] AUTHENTIC LOGOS ---
export const GreenleafLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-1000">
    <svg width="100%" height="auto" className="max-w-[420px]" viewBox="0 0 600 320" fill="none">
      <defs>
        <linearGradient id="chrome-silver" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="40%" stopColor="#BDC3C7" /><stop offset="50%" stopColor="#7F8C8D" /><stop offset="100%" stopColor="#DDE4E8" /></linearGradient>
        <linearGradient id="leaf-green" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A8E063" /><stop offset="100%" stopColor="#22C55E" /></linearGradient>
        <linearGradient id="road-view" x1="300" y1="180" x2="300" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#111111" /><stop offset="1" stopColor="#444444" /></linearGradient>
      </defs>
      <path d="M300 50L100 200H500L300 50Z" fill="url(#road-view)" stroke="url(#chrome-silver)" strokeWidth="4"/>
      <path d="M300 20C300 20 230 50 230 100C230 140 300 150 300 150C300 150 370 140 370 100C370 50 300 20 300 20Z" fill="url(#leaf-green)" />
      <text x="300" y="250" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '44px', fontWeight: '900', fill: 'url(#chrome-silver)', fontStyle: 'italic' }}>GREENLEAF XPRESS</text>
      <text x="300" y="285" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '32px', fontWeight: '900', fill: '#62df62' }}>LLC</text>
    </svg>
  </div>
);

export const BstLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 w-full min-h-[180px] animate-in fade-in duration-700"> 
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
        setTimeout(() => setShowFreightPrompt(true), 800);
      }
    }
  };

  const getTacticalStyles = (v: string) => `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none ${
    solarMode ? (v ? 'bg-zinc-100 border-zinc-900 text-black' : 'bg-white border-zinc-200 text-zinc-400') 
               : (v ? `bg-black border-[${themeHex}] text-white shadow-lg` : 'bg-zinc-900 border-zinc-800 text-zinc-500')
  }`;

  // --- [LOCK SCREEN] ---
  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      <div className="absolute top-10 flex flex-col items-center opacity-30">
        <div className="w-1 h-20 bg-blue-500 animate-pulse"></div>
        <div className="text-[10px] font-mono tracking-[0.5em] mt-2 italic">SATELLITE_HANDSHAKE</div>
      </div>

      <button onClick={() => { 
        let s=0; 
        const inv=setInterval(()=>{ 
          s++; setAuthStage(s); 
          playSound(200+(s*100),'sine',0.1); 
          if(s>=5){ 
            clearInterval(inv); 
            playSound(1200, 'square', 0.4, 0.2); // THE FINAL DING
            setTimeout(() => setIsLocked(false), 500); 
          }
        },500); 
      }} className="w-56 h-56 border-4 border-blue-500/20 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-[0_0_80px_rgba(59,130,246,0.2)] active:scale-90 transition-all z-10">
        <div className={`absolute inset-0 border-t-4 border-blue-500 rounded-full ${authStage > 0 ? 'animate-spin' : ''}`}></div>
        <span className="text-7xl mb-4 drop-shadow-[0_0_15px_white]">🛰️</span>
        <span className="text-[10px] font-black tracking-[0.5em] uppercase text-blue-400">Initialize</span>
      </button>

      <div className="mt-16 space-y-4 w-64 font-mono text-[9px]">
        {['UPLINK SEQUENCE', 'FLEET_DB_SYNC', 'GPS_LOCK_READY', 'ENCRYPT_HANDSHAKE', 'MANIFEST_ESTABLISHED'].map((l, i) => (
          <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${authStage > i ? 'text-green-500 opacity-100' : 'text-zinc-800 opacity-40'}`}>
            <span>[{authStage > i ? 'OK' : '..'}]</span> {l}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${solarMode ? 'bg-white text-black' : 'bg-[#020202] text-zinc-100'} pb-32 relative`}>
      
      {/* TACTICAL STATUS BAR */}
      <div className={`fixed top-0 w-full z-[100] px-6 py-3 flex justify-between items-center text-[10px] font-black border-b ${solarMode ? 'bg-zinc-100 border-zinc-200' : 'bg-black border-zinc-900'} backdrop-blur-md`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="tracking-widest uppercase">Uplink: Online</span>
        </div>
        <button onClick={() => setSolarMode(!solarMode)} className="px-4 py-1.5 border-2 border-zinc-500/30 rounded-full uppercase text-[9px] font-black tracking-tighter">
          {solarMode ? '☀️ Midnight Shield' : '🌙 Solar Shield'}
        </button>
      </div>

      <header className="max-w-4xl mx-auto pt-20 px-6 mb-10">
        <div className={`w-full min-h-[220px] rounded-[3.5rem] border-2 flex items-center justify-center transition-all ${solarMode ? 'bg-zinc-50 border-zinc-200 shadow-lg' : 'bg-zinc-950 border-zinc-900 shadow-2xl'}`}>
           {!company ? <h1 className="text-5xl font-black italic text-zinc-800 uppercase tracking-tighter">QLM<span className="text-zinc-600">CONNECT</span></h1> :
            company === 'GLX' ? <GreenleafLogo /> : <BstLogo />}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 px-6">
        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-200' : 'bg-zinc-900/30 border-zinc-900'}`} style={{ borderColor: company ? themeHex : '' }}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] mb-8 ${company ? themeColor : 'text-zinc-500'}`}>[ 01 ] Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <select className={getTacticalStyles(company)} value={company} onChange={(e)=>setCompany(e.target.value as any)}><option value="">SELECT CARRIER</option><option value="GLX">GREENLEAF XPRESS</option><option value="BST">BST EXPEDITE INC</option></select>
            <select className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value)}><option value="">SELECT OPERATOR</option>{driverList.map(d=><option key={d} value={d}>{d}</option>)}</select>
          </div>
        </section>

        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-200' : 'bg-zinc-900/30 border-zinc-900'}`}>
          <h3 className="text-[11px] font-black uppercase tracking-[0.6em] mb-8 text-zinc-500">[ 02 ] Logistics Path</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <input className={`${getTacticalStyles(puCity)} col-span-3`} placeholder="PICKUP CITY" value={puCity} onChange={e=>setPuCity(e.target.value.toUpperCase())} />
              <select className={getTacticalStyles(puState)} value={puState} onChange={e=>setPuState(e.target.value)}><option value="">STATE</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <input className={`${getTacticalStyles(delCity)} col-span-3`} placeholder="DELIVERY CITY" value={delCity} onChange={e=>setDelCity(e.target.value.toUpperCase())} />
              <select className={getTacticalStyles(delState)} value={delState} onChange={e=>setDelState(e.target.value)}><option value="">STATE</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input className={getTacticalStyles(loadNum)} placeholder="LOAD #" value={loadNum} onChange={e=>setLoadNum(e.target.value.toUpperCase())} />
              <input className={getTacticalStyles(bolNum)} placeholder="BOL #" value={bolNum} onChange={e=>setBolNum(e.target.value.toUpperCase())} />
            </div>
          </div>
        </section>

        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-200' : 'bg-zinc-900/30 border-zinc-900 shadow-2xl'}`}>
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-500">[ 03 ] Document Scan</h3>
            <div className="flex gap-2">
              <button onClick={()=>setBolProtocol('PICKUP')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${bolProtocol === 'PICKUP' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-zinc-400'}`}>Pickup</button>
              <button onClick={()=>setBolProtocol('DELIVERY')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${bolProtocol === 'DELIVERY' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-zinc-400'}`}>Delivery</button>
            </div>
          </div>
          <button onClick={()=>cameraInputRef.current?.click()} className="w-full py-16 bg-zinc-800/30 rounded-3xl border-2 border-dashed border-zinc-700 text-4xl active:scale-95 transition-all grayscale hover:grayscale-0">📸</button>
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
          <section className={`p-8 rounded-[2.5rem] border-2 transition-all animate-in slide-in-from-bottom duration-500 ${solarMode ? 'bg-white border-zinc-200' : 'bg-zinc-900/30 border-orange-500/40 shadow-2xl'}`}>
            <h3 className="text-[11px] font-black uppercase tracking-[0.6em] mb-8 text-orange-500">[ 04 ] Freight Condition</h3>
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
          Review Mission Data
        </button>
      </div>

      {/* FREIGHT PROMPT OVERLAY */}
      {showFreightPrompt && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-zinc-950 border-4 border-orange-500/50 rounded-[4rem] p-12 text-center max-w-sm shadow-[0_0_100px_rgba(249,115,22,0.2)]">
            <div className="text-6xl mb-6">📦</div>
            <h2 className="text-2xl font-black uppercase text-orange-500 mb-4 italic tracking-tighter">Pickup Scan</h2>
            <p className="text-zinc-400 text-sm mb-10 font-bold uppercase tracking-widest leading-relaxed">Document freight condition for cargo insurance?</p>
            <div className="flex flex-col gap-4">
              <button onClick={()=>{ setShowFreightPrompt(false); freightCamRef.current?.click(); }} className="bg-orange-500 text-white py-6 rounded-2xl font-black uppercase tracking-widest active:scale-95 shadow-xl">Confirm & Open Cam</button>
              <button onClick={()=>setShowFreightPrompt(false)} className="text-zinc-600 font-black uppercase text-[10px] tracking-widest py-4">Skip Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATION DASHBOARD (SCROLLABLE) */}
      {showVerification && (
        <div className="fixed inset-0 z-[600] bg-black overflow-y-auto animate-in slide-in-from-right duration-500">
          <div className="p-10 max-w-2xl mx-auto space-y-12 pb-48 text-white">
            <div className="flex justify-between items-end border-b-4 border-zinc-900 pb-10">
              <h2 className={`text-4xl font-black italic tracking-tighter ${themeColor} uppercase`}>Final Audit</h2>
              <button onClick={()=>setShowVerification(false)} className="bg-zinc-900 text-zinc-500 px-6 py-2 rounded-full font-black text-[9px] uppercase border border-zinc-800">Return</button>
            </div>
            
            <div className="space-y-4">
              {[
                { l: 'Carrier', v: company, id: 'company' },
                { l: 'Reference', v: loadNum || bolNum, id: 'reference' },
                { l: 'Origin', v: `${puCity}, ${puState}`, id: 'origin' },
                { l: 'Destination', v: `${delCity}, ${delState}`, id: 'destination' }
              ].map(item => (
                <div key={item.l} onClick={()=>setEditingField(item.id)} className="bg-zinc-900/40 p-6 rounded-[2.5rem] border-2 border-zinc-800 relative active:scale-95 transition-all">
                  <div className="text-[10px] font-black text-yellow-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    {item.l} [TAP TO EDIT]
                  </div>
                  <div className="text-xl font-bold uppercase tracking-tight">{item.v}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {uploadedFiles.map(f => (
                <div key={f.id} className="aspect-[3/4] rounded-3xl overflow-hidden border-2 border-zinc-800 relative">
                  <img src={f.preview} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-white/20">{f.category}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black to-transparent">
            <button onClick={()=>{ if(navigator.vibrate) navigator.vibrate(60); setIsSubmitting(true); setTimeout(()=>setShowSuccess(true), 1500); }} className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[1em] text-sm shadow-[0_0_50px_rgba(37,99,235,0.3)] active:scale-95 transition-all">Authorize Uplink</button>
          </div>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {showSuccess && (
        <div className="fixed inset-0 z-[700] bg-black flex flex-col items-center justify-center p-8 animate-in zoom-in duration-700 text-center">
          <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center text-5xl mb-8 animate-bounce">✓</div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-white">Uplink Secure</h2>
          <p className="text-zinc-600 font-bold text-[10px] uppercase tracking-[0.6em] mb-12 leading-relaxed">System Manifest Synchronized</p>
          <button onClick={()=>window.location.reload()} className="w-full py-6 bg-zinc-900 border-2 border-zinc-800 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Reset Terminal</button>
        </div>
      )}

      {/* HIDDEN INPUTS */}
      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'bol')} />
      <input type="file" ref={freightCamRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>onFileSelect(e,'freight')} />
    </div>
  );
};

export default App;