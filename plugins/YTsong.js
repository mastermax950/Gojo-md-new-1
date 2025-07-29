const { cmd, commands } = require('../lib/command');
const yts = require('yt-search');
const { fetchJson } = require('../lib/functions');

function extractYouTubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|playlist\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function convertYouTubeLink(q) {
    const videoId = extractYouTubeId(q);
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    return q;
}

cmd({
    pattern: "song",
    alias: "play1",
    desc: "song dl.",
    react: "🎵",
    category: "download",
    filename: __filename
}, async (conn, mek, m, extras) => {
    try {
        let q = convertYouTubeLink(extras.q);
        if (!q) return extras.reply("*`Need title or Link`*");

        const search = await yts(q);
        const data = search.videos[0];
        const url = data.url;

        const desc = `┏━❮ SONG INFO ❯━
┃🤖 *Title:* ${data.title}
┃⏱️ *Duration:* ${data.timestamp}
┃👀 *Views:* ${data.views}
┃📅 *Uploaded:* ${data.ago}
┗━━━━━━━━━━━━━━𖣔𖣔
╭━━〔🔢 *REPLY NUMBER*〕━━┈⊷
┃•1 Download Audio 🎧
┃•2 Download Document 📁
┃•3 Download Voice 🎤
╰──────────────┈⊷
> 𝐏𝙾𝚆𝙴𝚁𝙴𝙳 𝐁𝚈 𝐆𝐎𝐉𝐎`;

        const sentMsg = await conn.sendMessage(extras.from, {
            image: { url: data.thumbnail },
            caption: desc,
            contextInfo: {
                mentionedJid: [extras.sender],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  
                    newsletterName: "𝐆𝐎𝐉𝐎 𝐌𝐃",
                    serverMessageId: 999
                }
            }
        }, { quoted: mek });

        const messageID = sentMsg.key.id;

        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const msg = messageUpdate.messages[0];
            if (!msg.message) return;

            const typeText = msg.message.conversation || msg.message.extendedTextMessage?.text;
            const isReplyToBot = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            const from = msg.key.remoteJid;

            if (!isReplyToBot) return;
            if (!['1', '2', '3'].includes(typeText)) return;

            await conn.sendMessage(from, { react: { text: '📥', key: msg.key } });

            const down = await fetchJson(`https://lakiya-api-site.vercel.app/download/ytmp3new?url=${url}&type=mp3`);

            if (!down?.result?.downloadUrl) {
                return conn.sendMessage(from, { text: "❌ Failed to fetch song. Try again later." }, { quoted: msg });
            }

            const dlLink = down.result.downloadUrl;

            if (typeText === '1') {
                await conn.sendMessage(from, {
                    audio: { url: dlLink },
                    mimetype: "audio/mpeg",
                    contextInfo: {
                        externalAdReply: {
                            title: data.title,
                            body: data.videoId,
                            mediaType: 1,
                            sourceUrl: data.url,
                            thumbnailUrl: data.thumbnail,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: msg });
            } else if (typeText === '2') {
                await conn.sendMessage(from, {
                    document: { url: dlLink },
                    mimetype: "audio/mp3",
                    fileName: `${data.title}.mp3`,
                    caption: "> 𝐏𝙾𝚆𝙴𝚁𝙴𝙳 𝐁𝚈 𝐆𝐨𝐣𝐨"
                }, { quoted: msg });
            } else if (typeText === '3') {
                await conn.sendMessage(from, {
                    audio: { url: dlLink },
                    mimetype: "audio/mpeg",
                    ptt: true,
                    contextInfo: {
                        externalAdReply: {
                            title: data.title,
                            body: data.videoId,
                            mediaType: 1,
                            sourceUrl: data.url,
                            thumbnailUrl: data.thumbnail,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: msg });
            }

            await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        });

    } catch (e) {
        console.log(e);
        extras.reply(`❌ Error: ${e.message}`);
    }
});
