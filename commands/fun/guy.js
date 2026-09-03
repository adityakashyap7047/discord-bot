const { EmbedBuilder } = require('discord.js');

const GUY_IMAGE_URL = 'https://i.imgur.com/PLACEHOLDER.jpg';

module.exports = {
  data: null,
  name: 'guy',
  description: 'Triggered by @@Guy',
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor('#ff6600')
      .setImage(GUY_IMAGE_URL);
    message.channel.send({ embeds: [embed] });
  },
};
