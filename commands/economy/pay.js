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
    .setName('pay')
    .setDescription('Pay coins to another user')
    .addUserOption(opt => opt.setName('user').setDescription('User to pay').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to pay').setRequired(true).setMinValue(1)),
  cooldown: 3,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    const user = isSlash ? source.user : source.author;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    let target, amount;
    if (isSlash) {
      target = source.options.getUser('user');
      amount = source.options.getInteger('amount');
    } else {
      target = source.mentions.users.first();
      amount = parseInt(arg2[0]);
    }

    if (!target) {
      return source.reply({ content: '❌ Please mention a user to pay.', ephemeral: true }).catch(() => {});
    }
    if (target.bot) {
      return source.reply({ content: '❌ You cannot pay bots.', ephemeral: true }).catch(() => {});
    }
    if (target.id === user.id) {
      return source.reply({ content: '❌ You cannot pay yourself.', ephemeral: true }).catch(() => {});
    }
    if (!amount || amount <= 0) {
      return source.reply({ content: '❌ Please specify a valid amount.', ephemeral: true }).catch(() => {});
    }

    const sender = getEconomy(client, guild.id, user.id);
    if (sender.wallet < amount) {
      return source.reply({
        content: `❌ You need **${amount.toLocaleString()}** coins in your wallet but only have **${sender.wallet.toLocaleString()}**.`,
        ephemeral: true,
      }).catch(() => {});
    }

    const receiver = getEconomy(client, guild.id, target.id);
    sender.wallet -= amount;
    receiver.wallet += amount;

    const db = client.db.loadDB();
    client.db.saveDB(db);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('💸 Payment Sent!')
      .setDescription(`**${user.username}** paid **${amount.toLocaleString()}** coins to **${target.username}**!`)
      .addFields(
        { name: '📤 Your Wallet', value: `${sender.wallet.toLocaleString()} coins`, inline: true },
        { name: '📥 Their Wallet', value: `${receiver.wallet.toLocaleString()} coins`, inline: true },
      )
      .setTimestamp();

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
