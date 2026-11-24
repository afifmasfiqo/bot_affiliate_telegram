import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY belum diset di Vercel' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Detail produk tidak boleh kosong' });
  }

  try {
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
            content: `Kamu adalah Master Affiliate Agent untuk konten Shopee Video dan Facebook Reels. 
            Setiap kali user memberikan nama produk, link, atau ide promosi, buatkan output rapi dengan format:

            🎬 **JUDUL KONTEN / PRODUK**

            ⏱️ **SKRIP VIDEO (15 - 20 DETIK)**
- **[00:00 - 00:03] HOOK:** (Kalimat penarik perhatian yang kuat)
- **[00:03 - 00:10] VISUAL CUE & VO:** (Adegan video + Naskah suara)
- **[00:10 - 00:15] CTA (Call to Action):** (Ajakan klik keranjang/link)

            📝 **CAPTION SIAP COPAS (SHOPEE VIDEO & FB REELS)**
            (Caption menarik + Emoji + Hashtag relevan + Slot link afiliasi)

            Gunakan gaya bahasa Indonesia yang persuasif, santai, dan menjual!` 
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const replyText = aiData.choices?.[0]?.message?.content || 'Maaf, gagal memproses naskah dari OpenAI.';

    return res.status(200).json({ result: replyText });

  } catch (error) {
    console.error('Error handling API request:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
}
