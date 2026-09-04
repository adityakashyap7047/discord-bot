const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const snipedMessages = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Snipe the last deleted message in this channel'),
  cooldown: 3,
  async execute(message) {
    const sniped = snipedMessages.get(message.channel.id);
    if (!sniped) return message.reply('❌ Nothing to snipe!');

    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle('🔫 Sniped Message')
      .addFields(
        { name: 'Author', value: `${sniped.author}`, inline: true },
        { name: 'Deleted', value: `<t:${Math.floor(sniped.timestamp / 1000)}:R>`, inline: true },
        { name: 'Content', value: sniped.content || '*[No text content]*', inline: false }
      )
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
  snipedMessages,
};
