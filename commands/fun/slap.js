const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Slap someone')
    .addUserOption(opt => opt.setName('user').setDescription('Who to slap').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    const isSlash = message.isChatInputCommand;
    const target = isSlash ? message.options.getUser('user') : message.mentions.users.first();
    if (!target) return message.reply('Mention someone to slap!');
    if (target.id === message.author.id) return message.reply('Why would you slap yourself?! 😢');

    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle('👋 *slaps*')
      .setDescription(`${message.author} slaps ${target}! 👋😤`);
    message.reply({ embeds: [embed] });
  },
};
