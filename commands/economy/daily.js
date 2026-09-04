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
    .setName('daily')
    .setDescription('Claim your daily coins'),
  cooldown: 5,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    const user = isSlash ? source.user : source.author;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    const data = getEconomy(client, guild.id, user.id);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (data.lastDaily && now - data.lastDaily < cooldown) {
      const remaining = cooldown - (now - data.lastDaily);
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Daily Already Claimed')
        .setDescription(`Come back in **${hours}h ${minutes}m** to claim again.`);
      return source.reply({ embeds: [embed] }).catch(() => {});
    }

    const reward = Math.floor(Math.random() * 501) + 500;
    data.wallet += reward;
    data.lastDaily = now;

    const db = client.db.loadDB();
    client.db.saveDB(db);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('💰 Daily Claimed!')
      .setDescription(`You received **${reward.toLocaleString()}** coins!`)
      .addFields(
        { name: '💰 Wallet', value: `${data.wallet.toLocaleString()} coins`, inline: true },
        { name: '🏦 Bank', value: `${data.bank.toLocaleString()} coins`, inline: true },
      )
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
