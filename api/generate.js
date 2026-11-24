import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, affiliateLink } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY belum diset di Vercel' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Detail produk tidak boleh kosong' });
  }

  const userLink = affiliateLink || 'https://s.shopee.co.id/AKcHInhVra';

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
            Buatkan paket promosi lengkap dan siap pakai sesuai input user:

🎯 **HOOK (3 DETIK PERTAMA)**
(Kalimat penarik perhatian yang kuat)

⏱️ **SKRIP VIDEO & ADEGAN (15-20 DETIK)**
- [00:00 - 00:03] HOOK: (Naskah suara + Adegan visual)
- [00:03 - 00:12] PROBLEM & SOLUTION: (Keunggulan produk + Adegan visual)
- [00:12 - 00:20] CALL TO ACTION: (Ajakan beli)

📝 **CAPTION SIAP COPAS**
(Teks deskripsi penjualan yang menarik + Emoji)

🏷️ **TAGAR RELEVAN**
(#Hashtag1 #Hashtag2 #Hashtag3)

📌 **INSTRUKSI PENEMPATAN LINK AFILIASI**
- Shopee Video: Pasang link di **Keranjang Kuning** (${userLink})
- FB Reels / TikTok: Sematkan link di **Kolom Komentar Teratas (Pinned Comment)** (${userLink})` 
          },
          { role: 'user', content: `Produk: ${prompt}\nLink Afiliasi: ${userLink}` }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const replyText = aiData.choices?.[0]?.message?.content || 'Gagal memproses naskah dari OpenAI.';

    return res.status(200).json({ result: replyText });

  } catch (error) {
    console.error('Error handling API request:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server Vercel.' });
  }
}
