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
    .setName('balance')
    .setDescription('Check your or another user\'s balance')
    .addUserOption(opt => opt.setName('user').setDescription('User to check balance of')),
  cooldown: 3,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    let target;
    if (isSlash) {
      target = source.options.getUser('user') || source.user;
    } else {
      target = source.mentions.users.first() || source.author;
    }

    const data = getEconomy(client, guild.id, target.id);
    const total = data.wallet + data.bank;

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(`${target.username}'s Balance`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '💰 Wallet', value: `${data.wallet.toLocaleString()} coins`, inline: true },
        { name: '🏦 Bank', value: `${data.bank.toLocaleString()} coins`, inline: true },
        { name: '📊 Total', value: `**${total.toLocaleString()} coins**`, inline: false },
      )
      .setTimestamp();

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
