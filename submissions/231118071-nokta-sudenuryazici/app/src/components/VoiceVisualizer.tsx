import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Audio } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

export function VoiceVisualizer({ onSpeechStart, onSpeechEnd, isListening, setIsListening }) {
  const [recording, setRecording] = useState(null);
  const meter = useSharedValue(-160);

  useEffect(() => {
    if (isListening && !recording) {
      startRecording();
    } else if (!isListening && recording) {
      stopRecording();
    }
    return () => {
      if (recording) stopRecording();
    };
  }, [isListening]);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.metering !== undefined) {
            // Normalize -160 to 0 into a positive scale for scale transform
            // -160 is silence, 0 is loudest.
            // Map -160..0 to 1..3
            let val = Math.max(1, 1 + ((status.metering + 160) / 160) * 1.5);
            meter.value = withTiming(val, { duration: 50 });
          }
        },
        50 // update interval in ms for <200ms latency
      );
      setRecording(newRecording);
      if (onSpeechStart) onSpeechStart();
    } catch (err) {
      console.error('Failed to start recording', err);
      if (setIsListening) setIsListening(false);
    }
  }

  async function stopRecording() {
    meter.value = withSpring(1);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch(e) {}
      setRecording(null);
    }
    if (onSpeechEnd) onSpeechEnd();
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: meter.value }],
      opacity: isListening ? 1 : 0.3,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.wave, animatedStyle]} />
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
