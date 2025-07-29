const { cmd } = require('../lib/command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const fetch = require('node-fetch');

cmd({
  pattern: "song",
  react: "🎧",
  desc: "Download YouTube song",
  category: "download",
  use: ".song <YouTube URL or Name>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("🎵 *Please provide a YouTube link or song name.*");

    // Check if input is a YouTube URL
    const isYouTubeURL = q.includes("youtube.com") || q.includes("youtu.be");
    let song;

    if (isYouTubeURL) {
      song = {
        url: q,
        title: "YouTube Audio",
        timestamp: "Unknown",
        author: { name: "Unknown" },
        thumbnail: "https://i.ytimg.com/vi_webp/dQw4w9WgXcQ/maxresdefault.webp"
      };
    } else {
      const yt = await ytsearch(q);
      if (!yt.results || yt.results.length === 0) return reply("❌ *No results found!*");
      song = yt.results[0];
    }

    const { url, thumbnail: thumb } = song;

    const caption = `
🎧 *Title:* ${song.title}
⏱ *Duration:* ${song.timestamp}
👤 *Author:* ${song.author.name}
🔗 *URL:* ${url}

📥 *Choose format to download:*
1. 🎶 Audio (music)
2. 📂 Document (mp3 file)
3. 💫 Voice Note (ptt)

_Reply with the number 1, 2, or 3 to proceed._`;

    const sent = await conn.sendMessage(from, {
      image: { url: thumb },
      caption
    }, { quoted: mek });

    const messageId = sent.key.id;

    const handler = async (msgUpdate) => {
      try {
        const msg = msgUpdate.messages[0];
        if (!msg.message?.extendedTextMessage || msg.key.fromMe) return;

        const repliedTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;
        if (repliedTo !== messageId) return;

        const selected = msg.message.extendedTextMessage.text.trim();

        await conn.sendMessage(from, {
          react: { text: "📥", key: msg.key }
        });

        const res = await fetch(`https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!data?.result?.downloadUrl) return reply("❌ *Failed to get download link.*");

        const dl = data.result.downloadUrl;
        const safeName = song.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".mp3";

        if (selected === "1") {
          await conn.sendMessage(from, {
            audio: { url: dl },
            mimetype: 'audio/mpeg'
          }, { quoted: msg });

        } else if (selected === "2") {
          await conn.sendMessage(from, {
            document: { url: dl },
            mimetype: 'audio/mpeg',
            fileName: safeName
          }, { quoted: msg });

        } else if (selected === "3") {
          await conn.sendMessage(from, {
            audio: { url: dl },
            mimetype: 'audio/mpeg',
            ptt: true
          }, { quoted: msg });

        } else {
          await conn.sendMessage(from, {
            text: "❌ *Invalid option. Please reply with 1, 2, or 3.*"
          }, { quoted: msg });
          return;
        }

        await conn.sendMessage(from, {
          react: { text: "✅", key: msg.key }
        });

        conn.ev.off('messages.upsert', handler);

      } catch (err) {
        console.error("❌ Handler Error:", err);
        reply("⚠️ *Error while processing your request.*");
      }
    };

    conn.ev.on('messages.upsert', handler);
    setTimeout(() => conn.ev.off('messages.upsert', handler), 60000); // auto-remove listener

  } catch (e) {
    console.error("❌ Main Error:", e);
    reply("❌ *An error occurred. Please try again.*");
  }
});
