const { cmd } = require('../lib/command');
const { File } = require("megajs");
const path = require('path');

// 🔎 Simple URL checker
function isUrl(str) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$','i'
  );
  return !!pattern.test(str);
}

cmd({
  pattern: "mega",
  desc: "Download original file from Mega.nz",
  react: "📦",
  filename: __filename
}, async (conn, mek, m, {
  from, q, reply
}) => {
  try {
    if (!q || !isUrl(q) || !q.includes("mega.nz")) {
      return reply("❌ Please provide a valid Mega.nz file URL.");
    }

    const [fileUrl, decryptionKey] = q.split('#');
    if (!decryptionKey) {
      return reply("❌ Error: Decryption key is missing in the URL.");
    }

    const megaFile = File.fromURL(fileUrl + '#' + decryptionKey);

    megaFile.on("progress", (downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      reply(`⬇️ Downloading: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)} MB of ${(total / 1024 / 1024).toFixed(2)} MB)`);
    });

    const buffer = await megaFile.downloadBuffer();
    const fileName = megaFile.name || 'downloaded_file';
    const fileExt = path.extname(fileName).toLowerCase();

    // 🧠 Decide based on file type
    if (fileExt === '.mp4') {
      await conn.sendMessage(from, {
        video: buffer,
        mimetype: 'video/mp4',
        fileName: fileName,
        caption: `🎬 *Original MP4 from Mega.nz*\n📁 ${fileName}`,
      }, { quoted: mek });
    } else {
      await conn.sendMessage(from, {
        document: buffer,
        mimetype: 'application/octet-stream',
        fileName: fileName,
        caption: `📁 *Downloaded from Mega.nz*\n✅ Original file preserved: ${fileName}`,
      }, { quoted: mek });
    }

  } catch (error) {
    console.error(error);
    reply("❌ Error: " + error.message);
  }
});
