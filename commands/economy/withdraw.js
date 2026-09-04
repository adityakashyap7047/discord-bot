const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function getEconomy(client, guildId, userId) {
  const db = client.db.loadDB();
  if (!db.economy) db.economy = [];
  let entry = db.economy.find(e => e.guildId === guildId && e.userId === userId);
  if (!entry) {
    entry = { guildId, userId, wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, lastRob: 0 };
    db.economy.push(entry);
    client.db.saveDB(db);
  }
  if (entry.lastDaily === undefined) entry.lastDaily = 0;
  if (entry.lastWork === undefined) entry.lastWork = 0;
  if (entry.lastRob === undefined) entry.lastRob = 0;
  return entry;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw coins from your bank to your wallet')
    .addStringOption(opt => opt.setName('amount').setDescription('Amount to withdraw or "all"').setRequired(true)),
  cooldown: 3,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    const user = isSlash ? source.user : source.author;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    let amountInput;
    if (isSlash) {
      amountInput = source.options.getString('amount');
    } else {
      amountInput = arg2[0];
    }

    if (!amountInput) {
      return source.reply({ content: '❌ Please specify an amount to withdraw.', ephemeral: true }).catch(() => {});
    }

    const data = getEconomy(client, guild.id, user.id);

    let amount;
    if (amountInput.toLowerCase() === 'all' || amountInput.toLowerCase() === 'max') {
      amount = data.bank;
    } else {
      amount = parseInt(amountInput);
    }

    if (!amount || amount <= 0) {
      return source.reply({ content: '❌ Please enter a valid number.', ephemeral: true }).catch(() => {});
    }
    if (amount > data.bank) {
      return source.reply({
        content: `❌ You only have **${data.bank.toLocaleString()}** coins in your bank.`,
        ephemeral: true,
      }).catch(() => {});
    }

    data.bank -= amount;
    data.wallet += amount;

    const db = client.db.loadDB();
    client.db.saveDB(db);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('💸 Withdrawn!')
      .setDescription(`Withdrew **${amount.toLocaleString()}** coins from your bank.`)
      .addFields(
        { name: '💰 Wallet', value: `${data.wallet.toLocaleString()} coins`, inline: true },
        { name: '🏦 Bank', value: `${data.bank.toLocaleString()} coins`, inline: true },
      )
      .setTimestamp();

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
