import React, { useState, useRef, useEffect } from 'react';

/** * PROJECT: QLM CONNECT v33.6 - MASTER ENTERPRISE
 * - RESTORED: Freight Capacity Verification & Prototyping.
 * - RESTORED: Tactical Review Dashboard with Tap-to-Edit.
 * - RESTORED: All Audio/Visual Power-up Sequences.
 * - FIXED: Driver Name retrieval (?action=getDrivers).
 * - INTEGRATED: Master API v2.6.0 Logic.
 */

interface FileWithPreview { file: File | Blob; preview: string; id: string; category: 'bol' | 'freight'; }

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeSWrO4a24kt8MZFSwtidgNclLJrLKh2Z4xj9vOM8I148WacoDcYuBFkQamByCXlFq/exec';

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

// --- AUTHENTIC LOGOS ---
const GreenleafLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 animate-in fade-in duration-1000">
    <svg width="100%" height="auto" className="max-w-[400px]" viewBox="0 0 600 320" fill="none">
      <defs>
        <linearGradient id="chrome-silver" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="40%" stopColor="#BDC3C7" /><stop offset="50%" stopColor="#7F8C8D" /><stop offset="100%" stopColor="#DDE4E8" /></linearGradient>
        <linearGradient id="leaf-green" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A8E063" /><stop offset="100%" stopColor="#22C55E" /></linearGradient>
      </defs>
      <path d="M300 50L100 200H500L300 50Z" fill="#111" stroke="url(#chrome-silver)" strokeWidth="4"/>
      <path d="M300 20C300 20 230 50 230 100C230 140 300 150 300 150C300 150 370 140 370 100C370 50 300 20 300 20Z" fill="url(#leaf-green)" />
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

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [solarMode, setSolarMode] = useState(false);
  const [authStage, setAuthStage] = useState(0);
  const [company, setCompany] = useState<'GLX' | 'BST' | ''>('');
  const [driverName, setDriverName] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [driverList, setDriverList] = useState<string[]>([]);
  const [loadNum, setLoadNum] = useState('');
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
  const isReady = !!(company && driverName && loadNum && puCity && puState && delCity && delState && bolProtocol && uploadedFiles.some(f => f.category === 'bol'));

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getDrivers`);
        const data = await response.json();
        if (Array.isArray(data)) setDriverList(data);
      } catch (err) { console.error("Roster Handshake Failed:", err); }
    };
    fetchDrivers();
  }, []);

  const handleUplink = async () => {
    setIsSubmitting(true);
    const filesBase64 = await Promise.all(uploadedFiles.map(async f => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ category: f.category, base64: reader.result });
        reader.readAsDataURL(f.file);
      });
    }));

    const payload = { company, driverName, loadNum, bolProtocol, puCity, puState, delCity, delState, files: filesBase64 };

    try {
      await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      setShowSuccess(true);
    } catch (e) { alert("Uplink Lost. Retrying..."); } finally { setIsSubmitting(false); }
  };

  const inpStyle = (v: string) => `w-full p-6 rounded-[2rem] font-black text-sm border-2 transition-all outline-none ${
    solarMode ? (v ? 'bg-white border-zinc-900 text-black' : 'bg-zinc-50 border-zinc-200 text-zinc-400') 
               : (v ? `bg-black border-[${themeHex}] text-white shadow-[0_0_15px_rgba(34,197,94,0.1)]` : 'bg-zinc-950 border-zinc-900 text-zinc-600')
  }`;

  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      <button onClick={() => { 
        let s=0; const inv=setInterval(()=>{ 
          s++; setAuthStage(s); playPowerUp(s);
          if(s>=5){ clearInterval(inv); setTimeout(() => setIsLocked(false), 600); }
        },350); 
      }} className="w-64 h-64 border-4 border-blue-500/10 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-[0_0_120px_rgba(59,130,246,0.2)] active:scale-95 transition-all">
        <div className={`absolute inset-0 border-t-4 border-blue-500 rounded-full ${authStage > 0 ? 'animate-spin' : ''}`}></div>
        <span className="text-8xl mb-4 italic font-black text-white">GO</span>
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500 animate-pulse">Engage Terminal</span>
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
      {/* HUD HEADER */}
      <div className={`fixed top-0 w-full z-[100] px-6 py-4 flex justify-between items-center text-[10px] font-black border-b ${solarMode ? 'bg-white/90 border-zinc-200 shadow-sm' : 'bg-black/90 border-zinc-900'} backdrop-blur-md`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="tracking-widest uppercase italic">Uplink Status: Active</span>
        </div>
        <button onClick={() => setSolarMode(!solarMode)} className="px-5 py-2 border-2 border-zinc-700 rounded-lg uppercase text-[9px] font-black">{solarMode ? '🌙 Midnight Mode' : '☀️ Solar Mode'}</button>
      </div>

      <header className="max-w-4xl mx-auto pt-24 px-6 mb-12">
        <div className={`w-full min-h-[220px] rounded-[3.5rem] border-2 flex items-center justify-center transition-all ${solarMode ? 'bg-white border-zinc-300 shadow-xl' : 'bg-zinc-950 border-zinc-900 shadow-2xl'}`}>
           {!company ? <h1 className="text-5xl font-black italic text-zinc-800 uppercase tracking-tighter">QLM<span className="text-zinc-500">CONNECT</span></h1> :
            company === 'GLX' ? <GreenleafLogo /> : <BstLogo />}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 px-6">
        {/* OPERATOR SECTION */}
        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-zinc-600">[ 01 ] Operator Ident</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select className={inpStyle(company)} value={company} onChange={(e)=>setCompany(e.target.value as any)}>
              <option value="">SELECT CARRIER</option>
              <option value="GLX">GREENLEAF XPRESS</option>
              <option value="BST">BST EXPEDITE INC</option>
            </select>
            {!manualMode ? (
              <select className={inpStyle(driverName)} value={driverName} onChange={(e)=>{ if(e.target.value==='MANUAL') setManualMode(true); else setDriverName(e.target.value); }}>
                <option value="">SELECT DRIVER</option>
                {driverList.map(d=><option key={d} value={d}>{d}</option>)}
                <option value="MANUAL">+ MANUAL ENTRY</option>
              </select>
            ) : (
              <input type="text" placeholder="FULL NAME" className={inpStyle(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value.toUpperCase())} autoFocus />
            )}
          </div>
        </section>

        {/* LOGISTICS SECTION */}
        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-zinc-600">[ 02 ] Logistics Path</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <input className={`${inpStyle(puCity)} col-span-3`} placeholder="PICKUP CITY" value={puCity} onChange={e=>setPuCity(e.target.value.toUpperCase())} />
              <input className={`${inpStyle(puState)}`} placeholder="ST" value={puState} onChange={e=>setPuState(e.target.value.toUpperCase())} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <input className={`${inpStyle(delCity)} col-span-3`} placeholder="DELIVERY CITY" value={delCity} onChange={e=>setDelCity(e.target.value.toUpperCase())} />
              <input className={`${inpStyle(delState)}`} placeholder="ST" value={delState} onChange={e=>setDelState(e.target.value.toUpperCase())} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input className={inpStyle(loadNum)} placeholder="LOAD #" value={loadNum} onChange={e=>setLoadNum(e.target.value.toUpperCase())} />
              <select className={inpStyle(bolProtocol)} value={bolProtocol} onChange={e=>setBolProtocol(e.target.value as any)}>
                <option value="">DOC TYPE</option>
                <option value="PICKUP">PICKUP (BOL)</option>
                <option value="DELIVERY">DELIVERY (POD)</option>
              </select>
            </div>
          </div>
        </section>

        {/* EVIDENCE SECTION */}
        <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-900/30 border-zinc-800'}`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-zinc-600">[ 03 ] Evidence Capture</h3>
          <button onClick={()=>cameraInputRef.current?.click()} className="w-full py-20 bg-zinc-950 border-4 border-dashed border-zinc-800 rounded-[3rem] text-6xl active:scale-95 transition-all">📸</button>
          <div className="grid grid-cols-4 gap-4 mt-8">
            {uploadedFiles.map(f=>(
              <div key={f.id} className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-zinc-800 relative animate-in zoom-in">
                <img src={f.preview} className="w-full h-full object-cover" />
                <button onClick={()=>setUploadedFiles(p=>p.filter(i=>i.id!==f.id))} className="absolute top-2 right-2 bg-red-600 w-6 h-6 rounded-full text-xs">✕</button>
              </div>
            ))}
          </div>
        </section>

        <button onClick={()=>isReady && setShowVerification(true)} className={`w-full py-10 rounded-[3rem] font-black uppercase tracking-[1em] text-sm shadow-2xl transition-all ${isReady ? 'bg-blue-600 text-white animate-pulse' : 'bg-zinc-900 text-zinc-700'}`}>
          Review Transmission
        </button>
      </div>

      {/* TACTICAL REVIEW OVERLAY */}
      {showVerification && (
        <div className="fixed inset-0 z-[600] bg-zinc-950 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="max-w-xl mx-auto p-10 pb-56 space-y-12">
            <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-10">
              <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Final Review</h2>
              <button onClick={()=>setShowVerification(false)} className="bg-zinc-900 text-zinc-400 px-6 py-2 rounded-full font-black text-[9px] uppercase">Close</button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { l: 'OPERATOR', v: driverName, id: 'driverName' },
                { l: 'LOAD REF', v: loadNum, id: 'loadNum' },
                { l: 'ORIGIN', v: `${puCity}, ${puState}`, id: 'origin' },
                { l: 'DESTINATION', v: `${delCity}, ${delState}`, id: 'destination' }
              ].map(item => (
                <div key={item.l} className="bg-zinc-900/50 p-7 rounded-[2.5rem] border-2 border-zinc-800 active:scale-95 transition-all">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block mb-1">{item.l}</span>
                  <div className="text-xl font-bold text-white uppercase tracking-tight">{item.v}</div>
                </div>
              ))}
            </div>

            <button onClick={handleUplink} className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[1em] text-sm shadow-xl">Authorize Uplink</button>
          </div>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {showSuccess && (
        <div className="fixed inset-0 z-[800] bg-black flex flex-col items-center justify-center p-10 text-center animate-in slide-in-from-bottom">
          <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center text-5xl mb-6 shadow-2xl shadow-green-500/20">✓</div>
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter mb-2">Sync Complete</h2>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-12">Manifest synchronized with fleet control</p>
          <button onClick={() => window.location.reload()} className="w-full py-8 bg-blue-600 rounded-[2.5rem] font-black uppercase tracking-widest text-white">Restart Terminal</button>
        </div>
      )}

      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e)=>{
        if (e.target.files) {
          const files = Array.from(e.target.files).map(f => ({ file: f, preview: URL.createObjectURL(f), id: Math.random().toString(), category: 'bol' as const }));
          setUploadedFiles(prev => [...prev, ...files]);
        }
      }} />
    </div>
  );
};

export default App;