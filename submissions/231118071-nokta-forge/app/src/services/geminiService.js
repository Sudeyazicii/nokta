const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY?.trim();
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY?.trim();
const ENV_MODEL = import.meta.env.VITE_GEMINI_MODEL?.trim() || "gemini-1.5-flash";

async function tryPollinationsAI(metadataPrompt, userRequest, styleModifier) {
  console.log(`🌌 [AI Engine] Pollinations AI deneniyor... (${styleModifier})`);
  const SYSTEM_PROMPT = `Generate a premium dashboard JSON. JSON ONLY. Schema: {"title":"string","subtitle":"string","widgets":[{"type":"dynamic_canvas","title":"string","gridPosition":{"colSpan":4,"rowSpan":1,"order":1},"config":{"htmlTemplate":"string"}}]} `;
  const fullPrompt = `${SYSTEM_PROMPT}\n\nREQUEST: ${userRequest}\n\nSTYLE: ${styleModifier}\n\nMETADATA:\n${metadataPrompt}`;
  
  const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?json=true`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pollinations failed: ${response.status}`);
  const text = await response.text();
  const jsonMatch = text?.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSON formatı bulunamadı");
  return jsonMatch[0];
}

async function tryGemini(metadataPrompt, userRequest, styleModifier, modelName) {
  if (!GEMINI_API_KEY) throw new Error("Key eksik");
  console.log(`🚀 [AI Engine] Gemini ${modelName} deneniyor...`);
  const SYSTEM_PROMPT = `Generate a premium dashboard JSON. JSON ONLY.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nREQUEST: ${userRequest}\n\nMETADATA:\n${metadataPrompt}` }] }],
      generationConfig: { temperature: 0.1 }
    })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function tryGroq(metadataPrompt, userRequest, styleModifier) {
  if (!GROQ_API_KEY) throw new Error("Key eksik");
  console.log(`⚡ [AI Engine] Groq deneniyor...`);
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: "JSON ONLY." }, { role: "user", content: `REQUEST: ${userRequest}\nMETADATA: ${metadataPrompt}` }],
      temperature: 0.1
    })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

async function tryOpenAI(metadataPrompt, userRequest, styleModifier) {
  if (!OPENAI_API_KEY) throw new Error("Key eksik");
  console.log(`🧠 [AI Engine] OpenAI deneniyor...`);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "JSON ONLY." }, { role: "user", content: `REQUEST: ${userRequest}\nMETADATA: ${metadataPrompt}` }],
      temperature: 0.1
    })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

export async function generateDashboardConfig(metadataPrompt, userRequest, styleModifier = "") {
  const geminiArmy = [
    ENV_MODEL,
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp"
  ];

  const providers = [
    ...geminiArmy.map(m => ({ name: `Gemini ${m}`, fn: () => tryGemini(metadataPrompt, userRequest, styleModifier, m) })),
    { name: "Groq", fn: () => tryGroq(metadataPrompt, userRequest, styleModifier) },
    { name: "OpenAI", fn: () => tryOpenAI(metadataPrompt, userRequest, styleModifier) },
    { name: "Pollinations", fn: () => tryPollinationsAI(metadataPrompt, userRequest, styleModifier) }
  ];

  for (const provider of providers) {
    try {
      const text = await provider.fn();
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log(`✅ [AI Engine] ${provider.name} başarılı!`);
        return JSON.parse(jsonMatch[0].trim());
      }
    } catch (e) {
      console.warn(`⚠️ [AI Engine] ${provider.name} elendi: ${e.message}`);
    }
  }
  
  throw new Error("Tüm modeller denendi ancak sonuç alınamadı.");
}

export async function generateMultipleDashboardConfigs(metadata, userRequest) {
  const styles = [
    "EXECUTIVE OVERVIEW: High-level KPIs.",
    "DETAILED PERFORMANCE: Data grids and charts.",
    "VISUAL & TRENDY: Futuristic design, gradients.",
    "ACTION ORIENTED: Progress bars and alerts."
  ];
  
  const metadataPrompt = JSON.stringify(metadata);
  
  console.log("🎨 [AI Engine] 4 farklı perspektif paralel olarak üretiliyor...");
  
  // Her stil için paralel istek başlat, her istek kendi içinde modelleri tek tek dener
  const promises = styles.map(style => generateDashboardConfig(metadataPrompt, userRequest, style));
  const results = await Promise.allSettled(promises);
  
  const configs = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
  
  if (configs.length === 0) {
     throw new Error("Üzgünüm, şu an tüm AI servisleri meşgul. Lütfen 5 saniye sonra tekrar deneyin.");
  }
  
  return configs;
}
