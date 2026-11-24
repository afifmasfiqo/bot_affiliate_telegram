module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Bot Afiliasi Serverless Active!');
  }

  const { message } = req.body;
  if (!message || !message.text) {
    return res.status(200).send('OK');
  }

  const chatId = message.chat.id;
  const userText = message.text;

  try {
    // Panggil OpenAI API (gpt-4o-mini)
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
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
          { role: 'user', content: userText }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const replyText = aiData.choices[0]?.message?.content || 'Maaf, gagal memproses naskah dari OpenAI.';

    // Kirim balasan ke Telegram bot (@Afif_OpenClaw_bot)
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown'
      })
    });

  } catch (error) {
    console.error('Error handling Telegram request:', error);
  }

  return res.status(200).send('OK');
