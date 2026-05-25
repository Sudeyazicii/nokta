import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';

function AvatarModel({ isSpeaking, audioVolume }) {
  let gltf;
  try {
    gltf = useGLTF('/avatar.glb');
  } catch(e1) {
    try {
      gltf = useGLTF('/model.glb');
    } catch (e2) {
      console.warn("Ne avatar.glb ne de model.glb bulunamadı! Lütfen dosyayı public/ klasörüne ekleyin.");
      return null;
    }
  }
  
  const { scene } = gltf;
  const avatarMeshesRef = useRef([]);

  useEffect(() => {
    // Find ALL meshes with morphTargets (Head, Teeth, Beard, etc.)
    const meshes = [];
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        meshes.push(child);
      }
      
      // Kemikleri aşağı indirme (T-pose'u iptal etme)
      // Önceki denemede kollar yukarı kalkmıştı, demek ki z ekseni ters yönlü çalışıyor.
      if (child.isBone) {
        const boneName = child.name.toLowerCase();
        if (boneName.includes('leftarm') || boneName.includes('left_arm')) {
          child.rotation.z = 1.2; // Sol kolu AŞAĞI indir (pozitif)
        }
        if (boneName.includes('rightarm') || boneName.includes('right_arm')) {
          child.rotation.z = -1.2; // Sağ kolu AŞAĞI indir (negatif)
        }
      }
    });
    avatarMeshesRef.current = meshes;
  }, [scene]);

  useFrame((state, delta) => {
    if (avatarMeshesRef.current.length > 0) {
      // Eğer avatar kendi konuşuyorsa dalga simülasyonu (TTS), 
      // eğer siz konuşuyorsanız gerçek mikrofon ses yüksekliği (audioVolume) kullanılsın!
      let targetValue = 0;
      if (isSpeaking) {
        // Avatar TTS ile konuşurken
        targetValue = Math.sin(state.clock.elapsedTime * 20) * 0.6 + 0.4;
      } else if (audioVolume > 0.05) {
        // Kullanıcı mikrofona konuşurken (ses düzeyine göre ağız açılır, 0.05 noise gate)
        targetValue = Math.min(1.0, audioVolume * 2.5); // Sesi biraz güçlendir
      }
      
      avatarMeshesRef.current.forEach((mesh) => {
        const dict = mesh.morphTargetDictionary;
        if (!dict) return;
        
        // Viseme indices mapping (avaturn/RPM standard)
        const targetMouth = dict['jawOpen'] ?? dict['mouthOpen'] ?? dict['viseme_O'] ?? dict['O'] ?? dict['MouthOpen'];
        
        if (targetMouth !== undefined) {
          // Lerp for smooth transition
          mesh.morphTargetInfluences[targetMouth] += 
            (targetValue - mesh.morphTargetInfluences[targetMouth]) * delta * 15;
        }
      });
    }
  });

  return <primitive object={scene} position={[0, -1.5, 0]} scale={[1.5, 1.5, 1.5]} />;
}

export function AvatarScene({ isSpeaking, audioVolume = 0 }) {
  return (
    <View style={styles.container}>
      {/* Sadece yüzün görünmesi için kamerayı iyice yaklaştırıp FOV'u daralttık */}
      <Canvas camera={{ position: [0, 0.95, 0.7], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <Environment preset="city" />
        <AvatarModel isSpeaking={isSpeaking} audioVolume={audioVolume} />
        <OrbitControls enableZoom={false} enablePan={false} target={[0, 0.95, 0]} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    backgroundColor: 'transparent'
  }
});
