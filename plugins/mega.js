const { cmd, commands } = require('../lib/command');
const { File } = require("megajs");

// ✅ Add isUrl() manually
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
  desc: "Download files from Mega.nz",
  react: "🎀",
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
      return reply("❌ Error: Decryption key is missing in the provided URL.");
    }

    const megaFile = File.fromURL(fileUrl + '#' + decryptionKey);

    megaFile.on("progress", (downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      reply(`⬇️ Downloading: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)} MB of ${(total / 1024 / 1024).toFixed(2)} MB)`);
    });

    const fileBuffer = await megaFile.downloadBuffer();

    await conn.sendMessage(from, {
      document: fileBuffer,
      mimetype: 'application/octet-stream',
      fileName: megaFile.name || "mega_downloaded_file",
      caption: `✅ *Downloaded from Mega.nz:*\n📁 *${megaFile.name}*`,
      contextInfo: {
        externalAdReply: {
          title: "GOJO-MD",
          body: "ꜱayura mihiranga",
          mediaType: 1,
          sourceUrl: "https://www.github.com",
          thumbnailUrl: "https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png",
          renderLargerThumbnail: false,
          showAdAttribution: true
        }
      }
    }, { quoted: mek });

  } catch (error) {
    console.error(error);
    reply("❌ Error: " + error.message);
  }
});
