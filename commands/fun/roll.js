const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('roll').setDescription('Roll a dice')
    .addIntegerOption(opt => opt.setName('sides').setDescription('Number of sides (default 6)')),
  cooldown: 2,
  async execute(message, args, client) {
    const sides = parseInt(args[0]) || 6;
    const result = Math.floor(Math.random() * sides) + 1;
    message.reply(`🎲 You rolled a **${result}** (d${sides})`);
  },
};
