const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const pino = require("pino");

const sessions = new Map();
const file_session = "./sessions/active.json";
const sessionPath = (id) => `./sessions/${id}`;

if (!fs.existsSync("./sessions")) fs.mkdirSync("./sessions");

const saveActive = (number) => {
  let list = fs.existsSync(file_session) ? JSON.parse(fs.readFileSync(file_session)) : [];
  if (!list.includes(number)) {
    list.push(number);
    fs.writeFileSync(file_session, JSON.stringify(list));
  }
};

const initializeWhatsAppConnections = async () => {
  if (!fs.existsSync(file_session)) return;

  const activeNumbers = JSON.parse(fs.readFileSync(file_session));
  console.log(`Memuat ${activeNumbers.length} sesi WhatsApp aktif...`);

  for (const BotNumber of activeNumbers) {
    await connectToWhatsApp(BotNumber);
  }
};

const connectToWhatsApp = async (BotNumber, chatId, ctx) => {
  const sessionDir = sessionPath(BotNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  let statusMessage;
  const editStatus = async (text) => {
    if (chatId && ctx && statusMessage?.message_id) {
      try {
        await ctx.telegram.editMessageText(chatId, statusMessage.message_id, null, text, { parse_mode: "Markdown" });
      } catch (e) {
        console.error("Gagal edit status:", e.message);
      }
    }
  };

  if (ctx && chatId) {
    statusMessage = await ctx.reply(`⏳ Memulai pairing ke nomor ${BotNumber}...`, { parse_mode: "Markdown" });
  }

  let codeRequested = false;

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      sessions.set(BotNumber, sock);
      saveActive(BotNumber);

      await editStatus(`*Status Pairing*\nNomor: \`${BotNumber}\`\nStatus: ✅ Terhubung`);
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;

      if (code === DisconnectReason.loggedOut) {
        await editStatus(`*Status Pairing*\nNomor: \`${BotNumber}\`\nStatus: ❌ Logout. Silakan pairing ulang.`);
        sessions.delete(BotNumber);
        fs.rmSync(sessionDir, { recursive: true, force: true });

        if (fs.existsSync(file_session)) {
          const data = JSON.parse(fs.readFileSync(file_session));
          const updated = data.filter(n => n !== BotNumber);
          fs.writeFileSync(file_session, JSON.stringify(updated));
        }
        return;
      }

      if (code >= 400) {
        await editStatus(`*Status Pairing*\nNomor: \`${BotNumber}\`\nStatus: 🔁 Menghubungkan ulang...`);
        setTimeout(() => connectToWhatsApp(BotNumber, chatId, ctx), 3000);
        return;
      }
    }

    if (connection === "connecting" && !fs.existsSync(`${sessionDir}/creds.json`) && !codeRequested) {
      codeRequested = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const code = await sock.requestPairingCode(BotNumber, 'HYUUXXXX');
        await editStatus(`*Kode Pairing*\nNomor: \`${BotNumber}\`\nKode: \`${code}\``);
      } catch (err) {
        console.error("Gagal request pairing code:", err.message);
        await editStatus(`*Status Pairing*\nNomor: \`${BotNumber}\`\nStatus: ❗ ${err.message}`);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
};

initializeWhatsAppConnections();

module.exports = {
  connectToWhatsApp,
  sessions
};