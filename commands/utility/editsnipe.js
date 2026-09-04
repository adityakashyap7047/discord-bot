const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const editSnipedMessages = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editsnipe')
    .setDescription('Snipe the last edited message in this channel'),
  cooldown: 3,
  async execute(message) {
    const sniped = editSnipedMessages.get(message.channel.id);
    if (!sniped) return message.reply('❌ Nothing to snipe!');

    const embed = new EmbedBuilder()
      .setColor(0xeab308)
      .setTitle('✏️ Edit Sniped')
      .addFields(
        { name: 'Author', value: `${sniped.author}`, inline: true },
        { name: 'Edited', value: `<t:${Math.floor(sniped.timestamp / 1000)}:R>`, inline: true },
        { name: 'Before', value: sniped.before || '*[No content]*', inline: false },
        { name: 'After', value: sniped.after || '*[No content]*', inline: false }
      )
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
  editSnipedMessages,
};
