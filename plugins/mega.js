const { cmd } = require('../lib/command');
const { File } = require("megajs");
const path = require('path');

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
  desc: "Download original video from Mega.nz",
  react: "🎥",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q || !isUrl(q) || !q.includes("mega.nz")) {
      return reply("🔗 Please provide a valid Mega.nz URL");
    }

    const [fileUrl, decryptionKey] = q.split('#');
    if (!decryptionKey) {
      return reply("🔑 Decryption key is missing.");
    }

    const megaFile = File.fromURL(fileUrl + '#' + decryptionKey);

    megaFile.on("progress", (downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      reply(`⬇️ Downloading: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)} MB)`);
    });

    const buffer = await megaFile.downloadBuffer();
    const fileName = megaFile.name || 'file.mp4';
    const ext = path.extname(fileName).toLowerCase();

    if (ext === ".mp4") {
      await conn.sendMessage(from, {
        video: buffer,
        mimetype: 'video/mp4',
        fileName: fileName,
        caption: `🎬 *Video from Mega.nz*\n📁 ${fileName}`,
      }, { quoted: mek });
    } else {
      await conn.sendMessage(from, {
        document: buffer,
        mimetype: 'application/octet-stream',
        fileName: fileName,
        caption: `📁 *File from Mega.nz*\nName: ${fileName}`,
      }, { quoted: mek });
    }

  } catch (err) {
    console.error(err);
    reply("❌ Error: " + err.message);
  }
});
