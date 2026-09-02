const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('msg')
    .setDescription('Send a message as an embed')
    .addStringOption(opt => opt.setName('message').setDescription('Message to send').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    const text = args.join(' ');
    if (!text) {
      return message.reply({ embeds: [errorEmbed('Error', 'Provide a message.\nUsage: `!msg Hello everyone!`')] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
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
