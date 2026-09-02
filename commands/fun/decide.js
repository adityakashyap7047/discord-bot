const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('decide').setDescription('Help you decide between options')
    .addStringOption(opt => opt.setName('options').setDescription('Options separated by comma').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    const options = args.join(' ').split(',').map(o => o.trim()).filter(Boolean);
    if (options.length < 2) return message.reply('Provide at least 2 options separated by commas.');
    const chosen = options[Math.floor(Math.random() * options.length)];
    message.reply(`🤔 I choose: **${chosen}**`);
  },
};
