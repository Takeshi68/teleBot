const chalk = require('chalk');

function logMessage({ command = '-', ctx = null, pushname = '', sender = '', groupName = '', from = '' }) {
  const isGroup = ctx?.chat?.type?.endsWith('group') || from.toString().startsWith("-100");

  const name = ctx?.from?.first_name || ctx?.from?.username || pushname || 'User';
  const id = ctx?.from?.id || sender || 'unknown';
  const group = ctx?.chat?.title || groupName || '-';
  const groupId = ctx?.chat?.id || from || '-';

  console.log('\x1b[30m--------------------\x1b[0m');
  console.log(chalk.bgHex("#4a69bd").bold(`▢ Plugin Triggered`));
  console.log(
    chalk.bgHex("#ffffff").black(
      `   ⌬ Tanggal: ${new Date().toLocaleString()} \n` +
      `   ⌬ Command: ${command} \n` +
      `   ⌬ Pengirim: ${name} \n` +
      `   ⌬ ID: ${id}`
    )
  );

  if (isGroup) {
    console.log(
      chalk.bgHex("#ffffff").black(
        `   ⌬ Grup: ${group} \n` +
        `   ⌬ GroupID: ${groupId}`
      )
    );
  }
}

module.exports = logMessage;

