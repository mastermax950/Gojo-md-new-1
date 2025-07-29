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
    if (!q) return reply("🎵 Please provide a YouTube link or song name.");

    const yt = await ytsearch(q);
    if (!yt.results || yt.results.length === 0) return reply("❌ No results found!");

    const song = yt.results[0];
    const url = song.url;
    const thumb = song.thumbnail;

    const caption = `
🎧 *Title:* ${song.title}
⏱ *Duration:* ${song.timestamp}
👤 *Author:* ${song.author.name}
🔗 *URL:* ${url}

*  Gojo Select download format:*
1. 🎶 Audio
2. 📂 Document
3. 💫 Voice Note

_Reply with the number to download._`;

    const sent = await conn.sendMessage(from, {
      image: { url: thumb },
      caption,
    }, { quoted: mek });

    const messageId = sent.key.id;

    const handler = async (msgUpdate) => {
      try {
        const msg = msgUpdate.messages[0];
        if (!msg.message?.extendedTextMessage) return;
        if (msg.key.fromMe) return;

        const repliedTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;
        if (repliedTo !== messageId) return;

        const selected = msg.message.extendedTextMessage.text.trim();

        // Send react 📥 to show download started
        await conn.sendMessage(from, {
          react: { text: "📥", key: msg.key }
        });

        const res = await fetch(`https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        const dl = data.result.downloadUrl;

        if (selected === "1") {
          await conn.sendMessage(from, {
            audio: { url: dl },
            mimetype: 'audio/mpeg'
          }, { quoted: msg });

          // Download complete react ✅
          await conn.sendMessage(from, {
            react: { text: "✅", key: msg.key }
          });

        } else if (selected === "2") {
          await conn.sendMessage(from, {
            document: { url: dl },
            mimetype: 'audio/mpeg',
            fileName: `${song.title}.mp3`
          }, { quoted: msg });

          await conn.sendMessage(from, {
            react: { text: "✅", key: msg.key }
          });

        } else if (selected === "3") {
          await conn.sendMessage(from, {
            audio: { url: dl },
            mimetype: 'audio/mpeg',
            ptt: true
          }, { quoted: msg });

          await conn.sendMessage(from, {
            react: { text: "✅", key: msg.key }
          });

        } else {
          await conn.sendMessage(from, {
            text: "❌ Invalid option. Please reply with 1, 2, or 3."
          }, { quoted: msg });
          return;
        }

        // Remove listener after one valid reply
        conn.ev.off('messages.upsert', handler);

      } catch (err) {
        console.error("❌ Song reply handler error:", err);
      }
    };

    conn.ev.on('messages.upsert', handler);

  } catch (e) {
    console.error(e);
    reply("❌ Error occurred. Try again.");
  }
});
