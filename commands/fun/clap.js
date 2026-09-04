const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clap')
    .setDescription('Add 👏 between each word')
    .addStringOption(opt => opt.setName('text').setDescription('Text to clapify').setRequired(true)),
  cooldown: 2,
  async execute(message, args, client) {
    const text = args.join(' ') || (interaction?.options?.getString('text') || '');
    if (!text) return message.reply('Give me some text!');
    message.reply(text.split(' ').join(' 👏 '));
  },
};
