const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('reverse').setDescription('Reverse text')
    .addStringOption(opt => opt.setName('text').setDescription('Text to reverse').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    const text = args.join(' ');
    if (!text) return message.reply('Provide text!');
    message.reply(`🔄 ${text.split('').reverse().join('')}`);
  },
};
