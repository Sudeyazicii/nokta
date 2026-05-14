import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Bug, List, X, Check, Trash2, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { NoteManager } from '../core/storage';
import { buildMarkdown } from '../export/markdown';
import { buildDocx } from '../export/docx';
import { AuditNote, AuditStorage, AuditNoteBounds } from '../core/types';
import { AuditSelector } from './AuditSelector';
import { AuditOverlay } from './AuditOverlay';
import { AuditNoteList } from './AuditNoteList';

export interface AuditWidgetDeps {
  storage: AuditStorage;
  currentScreen: string;
  reporterId?: string;
  appName?: string;
}

interface Props {
  deps: AuditWidgetDeps;
}

type WidgetMode = 'idle' | 'capturing' | 'selecting' | 'annotating' | 'list';

export function AuditWidget({ deps }: Props) {
  const [mode, setMode] = useState<WidgetMode>('idle');
  const [notes, setNotes] = useState<AuditNote[]>([]);
  const [capturedUri, setCapturedUri] = useState('');
  const [selectedBounds, setSelectedBounds] = useState<AuditNoteBounds | null>(null);
  const managerRef = useRef(new NoteManager(deps.storage));
  const manager = managerRef.current;

  const loadNotes = useCallback(async () => {
    setNotes(await manager.getAll());
  }, [manager]);

  useEffect(() => {
    loadNotes();
    
    // Register Global Forge Hook
    (window as any).FORGE_EXECUTE = (note: AuditNote) => {
      console.log(`%c⚡ FORGE_REPAIR_REQUEST: "${note.note}"`, 'color: #e53e3e; font-weight: bold; font-size: 14px;');
      console.log(JSON.stringify({
        action: 'REPAIR',
        noteId: note.id,
        prompt: note.note,
        screen: note.screenName
      }));
      
      // Visual feedback
      const notification = document.createElement('div');
      notification.id = 'forge-notification';
      notification.innerHTML = `
        <div style="position:fixed; top:20px; right:20px; background:#1a202c; color:white; padding:16px 24px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:10003; border:1px solid #e53e3e; animation: slideIn 0.3s ease-out;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:10px; height:10px; background:#e53e3e; border-radius:50%; animation: pulse 1s infinite;"></div>
            <div style="font-weight:700; font-family:sans-serif;">FORGE REPAIR IN PROGRESS</div>
          </div>
          <div style="font-size:12px; margin-top:4px; opacity:0.8; font-family:sans-serif;">
            Fixing: "${note.note.substring(0, 30)}..."
          </div>
        </div>
        <style>
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        </style>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 4000);
    };

    return () => { delete (window as any).FORGE_EXECUTE; };
  }, [loadNotes]);

  const handleCapture = async () => {
    setMode('capturing');
    try {
      // Hide the widget before capture
      const widget = document.getElementById('audit-widget-fab');
      if (widget) widget.style.display = 'none';
      
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
      });
      
      if (widget) widget.style.display = 'flex';
      
      const uri = canvas.toDataURL('image/png');
      setCapturedUri(uri);
      setSelectedBounds(null);
      setMode('selecting');
    } catch (e) {
      console.error('[AuditWidget] capture failed:', e);
      setMode('idle');
    }
  };

  const handleOpenList = async () => {
    await loadNotes();
    setMode('list');
  };

  const handleSelectionConfirm = (bounds: AuditNoteBounds, annotatedUri: string) => {
    setSelectedBounds(bounds);
    setCapturedUri(annotatedUri);
    setMode('annotating');
  };

  const handleSaveNote = async (noteText: string) => {
    setMode('capturing'); // Visual feedback: processing
    
    const newNote = await manager.add({
      screenName: deps.currentScreen,
      screenshot: capturedUri,
      screenshotAspect: window.innerHeight / window.innerWidth,
      highlightBounds: selectedBounds,
      note: noteText,
      reporterId: deps.reporterId,
    });
    
    await loadNotes();
    setMode('idle');
    setCapturedUri('');

    // ⚡ FORGE EXECUTION TRIGGER
    // This log is intercepted by the Antigravity AI Agent to perform the autonomous repair.
    console.log(`%c⚡ FORGE_EXECUTE_START: "${noteText}"`, 'color: #e53e3e; font-weight: bold; font-size: 14px;');
    console.log(JSON.stringify({
      action: 'REPAIR',
      prompt: noteText,
      screen: deps.currentScreen,
      timestamp: new Date().toISOString()
    }));

    // Notify user that the agent is taking over
    const notification = document.createElement('div');
    notification.id = 'forge-notification';
    notification.innerHTML = `
      <div style="position:fixed; top:20px; right:20px; background:#1a202c; color:white; padding:16px 24px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:10002; border:1px solid #e53e3e; animation: slideIn 0.3s ease-out;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:10px; height:10px; background:#e53e3e; border-radius:50%; animation: pulse 1s infinite;"></div>
          <div style="font-weight:700; font-family:sans-serif;">FORGE ENGINE ACTIVE</div>
        </div>
        <div style="font-size:12px; margin-top:4px; opacity:0.8; font-family:sans-serif;">
          Repairing: "${noteText.substring(0, 30)}${noteText.length > 30 ? '...' : ''}"
        </div>
      </div>
      <style>
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
      </style>
    `;
    document.body.appendChild(notification);

    // Auto-remove notification after 5 seconds if not handled
    setTimeout(() => {
      const el = document.getElementById('forge-notification');
      if (el) el.remove();
    }, 5000);
  };


  const handleExportMd = async () => {
    const all = await manager.getAll();
    const md = buildMarkdown(all, { 
      appName: deps.appName || 'App', 
      exportedAt: new Date().toISOString(), 
      totalNotes: all.length 
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bug-report-${new Date().getTime()}.md`;
    a.click();
  };

  const handleExportDocx = async () => {
    const all = await manager.getAll();
    const base64 = await buildDocx(all, { 
      appName: deps.appName || 'App', 
      exportedAt: new Date().toISOString(), 
      totalNotes: all.length 
    });
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bug-report-${new Date().getTime()}.docx`;
    a.click();
  };

  return (
    <>
      {mode === 'idle' && (
        <div 
          id="audit-widget-fab"
          onClick={(e) => { 
            e.stopPropagation();
            if (e.detail === 1) handleCapture();
            if (e.detail === 2) handleOpenList();
          }}
          style={{
            position: 'fixed',
            bottom: '110px',
            right: '16px',
            width: '52px',
            height: '52px',
            borderRadius: '26px',
            backgroundColor: '#e53e3e',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 5px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            zIndex: 9999,
            userSelect: 'none',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Tek tık: Ekran Yakala | Çift tık: Raporlar"
        >
          <Bug size={28} />
        </div>
      )}

      {mode === 'selecting' && (
        <AuditSelector
          screenshotUri={capturedUri}
          onConfirm={handleSelectionConfirm}
          onCancel={() => { setMode('idle'); setCapturedUri(''); }}
        />
      )}

      {mode === 'annotating' && (
        <AuditOverlay
          screenshotUri={capturedUri}
          selectedBounds={selectedBounds}
          screenName={deps.currentScreen}
          onSave={handleSaveNote}
          onCancel={() => { setMode('idle'); setCapturedUri(''); }}
        />
      )}

      {mode === 'list' && (
        <AuditNoteList
          notes={notes}
          onExportMd={handleExportMd}
          onExportDocx={handleExportDocx}
          onDelete={async (id) => { await manager.remove(id); loadNotes(); }}
          onClose={() => setMode('idle')}
        />
      )}
    </>
  );
}
