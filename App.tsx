import React, { useState, useRef, useEffect } from 'react';

/** * PROJECT: QLM CONNECT v33.4 - ENTERPRISE GRADE
 * - INTEGRATED: Version 2.6.0 Master API logic.
 * - FIXED: Driver Name retrieval via Query Parameters (?action=getDrivers).
 * - ADDED: Enhanced Data Integrity checks before Uplink.
 */

interface FileWithPreview { file: File | Blob; preview: string; id: string; category: 'bol' | 'freight'; }

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeSWrO4a24kt8MZFSwtidgNclLJrLKh2Z4xj9vOM8I148WacoDcYuBFkQamByCXlFq/exec';

// --- LOGO COMPONENTS (GLX / BST) ---
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
  const [driverList, setDriverList] = useState<string[]>([]);
  const [company, setCompany] = useState<'GLX' | 'BST' | ''>('');
  const [driverName, setDriverName] = useState('');
  const [loadNum, setLoadNum] = useState('');
  const [puCity, setPuCity] = useState('');
  const [puState, setPuState] = useState('');
  const [delCity, setDelCity] = useState('');
  const [delState, setDelState] = useState('');
  const [bolProtocol, setBolProtocol] = useState<'PICKUP' | 'DELIVERY' | ''>('');
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- [EFFECT] FETCH DRIVER ROSTER ---
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        // Appends the ?action=getDrivers parameter required by the script
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getDrivers`);
        const data = await response.json();
        if (Array.isArray(data)) setDriverList(data);
      } catch (err) {
        console.error("Uplink to Roster Failed:", err);
      }
    };
    fetchDrivers();
  }, []);

  const isReady = !!(company && driverName && loadNum && puCity && puState && delCity && delState && bolProtocol && uploadedFiles.length > 0);

  const handleUplink = async () => {
    setIsSubmitting(true);
    
    // Convert images to Base64 for Google Drive storage
    const filesBase64 = await Promise.all(uploadedFiles.map(async f => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result, category: f.category });
        reader.readAsDataURL(f.file);
      });
    }));

    const payload = {
      company,
      driverName,
      loadNum,
      bolProtocol,
      puCity,
      puState,
      delCity,
      delState,
      files: filesBase64
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Essential for Google Apps Script
        body: JSON.stringify(payload)
      });
      setShowSuccess(true);
    } catch (e) {
      alert("Critical Uplink Failure. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLocked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      <button onClick={() => setIsLocked(false)} className="w-64 h-64 border-4 border-blue-500/10 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-[0_0_120px_rgba(59,130,246,0.2)] active:scale-95 transition-all group">
        <span className="text-8xl mb-2 italic font-black text-white">GO</span>
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500">Engage QLM Terminal</span>
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${solarMode ? 'bg-zinc-100 text-black' : 'bg-[#020202] text-zinc-100'} pb-32`}>
      {/* HEADER */}
      <div className="max-w-4xl mx-auto pt-12 px-6">
        <div className={`w-full min-h-[180px] rounded-[3rem] border-2 flex items-center justify-center mb-10 ${solarMode ? 'bg-white border-zinc-300' : 'bg-zinc-950 border-zinc-900 shadow-2xl'}`}>
           {!company ? <h1 className="text-4xl font-black italic text-zinc-800 uppercase">QLM<span className="text-zinc-500">CONNECT</span></h1> :
            company === 'GLX' ? <GreenleafLogo /> : <BstLogo />}
        </div>

        {/* FORM FIELDS */}
        <div className="space-y-6">
          <select 
            className="w-full p-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl font-black text-white outline-none focus:border-blue-500" 
            value={company} 
            onChange={(e) => setCompany(e.target.value as any)}
          >
            <option value="">SELECT CARRIER</option>
            <option value="GLX">GREENLEAF XPRESS</option>
            <option value="BST">BST EXPEDITE INC</option>
          </select>

          <select 
            className="w-full p-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl font-black text-white outline-none focus:border-blue-500"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
          >
            <option value="">SELECT OPERATOR</option>
            {driverList.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input 
              className="p-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl font-black text-white uppercase" 
              placeholder="LOAD #" 
              value={loadNum}
              onChange={(e) => setLoadNum(e.target.value)}
            />
            <select 
              className="p-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl font-black text-white"
              value={bolProtocol}
              onChange={(e) => setBolProtocol(e.target.value as any)}
            >
              <option value="">DOC TYPE</option>
              <option value="PICKUP">PICKUP (BOL)</option>
              <option value="DELIVERY">DELIVERY (POD)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <input className="col-span-2 p-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl font-black text-white uppercase" placeholder="CITY" value={puCity} onChange={(e) => setPuCity(e.target.value)} />
             <input className="p-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl font-black text-white uppercase" placeholder="ST" value={puState} onChange={(e) => setPuState(e.target.value)} />
          </div>

          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="w-full py-16 bg-zinc-900/50 border-4 border-dashed border-zinc-800 rounded-[3rem] text-5xl active:scale-95 transition-all"
          >
            📸
          </button>

          <button 
            disabled={!isReady}
            onClick={handleUplink}
            className={`w-full py-10 rounded-[3rem] font-black uppercase tracking-[1em] transition-all ${isReady ? 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.4)] animate-pulse' : 'bg-zinc-800 text-zinc-600'}`}
          >
            Authorize Uplink
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-10 text-center animate-in slide-in-from-bottom duration-500">
          <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center text-5xl mb-6">✓</div>
          <h2 className="text-4xl font-black uppercase italic mb-2">Sync Complete</h2>
          <p className="text-zinc-500 font-bold tracking-widest mb-10 uppercase">Manifest logged to motherboard</p>
          <button onClick={() => window.location.reload()} className="w-full py-6 bg-blue-600 rounded-[2rem] font-black uppercase tracking-widest text-white">Restart Terminal</button>
        </div>
      )}

      {/* HIDDEN INPUT */}
      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" accept="image/*" multiple onChange={(e) => {
        if (e.target.files) {
          const files = Array.from(e.target.files).map(f => ({
            file: f,
            preview: URL.createObjectURL(f),
            id: Math.random().toString(),
            category: 'bol' as const
          }));
          setUploadedFiles(files);
        }
      }} />
    </div>
  );
};

export default App;