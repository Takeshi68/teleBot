const fs = require("fs");
const path = require("path");
const pino = require("pino");
const crypto = require("crypto");
const chalk = require("chalk");
const moment = require("moment-timezone");
const {
  useMultiFileAuthState,
  makeWASocket,
  DisconnectReason,
  generateWAMessageFromContent,
  jidDecode,
  makeInMemoryStore,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");
const { connectToWhatsApp, sessions } = require("../system/connect");
const file_session = "./sessions/active.json";
const sessionPath = (id) => `./sessions/${id}`;
const logMessage = require("../utils/logs");
const { Owner_ID } = require("../system/config");

module.exports = async function Cases(ctx) {
  try {
    if (!ctx.message || !ctx.message.text) return;

    const text = ctx.message.text;
    const body = ctx.text || ctx.callbackQuery?.data || "";
    const budy = body;
    const args = body.split(" ");

    const prefixMatch = body.match(
      /^[°zZ#$@+,.?=''():√%¢£¥€π¤ΠΦ&><!™©®Δ^βα¦|/\\©^]/,
    );
    const prefix = prefixMatch ? prefixMatch[0] : ".";
    if (!text.startsWith(prefix)) return;

    const command = args.shift()?.slice(1).toLowerCase();

    const sender = ctx.from?.id || "";
    const pushname = ctx.from?.first_name || ctx.from?.username || "User";
    const isGroup = ctx.chat?.type?.includes("group");
    const groupName = isGroup ? ctx.chat.title : "";
    const from = ctx.chat?.id;
    const botNumber = ctx.botInfo?.id || "";
    const isOwner = [botNumber.toString(), ...Owner_ID]
      .map((v) => v.toString())
      .includes(sender.toString());
    const quoted =
      ctx.update?.message?.message_id || ctx.update?.channel_post?.message_id;

    logMessage({ command: body, pushname, sender, groupName, from });

    switch (command) {
      case "start": {
        const user = ctx.message.from;
        ctx.reply(
          `Hi @${user.username}, I am an assistant from @hiyuux\n\nnote: use the command /menu to display the menu`,
          {
            reply_to_message_id: quoted,
            reply_markup: {
              inline_keyboard: [
                [{ text: "Owner", url: "https://t.me/hiyuux" }],
              ],
            },
          },
        );
        break;
      }

      case "connect": {
        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
          return await ctx.reply("Masukkan nomor WA: `/connect 62xxxx`", {
            parse_mode: "Markdown",
          });
        }

        const BotNumber = args[1];

        if (sessions.has(BotNumber)) {
          return ctx.reply(`Nomor *${BotNumber}* sudah aktif.`, {
            parse_mode: "Markdown",
          });
        }

        await connectToWhatsApp(BotNumber, ctx.chat.id, ctx);
        break;
      }

      case "listsender": {
        if (sessions.size === 0) return ctx.reply("Tidak ada sender aktif.");
        const list = [...sessions.keys()].map((n) => `• ${n}`).join("\n");
        ctx.reply(`*Daftar Sender Aktif:*\n${list}`, {
          parse_mode: "Markdown",
        });
        break;
      }

      case "delsender": {
        const args = ctx.message.text.split(" ");
        if (args.length < 2) return ctx.reply("Contoh: /delsender 62xxxx");

        const number = args[1];
        if (!sessions.has(number)) return ctx.reply("Sender tidak ditemukan.");

        try {
          const sessionDir = sessionPath(number);
          sessions.get(number).end();
          sessions.delete(number);
          fs.rmSync(sessionDir, { recursive: true, force: true });

          const data = JSON.parse(fs.readFileSync(file_session));
          const updated = data.filter((n) => n !== number);
          fs.writeFileSync(file_session, JSON.stringify(updated));

          ctx.reply(`Sender ${number} berhasil dihapus.`);
        } catch (err) {
          console.error(err);
          ctx.reply("Gagal menghapus sender.");
        }
        break;
      }

      case "send": {
        if (!isOwner) {
          return ctx.replyWithMarkdown(
            "Kamu tidak memiliki izin untuk mengakses fitur ini.",
          );
        }

        const args = ctx.message.text.split(" ");
        const targetNumber = args[1]?.replace(/[^0-9]/g, "");
        const message = args.slice(2).join(" ");

        if (!targetNumber || !message) {
          return ctx.reply("Format: /send <nomor_wa> <pesan>");
        }

        if (sessions.size === 0) {
          return ctx.reply(
            "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu.",
          );
        }

        let success = 0;
        let failed = 0;

        for (const [senderNumber, sock] of sessions) {
          try {
            await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
              text: message,
            });
            success++;
          } catch (err) {
            console.error(`Gagal kirim dari ${senderNumber}:`, err.message);
            failed++;
          }
        }

        await ctx.reply(
          `Pesan dikirim ke ${targetNumber} dari:\n✅ ${success} sender berhasil\n❌ ${failed} sender gagal`,
        );
        break;
      }

      default:
        if (budy.startsWith(">")) {
          if (!isOwner) return;

          try {
            let evaled = await eval(budy.slice(1));
            if (typeof evaled !== "string")
              evaled = require("util").inspect(evaled);
            if (evaled.length > 4096) {
              const filePath = path.join(__dirname, "result.txt");
              fs.writeFileSync(filePath, evaled);
              await ctx.replyWithDocument(
                { source: filePath },
                {
                  caption: "result.",
                  reply_to_message_id: quoted,
                },
              );
              fs.unlinkSync(filePath);
            } else {
              await ctx.reply("```\n" + evaled + "\n```", {
                parse_mode: "MarkdownV2",
                reply_to_message_id: quoted,
              });
            }
          } catch (err) {
            ctx.reply(String(err));
          }
        }

        if (budy.startsWith("$")) {
          if (!isOwner) return;
          if (text === "rm -r *") return ctx.reply("😹");

          const { exec } = require("child_process");
          exec(budy.slice(1), async (err, stdout) => {
            if (err) return ctx.reply(`${err}`);
            if (stdout.length > 4096) {
              const filePath = path.join(__dirname, "result.txt");
              fs.writeFileSync(filePath, stdout);

              await ctx.replyWithDocument(
                { source: filePath },
                {
                  caption: "result.",
                  reply_to_message_id: quoted,
                },
              );
              fs.unlinkSync(filePath);
            } else {
              ctx.reply("```\n" + stdout + "\n```", {
                parse_mode: "MarkdownV2",
                reply_to_message_id: quoted,
              });
            }
          });
        }

        break;
    }
  } catch (err) {
    console.log(require("util").format(err));
  }
};

let file = require.resolve(__filename);
require("fs").watchFile(file, () => {
  require("fs").unwatchFile(file);
  console.log("\x1b[0;32m" + __filename + " \x1b[1;32mupdated!\x1b[0m");
  delete require.cache[file];
  require(file);
});
