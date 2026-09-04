const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Hug someone')
    .addUserOption(opt => opt.setName('user').setDescription('Who to hug').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    const isSlash = message.isChatInputCommand;
    const target = isSlash ? message.options.getUser('user') : message.mentions.users.first();
    if (!target) return message.reply('Mention someone to hug!');
    if (target.id === message.author.id) return message.reply('You hug yourself... wholesome 🥺');

    const embed = new EmbedBuilder()
      .setColor(0xec4899)
      .setTitle('🤗 *hugs*')
      .setDescription(`${message.author} hugs ${target}! 🫂💕`);
    message.reply({ embeds: [embed] });
  },
};
