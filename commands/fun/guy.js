const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder().setName('guy').setDescription('Guy'),
  cooldown: 3,
  async execute(message, args, client) {
    const file = new AttachmentBuilder(path.join(__dirname, '..', '..', 'd05cde43af751fc4445a9f4456d74e93.jpg'));
    const embed = new EmbedBuilder()
      .setColor('#ff6600')
      .setImage('attachment://d05cde43af751fc4445a9f4456d74e93.jpg');
    message.channel.send({ embeds: [embed], files: [file] });
  },
};
