const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('nitro_prank_')) {
      const file = new AttachmentBuilder(path.join(__dirname, '..', 'd05cde43af751fc4445a9f4456d74e93.jpg'));
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Here is your Nitro!')
        .setDescription('You really thought you were getting free Nitro? **LOL**')
        .setImage('attachment://d05cde43af751fc4445a9f4456d74e93.jpg')
        .setFooter({ text: 'Gottem!' });
      await interaction.reply({ embeds: [embed], files: [file], ephemeral: true });
    }
  },
};
