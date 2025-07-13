# 🤖 SimpleBot - Telegram × WhatsApp

**SimpleBot** adalah bot sederhana yang memungkinkan pengguna mengirim pesan ke WhatsApp langsung melalui Telegram. Dirancang agar multi-session — mendukung banyak pengguna bot yang dapat berkomunikasi ke WhatsApp masing-masing.

---

## ✨ Fitur Utama

- 🌐 Kirim pesan WhatsApp dari Telegram
- 👥 Mendukung multi-session (banyak user bot yang terdaftar)
- 📡 Terhubung ke WhatsApp dan Telegram sekaligus
- 🔐 Sistem permission: `owner` dan `token`
- ⚙️ Konfigurasi bot Telegram menggunakan file `system/config.js`

---

## 🛞 System

- **Bahasa:** Node.js
- **Telegram API:** [Telegraf](https://telegraf.js.org)
- **WhatsApp API:** Custom (menggunakan `baileys`)
- **Database:** JSON

---

## ⚙️ Requirements

- Node.js versi `>=18`
- NPM atau yarn

---

## 🚀 Cara Menjalankan

```bash
git clone https://github.com/Takeshi68/teleBot.git
cd telebot
npm install
node index.js
