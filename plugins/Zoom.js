const { cmd } = require('../lib/command');
const axios = require("axios");
const fs = require("fs");
const path = require("path");

cmd({
  pattern: "zoomdl",
  desc: "Download Zoom Recording (public link only).",
  react: "📹",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q.includes("zoom.us/rec/share")) {
      return reply("📎 *Please provide a valid Zoom recording link.*");
    }

    // Zoom recording link modify -> raw download link
    let dlUrl = q.replace("/rec/share/", "/rec/download/");

    reply("⬇️ Downloading Zoom recording...");

    const res = await axios.get(dlUrl, { responseType: "arraybuffer" });

    let fileName = `zoom_${Date.now()}.mp4`;
    let filePath = path.join(__dirname, "..", "temp", fileName);

    fs.writeFileSync(filePath, res.data);

    await conn.sendMessage(from, { 
      document: fs.readFileSync(filePath), 
      mimetype: "video/mp4", 
      fileName 
    }, { quoted: mek });

    fs.unlinkSync(filePath);

  } catch (err) {
    console.error(err);
    reply("❌ Could not download Zoom recording. Maybe it requires a password/login.");
  }
});
