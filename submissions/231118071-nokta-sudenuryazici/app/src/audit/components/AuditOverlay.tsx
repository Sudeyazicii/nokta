import React, { useState, useEffect, useRef } from 'react';
import { AuditNoteBounds } from '../core/types';
import { Mic, MicOff } from 'lucide-react';

const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

interface Props {
  screenshotUri: string;
  selectedBounds: AuditNoteBounds | null;
  screenName: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}

export function AuditOverlay({ screenshotUri, selectedBounds, screenName, onSave, onCancel }: Props) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setNote((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    await onSave(note.trim());
    setSaving(false);
  };

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const PREVIEW_MAX_W = Math.min(screenW - 48, 350);
  const naturalH = PREVIEW_MAX_W * (screenH / screenW);
  const renderedW = naturalH > 160 ? Math.round(160 * (screenW / screenH)) : PREVIEW_MAX_W;
  const renderedH = Math.min(naturalH, 160);
  const scaleX = renderedW / screenW;
  const scaleY = renderedH / screenH;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 10001, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end', fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
        padding: '24px', paddingBottom: '40px', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: '40px', height: '4px', backgroundColor: '#ddd', borderRadius: '2px', alignSelf: 'center', marginBottom: '16px' }} />
        <h2 style={{ margin: 0, color: '#111', fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>Bug Raporu</h2>
        <div style={{ color: '#999', fontSize: '12px', marginBottom: '12px' }}>
          Ekran: <span style={{ color: '#555', fontWeight: 500 }}>{screenName}</span>
        </div>

        {screenshotUri && (
          <div style={{
            borderRadius: '8px', overflow: 'hidden', marginBottom: '12px',
            border: '1px solid #e5e5e5', width: renderedW, height: renderedH, position: 'relative',
          }}>
            <img src={screenshotUri} style={{ width: '100%', height: '100%', objectFit: 'fill' }} alt="" />
            {selectedBounds && (
              <div style={{
                position: 'absolute', border: '2px solid #e53e3e', backgroundColor: 'rgba(229,62,62,0.1)',
                left: selectedBounds.x * scaleX, top: selectedBounds.y * scaleY,
                width: selectedBounds.width * scaleX, height: selectedBounds.height * scaleY, pointerEvents: 'none',
              }} />
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ color: '#444', fontSize: '13px', fontWeight: 600 }}>Sorunu açıklayın</div>
          {SpeechRecognition && (
             <button 
                onClick={toggleListening}
                style={{
                  background: 'none', border: 'none', color: isListening ? '#e53e3e' : '#666',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600
                }}
             >
               {isListening ? <Mic size={16} /> : <MicOff size={16} />}
               {isListening ? 'Dinleniyor...' : 'Dikte Et'}
             </button>
          )}
        </div>
        <textarea
          autoFocus
          placeholder="Ne yanlış gözüküyor? Sesli dikte etmek için mikrofona dokunun."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            backgroundColor: '#f7f7f7', borderRadius: '10px', padding: '12px', color: '#111',
            fontSize: '14px', minHeight: '80px', border: '1px solid #e5e5e5', resize: 'none', outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              flex: 1, padding: '13px 0', borderRadius: '12px', backgroundColor: '#f0f0f0',
              color: '#666', fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !note.trim()}
            style={{
              flex: 2, padding: '13px 0', borderRadius: '12px', backgroundColor: note.trim() ? '#e53e3e' : '#fca5a5',
              color: 'white', fontWeight: 700, border: 'none', cursor: note.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
