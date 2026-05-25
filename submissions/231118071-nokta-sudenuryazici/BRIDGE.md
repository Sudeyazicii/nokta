# 🌉 Nokta Forge: BRIDGE (Human-in-the-loop Expert Call)

**Context:** Bu doküman, Otonom Forge Agent 2 cycle üst üste FAIL/ROLLBACK (STUCK durumu) yaşadığında otomatik tetiklenen WebRTC (Jitsi) görüntülü görüşmesinin transkriptini ve sonrasında Agent'a aktarılan prompt bağlamını barındırır. (Track C - Otonomi Gereksinimi)

## 📞 Çağrı Metrikleri
- **Tarih:** 21.05.2026
- **Süre:** 01:24 dk (84 sn)
- **Mod:** Ekran Paylaşımı + Ses + Video
- **Sorun (STUCK):** Avatar 3D modeli (avatar.glb) yüklenemediği için ekran çöküyor. Agent fiziksel olarak var olmayan bir dosyayı referans aldığı için `useGLTF` sonsuz hataya düşüyor.

---

## 🎙️ Transkript (STT Log)

**[00:00] Otonom Agent:** Sistem 2. kez ROLLBACK uyguladı. Hata: `Error: Could not load ../../assets/avatar.glb`. Otonom kurtarma yetersiz. Uzman bağlantısı (WebRTC) başlatılıyor.
**[00:05] *[Jitsi Köprüsü Açılır - Ekran Paylaşımı Başlar]***
**[00:10] Uzman (Geliştirici):** Merhaba, ekranını görüyorum. Hata loguna bakalım.
**[00:15] Otonom Agent:** AvatarScene bileşeni `require('../../assets/avatar.glb')` denediği an çöküyor. Dosya Asset pipeline'a kayıtlı fakat diskte yok.
**[00:22] Uzman:** Anladım. `avatar.glb` dosyasını `avaturn.me`'den henüz indirmemiş olabilirsin veya path yanlış. Şimdilik bu sorunu aşmak için `useGLTF` çağrısını bir `try-catch` bloğu içine almalısın. Eğer dosya yoksa ekranı çökertmek yerine null dönmeli ve konsola uyarı basmalı.
**[00:45] Uzman:** Ayrıca, STUCK tespitini manuel değil, otomatik yapman güzel olmuş ancak `AuditWidget` içindeki `failCount` mantığını fetch hatasında yakalamalısın.
**[01:05] Otonom Agent:** Anlaşıldı. 1. `AvatarModel` içerisine try-catch eklenecek. 2. `AuditWidget`'a state machine (failCount) eklenecek.
**[01:15] Uzman:** Aynen öyle. Onaylıyorum, kodlama döngüsüne geri dönebilirsin. Görüşmeyi sonlandırıyorum.
**[01:24] *[Jitsi Köprüsü Kapanır]***

---

## 🧠 Context Transfer (Next Cycle Input)

> **Agent Prompt Injection:**
> "Önceki STUCK durumundan kurtulmak için Uzman şu yönergeleri verdi: 
> 1. `src/components/AvatarScene.tsx` içindeki `useGLTF` yükleyicisini bir `try-catch` bloğuna sarın. Eğer dosya bulunamazsa uygulama çökmemesi için `null` render edin.
> 2. `src/audit/components/AuditWidget.tsx` içinde fetch API fail olduğunda `failCount` değerini 1 artırın. Eğer `failCount >= 2` ise `showWebRTC(true)` yaparak görüntülü köprüyü otomatik açın.
> 
> Lütfen bu talimatlara göre Cycle #9'u başlatın ve onarımı uygulayın."

**Durum:** Context başarıyla Forge Engine'e aktarıldı. Cycle #9 başlatılıyor...
