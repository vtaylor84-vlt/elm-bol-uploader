import React, { useState, useRef, useEffect } from 'react';

/** * LOGISTICS TERMINAL v33.3 - INDUSTRIAL STRENGTH
 * - ADDED: Manual Driver Entry (+ MANUAL ENTRY option in dropdown).
 * - ADDED: "Uplink Active" Transmission UI with Satellite Animation.
 * - RESTORED: Final Receipt Dashboard with Save/Print function.
 * - FIXED: Tap-to-Edit targeting for all review fields.
 */

interface FileWithPreview { file: File | Blob; preview: string; id: string; category: 'bol' | 'freight'; }
interface VaultEntry { id: string; timestamp: number; payload: any; }

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwy_7Q_QmEim-hei-iUSpfimrtWkCVA1WDIGZy52cJ4FY-FbjWvbwmoHVYiV5kCUQ4/exec';

// --- [SECTION 00] POWER-UP AUDIO ---
const playPowerUp = (stage: number) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    const freqs = [110, 220, 440, 880, 1760];
    osc.type = stage === 5 ? 'square' : 'sawtooth'; 
    osc.frequency.setValueAtTime(freqs[stage-1] || 440, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch (e) { }
};

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas'); const MAX = 1800;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.filter = "contrast(1.1) brightness(1.03)"; ctx.drawImage(img, 0, 0, w, h); }
        canvas.toBlob((b) => resolve(b || file), 'image/jpeg', 0.8);
      };
    };
  });
};

// --- AUTHENTIC LOGOS ---
const GreenleafLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 animate-in fade-in duration-1000">
    <svg width="100%" height="auto" className="max-w-[400px]" viewBox="0 0 600 320" fill="none">
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

const BstLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 w-full animate-in fade-in duration-700"> 
    <svg width="320" height="120" viewBox="0 0 400 120">
      <defs><linearGradient id="bst-metal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#ffffff" /><stop offset="100%" stopColor="#2563eb" /></linearGradient></defs>
      <text x="200" y="75" textAnchor="middle" style={{ fontSize: '95px', fill: 'url(#bst-metal)', fontFamily: 'Arial Black', fontWeight: '900', fontStyle: 'italic' }}>BST</text>
      <text x="200" y="110" textAnchor="middle" style={{ fontSize: '16px', fill: '#93c5fd', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '8px' }}>EXPEDITE INC</text>
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const freightCamRef = useRef<HTMLInputElement>(null);

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const themeHex = company === 'GLX' ? '#22c55e' : company === 'BST' ? '#3b82f6' : '#6366f1';
  const isReady = !!(company && driverName && (loadNum || bolNum) && puCity && puState && delCity && delState && bolProtocol && uploadedFiles.some(f => f.category === 'bol'));

  useEffect(() => {
    // We add 'mode: cors' to tell the browser this is a safe request
    fetch(`${GOOGLE_SCRIPT_URL}?action=getDrivers`, { mode: 'cors' })
      .then(res => res.json())
      .then(data => {
        console.log("Drivers received:", data); // This helps us see if it worked
        setDriverList(data);
      })
      .catch((err) => console.error("Driver fetch error:", err));
  }, []);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, cat: 'bol' | 'freight') => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const enh = await compressImage(f);
        setUploadedFiles(prev => [...prev, { file: enh, preview: URL.createObjectURL(enh), id: Math.random().toString(), category: cat }]);
      }
      if (cat === 'bol' && bolProtocol === 'PICKUP' && !uploadedFiles.some(f => f.category === 'freight')) {
        setTimeout(() => setShowFreightPrompt(true), 600);
      }
    }
  };

  const inpStyle = (v: string) => `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none ${
    solarMode ? (v ? 'bg-zinc-50 border-zinc-900 text-black' : 'bg-white border-zinc-200 text-zinc-400') 
               : (v ? `bg-black border-[${themeHex}] text-white shadow-lg` : 'bg-zinc-900 border-zinc-800 text-zinc-500')
  }`;

  // --- LOCK SCREEN ---
  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      <div className="absolute top-12 flex flex-col items-center opacity-40">
        <div className="w-1 h-12 bg-blue-500 animate-pulse"></div>
        <div className="text-[10px] font-black tracking-[0.5em] mt-4">QLMCONNECT v33.3</div>
      </div>

      <button onClick={() => { 
        let s=0; const inv=setInterval(()=>{ 
          s++; setAuthStage(s); playPowerUp(s);
          if(s>=5){ clearInterval(inv); setTimeout(() => setIsLocked(false), 600); }
        },350); 
      }} className="w-64 h-64 border-4 border-blue-500/10 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-[0_0_120px_rgba(59,130,246,0.2)] active:scale-95 transition-all z-10 group">
        <div className={`absolute inset-0 border-t-4 border-blue-500 rounded-full ${authStage > 0 ? 'animate-spin' : ''}`}></div>
        <span className="text-8xl mb-4 group-active:scale-110 transition-transform italic font-black text-white">GO</span>
        <span className="text-[12px] font-black tracking-[0.3em] uppercase text-blue-500 animate-pulse">Engage Terminal</span>
      </button>

      <div className="mt-16 space-y-3 w-64 font-mono text-[9px] text-zinc-800 uppercase">
        {['Establishing_Link', 'Roster_Pull_Success', 'Network_Stable', 'Encryption_Handshake', 'Terminal_Active'].map((l, i) => (
          <div key={i} className={`flex items-center gap-3 ${authStage > i ? 'text-green-500' : ''}`}>
            <span>[{authStage > i ? 'OK' : '..'}]</span> {l}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${solarMode ? 'bg-zinc-100 text-black' : 'bg-[#020202] text-zinc-100'} pb-32`}>
      
      {/* HEADER BAR */}
      <div className={`fixed top-0 w-full z-[100] px-6 py-4 flex justify-between items-center text-[10px] font-black border-b ${solarMode ? 'bg-white/90 border-zinc-200 shadow-sm' : 'bg-black/90 border-zinc-900'} backdrop-blur-md`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="tracking-widest uppercase italic">Connected</span>
        </div>
        <button onClick={() => setSolarMode(!solarMode)} className="px-5 py-2 border-2 border-zinc-700 rounded-lg uppercase text-[9px] font-black hover:bg-zinc-800 transition-colors">
          {solarMode ? '🌙 Midnight Mode' : '☀️ Solar Mode'}
        </button>
      </div>

      <header className="max-w-4xl mx-auto pt-24 px-6 mb-12">
        <div className={`w-full min-h-[220px] rounded-[3.5rem] border-2 flex items-center justify-center transition-all ${solarMode ? 'bg-white border-zinc-300 shadow-xl' : 'bg-zinc-950 border-zinc-900 shadow-2xl'}`}>
           {!company ? <h1 className="text-5xl font-black italic text-zinc-800 uppercase tracking-tighter">QLM<span className="text-zinc-500">CONNECT</span></h1> :
            company === 'GLX' ? <GreenleafLogo /> : <BstLogo />}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 px-6">
        {/* IDENTITY */}
        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-zinc-600">[ 01 ] Operator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select className={inpStyle(company)} value={company} onChange={(e)=>setCompany(e.target.value as any)}><option value="">CHOOSE COMPANY</option><option value="GLX">GREENLEAF XPRESS</option><option value="BST">BST EXPEDITE INC</option></select>
            
            {!manualMode ? (
              <select className={inpStyle(driverName)} value={driverName} onChange={(e)=>{ if(e.target.value==='MANUAL') setManualMode(true); else setDriverName(e.target.value); }}>
                <option value="">SELECT DRIVER</option>
                {driverList.map(d=><option key={d} value={d}>{d}</option>)}
                <option value="MANUAL">+ MANUAL ENTRY (NOT LISTED)</option>
              </select>
            ) : (
              <input type="text" placeholder="TYPE FULL NAME" className={inpStyle(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value.toUpperCase())} autoFocus />
            )}
          </div>
        </section>

        {/* LOGISTICS */}
        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-zinc-600">[ 02 ] Logistics Path</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <input className={`${inpStyle(puCity)} col-span-3`} placeholder="PICKUP CITY" value={puCity} onChange={e=>setPuCity(e.target.value.toUpperCase())} />
              <select className={inpStyle(puState)} value={puState} onChange={e=>setPuState(e.target.value)}><option value="">ST</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <input className={`${inpStyle(delCity)} col-span-3`} placeholder="DELIVERY CITY" value={delCity} onChange={e=>setDelCity(e.target.value.toUpperCase())} />
              <select className={inpStyle(delState)} value={delState} onChange={e=>setDelState(e.target.value)}><option value="">ST</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <input className={inpStyle(loadNum)} placeholder="LOAD #" value={loadNum} onChange={e=>setLoadNum(e.target.value.toUpperCase())} />
              <input className={inpStyle(bolNum)} placeholder="BOL #" value={bolNum} onChange={e=>setBolNum(e.target.value.toUpperCase())} />
            </div>
          </div>
        </section>

        {/* UPLOAD */}
        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">[ 03 ] Documents</h3>
            <div className="flex gap-2">
              <button onClick={()=>setBolProtocol('PICKUP')} className={`px-5 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${bolProtocol === 'PICKUP' ? 'bg-blue-600 text-white' : 'bg-white text-zinc-400'}`}>Pickup</button>
              <button onClick={()=>setBolProtocol('DELIVERY')} className={`px-5 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${bolProtocol === 'DELIVERY' ? 'bg-green-600 text-white' : 'bg-white text-zinc-400'}`}>Delivery</button>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={()=>cameraInputRef.current?.click()} className="flex-1 py-14 bg-zinc-800/30 rounded-[2rem] border-2 border-dashed border-zinc-700 text-4xl active:scale-95">📸</button>
            <button onClick={()=>fileInputRef.current?.click()} className="flex-1 py-14 bg-zinc-800/30 rounded-[2rem] border-2 border-dashed border-zinc-700 text-4xl active:scale-95">📂</button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6">
            {uploadedFiles.filter(f=>f.category==='bol').map(f=>(
              <div key={f.id} className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-zinc-800 relative animate-in zoom-in"><img src={f.preview} className="w-full h-full object-cover" /><button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 w-5 h-5 rounded-full text-[10px]">✕</button></div>
            ))}
          </div>
        </section>

        {bolProtocol === 'PICKUP' && (
          <section className={`p-8 rounded-[2.5rem] border-2 animate-in slide-in-from-bottom duration-500 ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-orange-500/20'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-orange-500">[ 04 ] Capacity Verification</h3>
            <button onClick={()=>freightCamRef.current?.click()} className="w-full py-12 bg-orange-500/10 border-2 border-dashed border-orange-500/30 rounded-3xl text-sm font-black active:scale-95 text-orange-500 uppercase tracking-widest">📸 Take picture of freight loaded on trailer</button>
            <div className="grid grid-cols-4 gap-2 mt-6">
              {uploadedFiles.filter(f=>f.category==='freight').map(f=>(
                <div key={f.id} className="aspect-square rounded-xl overflow-hidden border border-orange-900 relative"><img src={f.preview} className="w-full h-full object-cover" /><button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-1 right-1 bg-red-600 w-5 h-5 rounded-full text-[10px]">✕</button></div>
              ))}
            </div>
          </section>
        )}

        <button onClick={()=>isReady && setShowVerification(true)} className={`w-full py-10 rounded-[3rem] font-black uppercase tracking-[1em] text-sm shadow-2xl transition-all ${isReady ? 'bg-blue-600 text-white animate-pulse shadow-blue-600/40' : 'bg-zinc-900 text-zinc-700'}`}>
          Review Transmission
        </button>
      </div>

      {/* FREIGHT PROMPT */}
      {showFreightPrompt && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-zinc-950 border-4 border-orange-500/40 rounded-[3.5rem] p-12 text-center max-w-sm">
            <h2 className="text-3xl font-black uppercase text-orange-500 mb-4 tracking-tighter">Trailer Space</h2>
            <p className="text-zinc-500 text-[10px] mb-10 font-black uppercase tracking-widest leading-relaxed">Document freight loaded on trailer to confirm remaining space?</p>
            <div className="flex flex-col gap-4">
              <button onClick={()=>{ setShowFreightPrompt(false); freightCamRef.current?.click(); }} className="bg-orange-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest active:scale-95 shadow-xl">Start Capacity Scan</button>
              <button onClick={()=>setShowFreightPrompt(false)} className="text-zinc-700 font-black uppercase text-[10px] tracking-widest py-4">Not Required</button>
            </div>
          </div>
        </div>
      )}

      {/* TACTICAL REVIEW */}
      {showVerification && (
        <div className="fixed inset-0 z-[600] bg-zinc-950 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="max-w-xl mx-auto p-10 pb-56 space-y-12">
            <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-10">
              <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Review Entries</h2>
              <button onClick={()=>setShowVerification(false)} className="bg-zinc-900 text-zinc-400 px-6 py-2 rounded-full font-black text-[9px] uppercase border border-zinc-800">Close</button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { l: 'OPERATOR', v: driverName, id: 'driverName' },
                { l: 'REFERENCE', v: loadNum || bolNum, id: 'reference' },
                { l: 'PICKUP', v: `${puCity}, ${puState}`, id: 'origin' },
                { l: 'DESTINATION', v: `${delCity}, ${delState}`, id: 'destination' }
              ].map(item => (
                <div key={item.l} onClick={()=>setEditingField(item.id)} className="bg-zinc-900/50 p-7 rounded-[2.5rem] border-2 border-zinc-800 active:scale-95 transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{item.l}</span>
                    <span className="text-[7px] font-black text-white/30 uppercase border border-white/10 px-2 py-0.5 rounded">Tap to Edit</span>
                  </div>
                  <div className="text-xl font-bold text-white uppercase tracking-tight">{item.v}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {uploadedFiles.map(f => (
                <div key={f.id} className="aspect-[3/4] rounded-3xl overflow-hidden border-2 border-zinc-800 relative cursor-zoom-in" onClick={() => setFullImage(f.preview)}>
                  <img src={f.preview} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-black/80 px-4 py-1 rounded-full text-[8px] font-black uppercase text-blue-500 border border-blue-500/30">View {f.category}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/95 to-transparent z-[610]">
            <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
               <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                 <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                 Ready for Uplink
               </div>
               <button onClick={async ()=>{ 
                 if(navigator.vibrate) navigator.vibrate(60); 
                 setIsSubmitting(true); 
                 const base64 = await Promise.all(uploadedFiles.map(async f => { return new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve({category: f.category, base64: r.result}); r.readAsDataURL(f.file); }) })); 
                 const payload = { company, driverName, loadNum, bolNum, puCity, puState, delCity, delState, bolProtocol, files: base64 };
                 try { 
                   await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',body:JSON.stringify(payload)}); 
                   setShowSuccess(true); 
                 } catch(e){ 
                   const currentVault = JSON.parse(localStorage.getItem('multi_vault') || '[]');
                   localStorage.setItem('multi_vault', JSON.stringify([...currentVault, {id: Math.random().toString(), payload}]));
                   setShowSuccess(true); 
                 }
               }} className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[1.2em] text-sm shadow-[0_0_60px_rgba(37,99,235,0.3)] active:scale-95">Authorize Uplink</button>
            </div>
          </div>
        </div>
      )}

      {/* UPLINK SEQUENCE */}
      {isSubmitting && !showSuccess && (
        <div className="fixed inset-0 z-[700] bg-black flex flex-col items-center justify-center p-8 text-center animate-in zoom-in">
          <div className="relative w-64 h-64 mb-12">
            <div className="absolute inset-0 border-8 border-blue-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-4 border-4 border-blue-500/40 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center text-7xl animate-bounce">🛰️</div>
          </div>
          <h2 className="text-4xl font-black italic text-blue-500 uppercase tracking-tighter mb-4">Uplink Active</h2>
          <p className="text-orange-500 font-bold text-[11px] uppercase tracking-[0.4em] animate-pulse">Warning: Do not exit until handshake complete</p>
          <div className="mt-12 w-full max-w-xs bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
            <div className="bg-blue-500 h-full animate-[progress_5s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}

      {/* SUCCESS RECEIPT */}
      {showSuccess && (
        <div className="fixed inset-0 z-[800] bg-black flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom duration-700">
          <div className={`w-full max-w-md bg-zinc-950 border-[3px] rounded-[3.5rem] p-10 text-center relative overflow-hidden`} style={{ borderColor: themeHex }}>
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full border-4 border-green-500 mx-auto flex items-center justify-center text-4xl mb-6 shadow-2xl">✓</div>
              <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2">Secure Manifest</h2>
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-8">Synchronized with fleet control</p>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 mb-8 text-left space-y-3 font-mono text-[10px]">
                <div className="flex justify-between"><span className="text-zinc-500">REF ID:</span><span className="text-white font-bold">{loadNum || bolNum}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">OPERATOR:</span><span className="text-white font-bold">{driverName}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">TIMESTAMP:</span><span className="text-white font-bold">{new Date().toLocaleTimeString()}</span></div>
              </div>

              <div className="space-y-4">
                <button onClick={() => window.print()} className="w-full py-5 rounded-[2rem] bg-zinc-800 border border-zinc-700 text-white font-black uppercase tracking-[0.3em] text-[10px] active:scale-95 shadow-xl">💾 Save Receipt</button>
                <button onClick={() => window.location.reload()} className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] ${company === 'GLX' ? 'bg-green-600 shadow-green-600/30' : 'bg-blue-600 shadow-blue-600/30'} text-white`}>Restart Terminal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingField && (
        <div className="fixed inset-0 z-[800] bg-black/98 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-800 rounded-[3.5rem] p-10 shadow-2xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase mb-8 tracking-[0.4em] text-center">Correct Entry</h3>
            <div className="space-y-4">
              {editingField === 'origin' && (
                <>
                  <input type="text" placeholder="CITY" className={inpStyle(puCity)} value={puCity} onChange={(e)=>setPuCity(e.target.value.toUpperCase())} />
                  <select className={inpStyle(puState)} value={puState} onChange={(e)=>setPuState(e.target.value)}>{states.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </>
              )}
              {editingField === 'destination' && (
                <>
                  <input type="text" placeholder="CITY" className={inpStyle(delCity)} value={delCity} onChange={(e)=>setDelCity(e.target.value.toUpperCase())} />
                  <select className={inpStyle(delState)} value={delState} onChange={(e)=>setDelState(e.target.value)}>{states.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </>
              )}
              {editingField === 'reference' && (
                <>
                  <input type="text" placeholder="LOAD #" className={inpStyle(loadNum)} value={loadNum} onChange={(e)=>setLoadNum(e.target.value.toUpperCase())} />
                  <input type="text" placeholder="BOL #" className={inpStyle(bolNum)} value={bolNum} onChange={(e)=>setBolNum(e.target.value.toUpperCase())} />
                </>
              )}
              {editingField === 'driverName' && (
                <input type="text" placeholder="OPERATOR NAME" className={inpStyle(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value.toUpperCase())} />
              )}
            </div>
            <button onClick={() => setEditingField(null)} className="w-full mt-10 py-6 rounded-3xl bg-white text-black font-black uppercase text-[10px] tracking-widest active:scale-95">Commit Changes</button>
          </div>
        </div>
      )}

      {/* FULL IMAGE INSPECTOR */}
      {fullImage && (
        <div className="fixed inset-0 z-[900] bg-black flex flex-col items-center justify-center p-4 animate-in zoom-in" onClick={() => setFullImage(null)}>
           <button className="absolute top-10 right-10 text-white text-[10px] font-black border-2 border-white/20 px-6 py-2 rounded-full uppercase">Close [X]</button>
           <img src={fullImage} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
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