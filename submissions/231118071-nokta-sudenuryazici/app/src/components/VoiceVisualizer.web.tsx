import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';

export function VoiceVisualizer({ onSpeechStart, onSpeechEnd, isListening, setIsListening, onVolumeChange }) {
  const [recording, setRecording] = useState(false);
  const meter = useRef(new Animated.Value(1)).current;
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const animationFrame = useRef(null);

  useEffect(() => {
    if (isListening && !recording) {
      startRecording();
    } else if (!isListening && recording) {
      stopRecording();
    }
    return () => {
      stopRecording();
    };
  }, [isListening]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      
      analyser.current.fftSize = 256;
      const bufferLength = analyser.current.frequencyBinCount;
      dataArray.current = new Uint8Array(bufferLength);
      
      setRecording(true);
      if (onSpeechStart) onSpeechStart();

      const updateMeter = () => {
        if (!analyser.current) return;
        analyser.current.getByteFrequencyData(dataArray.current);
        let sum = 0;
        for (let i = 0; i < dataArray.current.length; i++) {
          sum += dataArray.current[i];
        }
        const average = sum / dataArray.current.length;
        
        // Ses seviyesini 0.0 - 1.0 arasına normalize et
        const normalizedVolume = Math.min(1.0, average / 100);
        if (onVolumeChange) onVolumeChange(normalizedVolume);
        
        // Map average (0-255) to scale (1-2.5)
        const scaleVal = Math.max(1, 1 + (average / 255) * 1.5);
        Animated.timing(meter, {
          toValue: scaleVal,
          duration: 50,
          useNativeDriver: true
        }).start();

        animationFrame.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

    } catch (err) {
      console.error('Failed to start web audio recording', err);
      if (setIsListening) setIsListening(false);
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    Animated.spring(meter, {
      toValue: 1,
      useNativeDriver: true
    }).start();
    
    if (onVolumeChange) onVolumeChange(0);
    
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    if (onSpeechEnd) onSpeechEnd();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.wave, { transform: [{ scale: meter }], opacity: isListening ? 1 : 0.3 }]} />
      <TouchableOpacity 
        onPress={() => setIsListening && setIsListening(!isListening)}
        style={styles.micButton}
      >
        <Text style={styles.icon}>🎙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#334155'
  },
  wave: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    zIndex: 1,
  },
  icon: {
    fontSize: 24,
    color: '#fff',
  }
});
