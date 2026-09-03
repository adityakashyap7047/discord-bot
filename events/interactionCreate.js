const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('nitro_prank_')) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Here is your Nitro!')
        .setDescription('You really thought you were getting free Nitro? **LOL**')
        .setImage('https://i.imgur.com/your-image-url.jpg')
        .setFooter({ text: 'Gottem! 😂' });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
