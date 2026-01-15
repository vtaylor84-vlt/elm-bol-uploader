import React, { useState, useRef, useEffect } from 'react';

/** * LOGISTICS TERMINAL v32.7 - MISSION CONTROL 
 * - TACTICAL REDESIGN: Prevents button-over-photo clipping.
 * - TAP-TO-EDIT: Fully functional mapping for all logistics data.
 * - OFFLINE VAULT: Automatic local storage backup.
 * - HAPTIC: Physical vibration confirmation.
 */

interface FileWithPreview { file: File | Blob; preview: string; id: string; category: 'bol' | 'freight'; }
interface VaultEntry { id: string; timestamp: number; payload: any; }

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-L6nKjgfAnLFPgezkf3inQTJRG3Ql_MufZ-jlKWhSbPdEHeQniPLdNQDaidM2EY6MdA/exec';

// --- AUDIO UTILITIES ---
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

// --- LOGOS ---
export const GreenleafLogo = () => (
  <div className="flex flex-col items-center justify-center p-4">
    <svg width="100%" height="auto" className="max-w-[320px]" viewBox="0 0 600 320" fill="none">
      <defs>
        <linearGradient id="leaf-green" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A8E063" /><stop offset="100%" stopColor="#22C55E" /></linearGradient>
      </defs>
      <path d="M300 50L100 200H500L300 50Z" fill="#111" stroke="#BDC3C7" strokeWidth="4"/>
      <path d="M300 20C300 20 230 50 230 100C230 140 300 150 300 150C300 150 370 140 370 100C370 50 300 20 300 20Z" fill="url(#leaf-green)" />
      <text x="300" y="250" textAnchor="middle" style={{ fontFamily: 'Arial Black', fontSize: '44px', fontWeight: '900', fill: '#BDC3C7', fontStyle: 'italic' }}>GREENLEAF XPRESS</text>
    </svg>
  </div>
);

export const BstLogo = () => (
  <div className="flex flex-col items-center justify-center p-4 w-full"> 
    <svg width="280" height="100" viewBox="0 0 400 120">
      <text x="200" y="75" textAnchor="middle" style={{ fontSize: '95px', fill: '#3b82f6', fontFamily: 'Arial Black', fontWeight: '900', fontStyle: 'italic' }}>BST</text>
    </svg>
  </div>
);

// --- MAIN APP ---
const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
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
  const [showVerification, setShowVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const enh = await compressAndEnhanceImage(f);
        setUploadedFiles(prev => [...prev, { file: enh, preview: URL.createObjectURL(enh), id: Math.random().toString(), category: 'bol' }]);
      }
    }
  };

  const syncVault = async () => {
    setIsSubmitting(true);
    const currentVault = [...vaultEntries];
    for (const entry of currentVault) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(entry.payload) });
        vaultEntries.shift();
      } catch (e) { break; }
    }
    setVaultEntries([...vaultEntries]);
    localStorage.setItem('multi_vault', JSON.stringify([...vaultEntries]));
    setIsSubmitting(false);
  };

  const getTacticalStyles = (v: string) => `w-full p-5 rounded-2xl font-mono text-sm border-2 transition-all outline-none ${v ? `bg-black text-white border-[${themeHex}] shadow-lg` : 'bg-zinc-100 text-black border-zinc-200'}`;

  // --- LOCK SCREEN ---
  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center">
      <button onClick={() => { 
        let s=0; const inv=setInterval(()=>{ 
          s++; setAuthStage(s); playSound(200+(s*100),'sine',0.1); 
          if(s>=4){ clearInterval(inv); setIsLocked(false); }
        },400); 
      }} className="w-48 h-48 border-4 border-blue-500/30 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-2xl active:scale-95 transition-all">
        <span className="text-6xl mb-2">🛡️</span>
        <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">Initialize</span>
      </button>
      {vaultEntries.length > 0 && (
        <button onClick={syncVault} className="mt-12 w-full max-w-xs border-2 border-orange-500 p-6 rounded-[2.5rem] flex justify-between items-center active:scale-95">
          <div className="text-left font-black uppercase text-[10px] text-orange-500">Vault: {vaultEntries.length} Pending</div>
          <span>📡</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 pb-24 px-4 font-sans">
      
      <header className="max-w-4xl mx-auto pt-10 mb-8">
        <div className={`w-full min-h-[200px] rounded-[3.5rem] border-2 flex items-center justify-center bg-black`} style={{ borderColor: company ? themeHex : '#222' }}>
           {!company && <h1 className="text-4xl font-black italic text-zinc-800 uppercase tracking-tighter">QLM CONNECT</h1>}
           {company === 'GLX' && <GreenleafLogo />} {company === 'BST' && <BstLogo />}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-6 border-zinc-800" style={{ borderColor: company ? themeHex : '' }}>
          <select className={getTacticalStyles(company)} value={company} onChange={(e)=>setCompany(e.target.value as any)}>
            <option value="">SELECT CARRIER</option>
            <option value="GLX">GREENLEAF XPRESS</option>
            <option value="BST">BST EXPEDITE INC</option>
          </select>
          <div className="mt-4">
            {!manualMode ? (
              <select className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>{ if(e.target.value==='MANUAL') setManualMode(true); else setDriverName(e.target.value); }}>
                <option value="">SELECT DRIVER</option>
                {driverList.map(d=><option key={d} value={d}>{d}</option>)}
                <option value="MANUAL">+ MANUAL ENTRY</option>
              </select>
            ) : (
              <input type="text" placeholder="FULL NAME" className={getTacticalStyles(driverName)} value={driverName} onChange={(e)=>setDriverName(e.target.value.toUpperCase())} />
            )}
          </div>
        </section>

        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-6 border-zinc-800">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="LOAD #" className={getTacticalStyles(loadNum)} value={loadNum} onChange={(e)=>setLoadNum(e.target.value.toUpperCase())} />
            <input type="text" placeholder="BOL #" className={getTacticalStyles(bolNum)} value={bolNum} onChange={(e)=>setBolNum(e.target.value.toUpperCase())} />
          </div>
        </section>

        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-6 border-zinc-800">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2"><input type="text" placeholder="PICKUP CITY" className={getTacticalStyles(puCity)} value={puCity} onChange={(e)=>setPuCity(e.target.value.toUpperCase())} /></div>
            <select className={getTacticalStyles(puState)} value={puState} onChange={(e)=>setPuState(e.target.value)}><option value="">ST</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><input type="text" placeholder="DELIVERY CITY" className={getTacticalStyles(delCity)} value={delCity} onChange={(e)=>setDelCity(e.target.value.toUpperCase())} /></div>
            <select className={getTacticalStyles(delState)} value={delState} onChange={(e)=>setDelState(e.target.value)}><option value="">ST</option>{states.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
        </section>

        <section className="bg-zinc-900/40 border-2 rounded-[2.5rem] p-6 border-zinc-800 text-center">
          <div className="flex gap-4 mb-6">
            <button onClick={()=>setBolProtocol('PICKUP')} className={`w-full py-4 rounded-xl font-black text-[10px] border-2 ${bolProtocol === 'PICKUP' ? 'bg-black text-white' : 'bg-white text-zinc-500'}`}>PICKUP</button>
            <button onClick={()=>setBolProtocol('DELIVERY')} className={`w-full py-4 rounded-xl font-black text-[10px] border-2 ${bolProtocol === 'DELIVERY' ? 'bg-black text-white' : 'bg-white text-zinc-500'}`}>DELIVERY</button>
          </div>
          <button onClick={()=>cameraInputRef.current?.click()} className="w-full py-12 bg-zinc-800 rounded-3xl text-4xl mb-4 border border-zinc-700 active:scale-95 transition-all">📸</button>
          <div className="grid grid-cols-4 gap-2">
            {uploadedFiles.map(f=>(
              <div key={f.id} className="aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800"><img src={f.preview} className="w-full h-full object-cover" alt="BOL"/></div>
            ))}
          </div>
        </section>

        <button onClick={()=>isReady && setShowVerification(true)} className={`w-full py-10 rounded-[2.5rem] font-black uppercase tracking-widest ${isReady ? (company === 'GLX' ? 'bg-green-600' : 'bg-blue-600') : 'bg-zinc-900 text-zinc-700 opacity-50'} text-white`}>
          REVIEW DOCUMENTS
        </button>
      </div>

      {/* --- REDESIGNED TACTICAL REVIEW OVERLAY --- */}
      {showVerification && (
        <div className="fixed inset-0 z-[500] bg-zinc-950 overflow-y-auto pb-48 animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur-md flex justify-between">
            <button onClick={() => setShowVerification(false)} className="text-zinc-500 font-black text-[10px]">← BACK</button>
            <span className={`text-[10px] font-black uppercase ${themeColor}`}>Final Audit</span>
            <div className="w-10"></div>
          </div>

          <div className="max-w-xl mx-auto p-6 space-y-6">
            <div onClick={() => setEditingField('origin')} className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 active:scale-95 transition-all">
              <span className="block text-[9px] font-black text-orange-500 mb-2 uppercase">Pickup (Tap to Edit)</span>
              <div className="text-2xl font-black uppercase">{puCity || 'Missing City'}</div>
              <div className="text-sm font-bold text-zinc-500">{puState || 'Missing State'}</div>
            </div>

            <div onClick={() => setEditingField('destination')} className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 active:scale-95 transition-all">
              <span className="block text-[9px] font-black text-green-500 mb-2 uppercase">Delivery (Tap to Edit)</span>
              <div className="text-2xl font-black uppercase">{delCity || 'Missing City'}</div>
              <div className="text-sm font-bold text-zinc-500">{delState || 'Missing State'}</div>
            </div>

            <div onClick={() => setEditingField('reference')} className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 active:scale-95 transition-all">
              <span className="block text-[9px] font-black text-blue-500 mb-2 uppercase">References (Tap to Edit)</span>
              <div className="flex gap-8">
                <div><span className="block text-[8px] text-zinc-600 font-bold uppercase">Load #</span><div className="font-bold">{loadNum || '---'}</div></div>
                <div><span className="block text-[8px] text-zinc-600 font-bold uppercase">BOL #</span><div className="font-bold">{bolNum || '---'}</div></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              {uploadedFiles.map(f => (
                <div key={f.id} className="aspect-[3/4] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-xl">
                  <img src={f.preview} className="w-full h-full object-cover" alt="R" />
                </div>
              ))}
            </div>
          </div>

          {/* STICKY ACTION BAR */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
            <button onClick={async () => {
              if (navigator.vibrate) navigator.vibrate(60);
              setIsSubmitting(true);
              const base64 = await Promise.all(uploadedFiles.map(async f => { return new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve({category: 'bol', base64: r.result}); r.readAsDataURL(f.file); }) })); 
              const payload = { company, driverName, loadNum, bolNum, puCity, puState, delCity, delState, bolProtocol, files: base64 }; 
              try { 
                await fetch(GOOGLE_SCRIPT_URL, {method: 'POST', mode: 'no-cors', body: JSON.stringify(payload)}); 
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                setShowSuccess(true); 
              } catch(e) { 
                const currentVault = JSON.parse(localStorage.getItem('multi_vault') || '[]');
                localStorage.setItem('multi_vault', JSON.stringify([...currentVault, {id: Math.random().toString(), payload}]));
                setShowSuccess(true); 
              }
            }} className={`w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[1em] text-sm ${company === 'GLX' ? 'bg-green-600 shadow-green-600/30' : 'bg-blue-600 shadow-blue-600/30'} text-white shadow-2xl`}>
              AUTHORIZE UPLINK
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingField && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] p-8">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase mb-6">Correction Input</h3>
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
            </div>
            <button onClick={() => setEditingField(null)} className="w-full mt-8 py-5 rounded-3xl bg-white text-black font-black uppercase text-[10px]">SAVE CHANGES</button>
          </div>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {showSuccess && (
        <div className="fixed inset-0 z-[700] bg-black flex flex-col items-center justify-center p-8 text-center">
           <div className="text-6xl mb-6">✅</div>
           <h2 className="text-3xl font-black italic uppercase mb-2">Transmission Secure</h2>
           <p className="text-zinc-500 font-bold text-[10px] uppercase mb-12">System Manifest Updated</p>
           <button onClick={() => window.location.reload()} className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-widest ${company === 'GLX' ? 'bg-green-600' : 'bg-blue-600'} text-white`}>RETURN TO BASE</button>
        </div>
      )}

      {/* UPLINK ANIMATION */}
      {isSubmitting && !showSuccess && (
        <div className="fixed inset-0 z-[600] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
          <div className="text-5xl mb-6 animate-bounce">🛰️</div>
          <div className={`text-xl font-black italic tracking-tighter ${themeColor}`}>UPLINK ACTIVE...</div>
        </div>
      )}

      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" accept="image/*" multiple onChange={onFileSelect} />
    </div>
  );
};

export default App;