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
    .setName('coinflip')
    .setDescription('Flip a coin! 50/50 chance to double or lose your bet')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true).setMinValue(1)),
  cooldown: 5,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    const user = isSlash ? source.user : source.author;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    let amount;
    if (isSlash) {
      amount = source.options.getInteger('amount');
    } else {
      amount = parseInt(arg2[0]);
    }

    if (!amount || amount <= 0) {
      return source.reply({ content: '❌ Please specify a valid amount to bet.', ephemeral: true }).catch(() => {});
    }

    const economy = getEconomy(client, guild.id, user.id);
    if (economy.wallet < amount) {
      return source.reply({
        content: `❌ You need **${amount.toLocaleString()}** coins in your wallet but only have **${economy.wallet.toLocaleString()}**.`,
        ephemeral: true,
      }).catch(() => {});
    }

    const flipEmbed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🪙 Coin Flip')
      .setDescription('Flipping the coin...')
      .setTimestamp();

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = Math.random() < 0.5;
    const coinEmoji = result === 'heads' ? '🪙' : '🌕';

    let resultEmbed;
    if (won) {
      economy.wallet += amount;
      resultEmbed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('🪙 You Won!')
        .setDescription(`The coin landed on **${result.toUpperCase()}** ${coinEmoji}\n\nYou won **${amount.toLocaleString()}** coins!`)
        .addFields({ name: '💰 Wallet', value: `${economy.wallet.toLocaleString()} coins`, inline: true })
        .setTimestamp();
    } else {
      economy.wallet -= amount;
      resultEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🪙 You Lost!')
        .setDescription(`The coin landed on **${result.toUpperCase()}** ${coinEmoji}\n\nYou lost **${amount.toLocaleString()}** coins!`)
        .addFields({ name: '💰 Wallet', value: `${economy.wallet.toLocaleString()} coins`, inline: true })
        .setTimestamp();
    }

    const db = client.db.loadDB();
    client.db.saveDB(db);

    if (isSlash) {
      await source.deferReply();
      await new Promise(r => setTimeout(r, 1500));
      await source.editReply({ embeds: [resultEmbed] }).catch(() => {});
    } else {
      const msg = await source.reply({ embeds: [flipEmbed] }).catch(() => {});
      await new Promise(r => setTimeout(r, 1500));
      if (msg) await msg.edit({ embeds: [resultEmbed] }).catch(() => {});
    }
  },
};
