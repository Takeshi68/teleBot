const { Telegraf } = require('telegraf');
const chalk = require('chalk');
const Cases = require('./command/case');
const { Bot_Token, Owner_ID } = require('./system/config'); 

if (!Bot_Token || Bot_Token === '') {
  console.log(chalk.red.bold(`Bot Token Tidak Valid!!`));
  process.exit(1);
}

const bot = new Telegraf(Bot_Token);

(async () => {
  try {
    console.log(chalk.white.bold(`
╭──「 sᴛᴀᴛᴜs 」
┃ ${chalk.cyanBright.bold('LOADING SYSTEM')}
╰─────────────────❍`));

    bot.on('text', Cases);

    console.log(chalk.white.bold(`
╭──「 sᴛᴀᴛᴜs 」
┃ ${chalk.greenBright.bold('BOT ACTIVE !!')}
╰─────────────────❍`));

    await bot.launch({
  dropPendingUpdates: true
});


  } catch (error) {
    console.error(chalk.red.bold('[ ! ] ERROR DETECTED'));
    console.error(error);
    process.exit(1);
  }
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
