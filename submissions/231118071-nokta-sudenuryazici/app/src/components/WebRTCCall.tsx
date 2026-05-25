import React, { useState } from 'react';
import { AvatarScene } from './AvatarScene';
import { VoiceVisualizer } from './VoiceVisualizer';

export function WebRTCCall({ roomName = "nokta-forge-emergency", onClose }: { roomName?: string, onClose: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // Gerçek zamanlı mikrofon ses seviyesi
  const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false`;

  const handleSpeechEnd = () => {
    // Kullanıcı konuşmayı bitirdiğinde, Avatar cevap versin
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        setIsAvatarTalking(true);
        const msg = new SpeechSynthesisUtterance("Anlıyorum. Sorunu kaydettim. Uzmanımız birazdan bağlanacak, lütfen hattan ayrılmayın.");
        msg.lang = 'tr-TR';
        msg.pitch = 1.1;
        msg.rate = 1.0;
        
        msg.onend = () => {
          setIsAvatarTalking(false);
        };
        
        // Chrome'da onend eventinin tetiklenmeme bug'ına karşı güvenlik önlemi
        setTimeout(() => setIsAvatarTalking(false), 5000);
        
        window.speechSynthesis.speak(msg);
      }, 500); // Yarım saniye bekle ve cevap ver
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#0F172A', zIndex: 99999, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        height: '60px', backgroundColor: '#1E293B', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #334155'
      }}>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>Uzman Bağlantısı (WebRTC - Jitsi) & Otonom Asistan</div>
        <button 
          onClick={onClose}
          style={{ padding: '8px 16px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Bağlantıyı Sonlandır
        </button>
      </div>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sol Taraf: Jitsi iframe */}
        <div style={{ flex: 2, position: 'relative' }}>
          <iframe 
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        {/* Sağ Taraf: Avatar ve Visualizer */}
        <div style={{ 
          flex: 1, backgroundColor: '#0F172A', borderLeft: '1px solid #1E293B',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#60A5FA', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Nova (Sanal Asistan)</h3>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.5' }}>
              "Uzman bağlanana kadar size nasıl yardımcı olabilirim? Hata detaylarını bana anlatabilirsiniz."
            </p>
          </div>
          
          <div style={{ width: '100%', height: '300px', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '24px', overflow: 'hidden', position: 'relative', marginBottom: '40px' }}>
            <AvatarScene isSpeaking={isAvatarTalking} audioVolume={micVolume} />
          </div>

          <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <VoiceVisualizer 
              isListening={isListening} 
              setIsListening={setIsListening} 
              onSpeechEnd={handleSpeechEnd}
              onVolumeChange={setMicVolume}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
