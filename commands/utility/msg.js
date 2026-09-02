const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('msg')
    .setDescription('Send a message as an embed')
    .addStringOption(opt => opt.setName('message').setDescription('Message to send').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply({ embeds: [errorEmbed('Error', 'Provide a message.\nUsage: `!msg Hello everyone!`\nColor: `!msg #ff0000 Hello!`')] });
    }

    let color = 0x6366f1;
    let text = args.join(' ');

    const hexMatch = text.match(/^#([0-9a-fA-F]{3,8})\s+/);
    if (hexMatch) {
      const hex = hexMatch[1];
      color = parseInt(hex, 16);
      text = text.slice(hexMatch[0].length);
    }

    if (!text.trim()) {
      return message.reply({ embeds: [errorEmbed('Error', 'Provide a message after the color.')] });
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(text)
      .setAuthor({
        name: message.member.displayName,
        iconURL: message.author.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await message.delete().catch(() => {});
    message.channel.send({ embeds: [embed] });
  },
};
