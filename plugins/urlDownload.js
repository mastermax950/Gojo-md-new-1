const { cmd } = require('../lib/command');
const axios = require("axios");

cmd({
    pattern: "download",
    alias: ["downurl"],
    use: '.download <url>',
    react: "🔰",
    desc: "Download file from direct link.",
    category: "search",
    filename: __filename
},

async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("❗ කරුණාකර download link එකක් ලබා දෙන්න."); 

    const link = q.trim();
    const urlPattern = /^(https?:\/\/[^\s]+)/;

    if (!urlPattern.test(link)) {
      return reply("❗ දීලා තියෙන URL එක වැරදි. කරුණාකර link එක හොඳින් බලන්න.");
    }

    // HEAD request to detect filename
    let fileName = "Gojo-md.mp4";
    try {
      const response = await axios.head(link);
      const disposition = response.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        fileName = disposition
          .split("filename=")[1]
          .replace(/['"]/g, "")
          .trim();
      } else {
        // fallback if no content-disposition header
        const urlParts = link.split("/");
        fileName = decodeURIComponent(urlParts[urlParts.length - 1]);
      }
    } catch (err) {
      console.log("Filename fetch error:", err.message);
      // fallback
      const urlParts = link.split("/");
      fileName = decodeURIComponent(urlParts[urlParts.length - 1]);
    }

    let info = `*© ᴄʀᴇᴀᴛᴇᴅ ʙʏ ꜱayura mihiranga  · · ·*`;

    await conn.sendMessage(from, {
      document: { url: link },
      mimetype: "video/mp4",
      fileName: fileName,
      caption: info
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply(`${e}`);
  }
});
