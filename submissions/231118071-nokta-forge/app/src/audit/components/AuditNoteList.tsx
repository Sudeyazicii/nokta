import React from 'react';
import { X, Trash2, FileText, Download } from 'lucide-react';
import { AuditNote } from '../core/types';

interface Props {
  notes: AuditNote[];
  onExportMd: () => void;
  onExportDocx: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function AuditNoteList({ notes, onExportMd, onExportDocx, onDelete, onClose }: Props) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 10002,
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #e5e7eb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Hata Raporları ({notes.length})</h2>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        alignContent: 'start',
      }}>
        {notes.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '60px 0',
            color: '#9ca3af'
          }}>
            <span style={{ fontSize: '48px' }}>🐛</span>
            <p style={{ marginTop: '16px', fontSize: '16px' }}>Henüz kaydedilmiş bir hata yok.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <div style={{
                height: '180px',
                backgroundImage: `url(${note.screenshot})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: note.status === 'fixed' ? '#22c55e' : '#ef4444',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}>
                  {note.status === 'fixed' ? 'Düzeltildi' : 'Açık'}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                }}>
                  {note.screenName}
                </div>
              </div>
              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', flex: 1 }}>{note.note}</p>
                <div style={{ 
                  marginTop: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <span>{new Date(note.timestamp).toLocaleDateString('tr-TR')}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {note.status === 'open' && (
                      <button 
                        onClick={() => (window as any).FORGE_EXECUTE?.(note)}
                        title="Forge Otonom Onarımı Başlat"
                        style={{
                          background: '#e53e3e',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ⚡ ONAR
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(note.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ 
        padding: '20px', 
        borderTop: '1px solid #e5e7eb', 
        backgroundColor: '#f9fafb',
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
      }}>
        <button
          disabled={notes.length === 0}
          onClick={onExportMd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: notes.length === 0 ? '#9ca3af' : '#374151',
            color: 'white',
            fontWeight: 600,
            cursor: notes.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <FileText size={18} />
          Markdown Raporu
        </button>
        <button
          disabled={notes.length === 0}
          onClick={onExportDocx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: notes.length === 0 ? '#9ca3af' : '#2563eb',
            color: 'white',
            fontWeight: 600,
            cursor: notes.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <Download size={18} />
          Word Raporu
        </button>
      </div>
    </div>
  );
}
