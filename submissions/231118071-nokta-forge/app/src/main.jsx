import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import GoogleAuthProvider from './auth/GoogleAuthProvider'
import './index.css'
import ConnectPage from './pages/ConnectPage.jsx'
import BudgetPage from './pages/BudgetPage.jsx'
import AnalyzePage from './pages/AnalyzePage.jsx'
import { AuditWidget } from './audit/components/AuditWidget'

const auditStorage = {
  loadNotes: async () => {
    try {
      const raw = localStorage.getItem('audit_notes');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Storage load failed, clearing...', e);
      localStorage.removeItem('audit_notes');
      return [];
    }
  },
  saveNotes: async (notes) => {
    try {
      // Auto-cleanup: if too many notes, keep only latest 3 to be safe
      const cappedNotes = notes.slice(-3);
      localStorage.setItem('audit_notes', JSON.stringify(cappedNotes));
    } catch (e) {
      console.error('Storage full! Auto-clearing to recover...', e);
      localStorage.removeItem('audit_notes');
      alert('Sistem hafızası dolduğu için eski raporlar otomatik temizlendi. Şimdi tekrar deneyebilirsiniz.');
    }
  }
};

function AuditWidgetWrapper({ storage, appName, reporterId }) {
  const location = useLocation();
  return (
    <AuditWidget 
      deps={{
        storage,
        currentScreen: location.pathname,
        appName,
        reporterId
      }} 
    />
  );
}

createRoot(document.getElementById('root')).render(
  <GoogleAuthProvider>
    <BrowserRouter>
      <div id="app-container" style={{ position: 'relative', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<ConnectPage />} />
          <Route path="/connect" element={<ConnectPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
        </Routes>
        <AuditWidgetWrapper 
          storage={auditStorage}
          appName="Nokta Canvas"
          reporterId="sudenur"
        />
      </div>
    </BrowserRouter>
  </GoogleAuthProvider>,
)
