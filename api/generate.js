import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, affiliateLink } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN; // Opsional untuk AI Video

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY belum diset di Vercel' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Detail produk tidak boleh kosong' });
  }

  const userLink = affiliateLink || 'https://s.shopee.co.id/AKcHInhVra';

  try {
    // 1. Generate Teks Naskah, Hook, Deskripsi & Tagar via OpenAI (gpt-4o-mini)
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Kamu adalah Master Affiliate Agent untuk Shopee Video dan Facebook Reels.
            Buatkan paket postingan video promosi yang lengkap dan langsung siap posting dengan format berikut:

🎯 **HOOK (3 DETIK PERTAMA)**
(Kalimat penarik perhatian yang sangat kuat & memicu rasa penasaran)

⏱️ **SKRIP VIDEO & ADEGAN (15-20 DETIK)**
- [00:00 - 00:03] HOOK: ...
- [00:03 - 00:12] VISUAL & NARASI: ...
- [00:12 - 00:20] CALL TO ACTION: ...

📝 **DESKRIPSI / CAPTION VIDEO**
(Teks promosi singkat, menarik, dan menjual)

🏷️ **TAGAR / HASHTAG RELEVAN**
(#HashtagUtama #HashtagTrending #HashtagAfiliasi)

📌 **PETUNJUK PENEMPATAN LINK AFILIASI**
- Shopee Video: Sematkan link di **Keranjang Kuning** (${userLink})
- FB Reels / TikTok: Cantumkan link di **Kolom Komentar Teratas (Pinned Comment)** atau **Bio Profile** (${userLink})

🎨 **PROMPT PROMOSI VISUAL (UNTUK GENERATOR VIDEO AI)**
(Deskripsi singkat 1 kalimat dalam bahasa Inggris tentang adegan produk untuk di-render oleh AI Video Generator)` 
          },
          { role: 'user', content: `Produk: ${prompt}\nLink Afiliasi: ${userLink}` }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const replyText = aiData.choices?.[0]?.message?.content || 'Gagal membuat teks promo.';

    // Extract Prompt Visual untuk Video AI
    let videoPrompt = "A high quality promotional product video shot, cinematic lighting, 4k resolution";
    const visualMatch = replyText.match(/🎨 \*\*PROMPT PROMOSI VISUAL\*\*\n([\s\S]*?)(?=\n\n|$)/);
    if (visualMatch && visualMatch[1]) {
      videoPrompt = visualMatch[1].trim();
    }

    let videoUrl = null;

    // 2. Generate Video AI via Replicate API (Jika REPLICATE_API_TOKEN diset)
    if (replicateToken) {
      try {
        const videoRes = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: "7b3de6270b284ec6d628d022b70f4439c2c6383b4b5749372d62d057a6e19196", // Wan 2.1 / Stable Video Model
            input: { prompt: videoPrompt }
          })
        });
        const videoData = await videoRes.json();
        
        // Polling status video sampai selesai
        if (videoData.urls && videoData.urls.get) {
          let statusUrl = videoData.urls.get;
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 3000)); // Tunggu 3 detik per cek
            const checkRes = await fetch(statusUrl, {
              headers: { 'Authorization': `Token ${replicateToken}` }
            });
            const checkData = await checkRes.json();
            if (checkData.status === 'succeeded') {
              videoUrl = Array.isArray(checkData.output) ? checkData.output[0] : checkData.output;
              break;
            } else if (checkData.status === 'failed') {
              break;
            }
          }
        }
      } catch (vErr) {
        console.error('Video Gen Error:', vErr);
      }
    }

    return res.status(200).json({ 
      result: replyText,
      videoUrl: videoUrl,
      videoPrompt: videoPrompt
    });

  } catch (error) {
    console.error('Error handling API request:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
}
