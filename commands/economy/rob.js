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
    .setName('rob')
    .setDescription('Rob another user (risky!)')
    .addUserOption(opt => opt.setName('user').setDescription('User to rob').setRequired(true)),
  cooldown: 15,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    const user = isSlash ? source.user : source.author;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    let target;
    if (isSlash) {
      target = source.options.getUser('user');
    } else {
      target = source.mentions.users.first();
    }

    if (!target) {
      return source.reply({ content: '❌ Please mention a user to rob.', ephemeral: true }).catch(() => {});
    }
    if (target.bot) {
      return source.reply({ content: '❌ You cannot rob bots.', ephemeral: true }).catch(() => {});
    }
    if (target.id === user.id) {
      return source.reply({ content: '❌ You cannot rob yourself!', ephemeral: true }).catch(() => {});
    }

    const robber = getEconomy(client, guild.id, user.id);
    const victim = getEconomy(client, guild.id, target.id);

    if (robber.wallet < 500) {
      return source.reply({
        content: '❌ You need at least **500** coins in your wallet to attempt a robbery.',
        ephemeral: true,
      }).catch(() => {});
    }
    if (victim.wallet < 500) {
      return source.reply({
        content: `❌ ${target.username} doesn't have enough coins in their wallet to rob (minimum 500).`,
        ephemeral: true,
      }).catch(() => {});
    }

    const now = Date.now();
    const cooldown = 60 * 60 * 1000;
    if (robber.lastRob && now - robber.lastRob < cooldown) {
      const remaining = cooldown - (now - robber.lastRob);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      return source.reply({
        content: `❌ You need to wait **${minutes}m ${seconds}s** before robbing again.`,
        ephemeral: true,
      }).catch(() => {});
    }

    robber.lastRob = now;
    const success = Math.random() < 0.4;

    let embed;
    if (success) {
      const minStolen = Math.floor(victim.wallet * 0.2);
      const maxStolen = Math.floor(victim.wallet * 0.5);
      const stolen = Math.floor(Math.random() * (maxStolen - minStolen + 1)) + minStolen;
      robber.wallet += stolen;
      victim.wallet -= stolen;
      embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('💰 Robbery Successful!')
        .setDescription(`You broke into **${target.username}**'s wallet and stole **${stolen.toLocaleString()}** coins!`)
        .addFields(
          { name: '💰 Your Wallet', value: `${robber.wallet.toLocaleString()} coins`, inline: true },
          { name: '🫗 Their Wallet', value: `${victim.wallet.toLocaleString()} coins`, inline: true },
        )
        .setTimestamp();
    } else {
      const fine = Math.floor(Math.random() * 301) + 200;
      robber.wallet -= fine;
      embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🚨 Robbery Failed!')
        .setDescription(`You got caught! You were fined **${fine.toLocaleString()}** coins and handed over to the authorities.`)
        .addFields(
          { name: '💰 Your Wallet', value: `${robber.wallet.toLocaleString()} coins`, inline: true },
        )
        .setTimestamp();
    }

    const db = client.db.loadDB();
    client.db.saveDB(db);

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
