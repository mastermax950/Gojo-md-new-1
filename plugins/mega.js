const { cmd } = require('../lib/command');
const { File } = require("megajs");
const path = require('path');

cmd({
  pattern: "chanel",
  desc: "Download real mp4 from Mega.nz",
  react: "🎥",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q || !q.includes("mega.nz")) return reply("📎 *Send a valid Mega.nz file URL*");

    const [fileUrl, decryptionKey] = q.split("#");
    if (!decryptionKey) return reply("🔑 *Missing decryption key*");

    const megaFile = File.fromURL(fileUrl + "#" + decryptionKey);

    megaFile.on("progress", (downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      reply(`⬇️ Downloading: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)}MB)`);
    });

    const buffer = await megaFile.downloadBuffer();
    const fileName = megaFile.name || "file.mp4";
    const ext = path.extname(fileName).toLowerCase();

    // Size check (WhatsApp doc limit: ~100MB)
    const sizeInMB = buffer.length / 1024 / 1024;
    if (sizeInMB > 100) {
      return reply(`❌ File is too large (${sizeInMB.toFixed(2)}MB). WhatsApp max: 100MB.`);
    }

    // 🔥 Caption එකට file name එක දැමීම
    const caption = `🎞️ *${fileName}*

❖ Video Quality : 720p

📥 Video එක Full Download කිරිමෙන් අනතුරුව බලන්න

🚨 වැඩ නැති එකක් උනොත් මේ number එකට message එකක් දාන්න: 0743826406

> *ᴜᴘʟᴏᴀᴅ ʙʏ GOJO MD*`;

    // Send as real video
    if (ext === ".mp4") {
      await conn.sendMessage(from, {
        video: buffer,
        mimetype: 'video/mp4',
        fileName,
        caption
      }, { quoted: mek });
    } else {
      await conn.sendMessage(from, {
        document: buffer,
        mimetype: 'application/octet-stream',
        fileName,
        caption: `📦 *Downloaded from Mega.nz*\n📁 ${fileName}`
      }, { quoted: mek });
    }

  } catch (e) {
    console.error(e);
    reply("❌ Failed to upload to WhatsApp.\n\nReason: " + e.message);
  }
});
