import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleAuth } from '../auth/useGoogleAuth.js';
import { analyzeSheet, formatMetadataForPrompt } from '../services/sheetAnalyzer.js';
import { generateDashboardConfig, generateMultipleDashboardConfigs } from '../services/geminiService.js';
import DynamicDashboard from '../engine/DynamicDashboard.jsx';
import { Sparkles, Loader2, CheckCircle, ArrowRight, RefreshCw, Layout, Layers, Columns, Info, AlertCircle, Send, MessageSquare, UserCheck, ArrowLeft } from 'lucide-react';

export default function AnalyzePage() {
  const navigate = useNavigate();
  // ... rest of the component
  const { user, accessToken } = useGoogleAuth();

  const [spreadsheetId] = useState(localStorage.getItem('connectedSheetId') || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [uiConfigs, setUiConfigs] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [step, setStep] = useState('idle');

  useEffect(() => {
    if (!spreadsheetId) navigate('/');
  }, [spreadsheetId, navigate]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setStep('analyzing');
    try {
      const data = await analyzeSheet(spreadsheetId, accessToken);
      setMetadata(data);
      setStep('analyzed');
    } catch (error) {
      console.error('Analysis failed:', error);
      setStep('idle');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateDashboard = async () => {
    setGenerating(true);
    try {
      const configs = await generateMultipleDashboardConfigs(metadata, prompt);
      setUiConfigs(configs);
      setStep('generated');
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleLock = () => {
    setIsLocked(true);
    localStorage.setItem('dashboardConfig', JSON.stringify(uiConfigs[selectedIndex]));
    navigate('/budget');
  };

  if (step === 'generated') {
    const currentConfig = uiConfigs[selectedIndex];
    return (
      <div className="min-h-screen bg-[#0F172A] text-white p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('analyzed')} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tight">TASARIM SEÇİMİ</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nokta AI Tarafından Üretildi</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {!isLocked && (
                <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-white/5">
                  {uiConfigs.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-10 h-10 rounded-xl font-bold transition-all ${idx === selectedIndex ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-700'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={handleLock} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
                <CheckCircle size={18} /> TASARIMI ONAYLA
              </button>
            </div>
          </div>

          <div className="w-full">
            <DynamicDashboard uiConfig={currentConfig} spreadsheetId={spreadsheetId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[540px] relative z-10">
        <div className="glass-panel rounded-[40px] p-12 shadow-2xl text-center border-slate-700/30">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-[20px] flex items-center justify-center shadow-2xl shadow-blue-500/20 mx-auto mb-6">
              <Sparkles size={32} color="white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Nokta Dashboard</h1>
            <p className="text-slate-400 font-medium">Verilerinizi Yapay Zeka ile Görselleştirin</p>
          </div>

          {step === 'idle' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Bağlı Sayfa Kimliği</p>
                <p className="text-xs text-blue-400 font-bold truncate">{spreadsheetId}</p>
              </div>
              <button onClick={handleAnalyze} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 text-lg">
                ANALİZİ BAŞLAT <ArrowRight size={22} />
              </button>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="py-10">
              <Loader2 size={64} className="animate-spin text-blue-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">VERİLER İNCELENİYOR</h2>
              <p className="text-slate-500 text-sm font-medium">Gemini AI tablolarınızı okuyor...</p>
            </div>
          )}

          {step === 'analyzed' && metadata && (
            <div className="text-left space-y-8 animate-fadeIn">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-emerald-400">
                <CheckCircle size={20} />
                <span className="font-bold text-sm uppercase tracking-tight">Analiz Tamam</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Satır</p>
                  <p className="text-lg font-black text-white">{metadata.rowCount}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Sütun</p>
                  <p className="text-lg font-black text-white">{metadata.headers.length}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Sayfa</p>
                  <p className="text-xs font-black text-white truncate">{metadata.sheetName}</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Dashboard Talimatı</label>
                <textarea className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Örn: Satışları analiz et ve aylık kar grafiği oluştur..." />
              </div>
              <button onClick={handleGenerateDashboard} disabled={generating} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 text-lg">
                {generating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                {generating ? 'ÜRETİLİYOR...' : 'DASHBOARD ÜRET'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-slate-500">{icon}</span>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight">{label}</p>
      </div>
      <p className="text-sm font-black text-white truncate">{value}</p>
    </div>
  );
}
