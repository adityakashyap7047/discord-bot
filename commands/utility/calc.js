const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Calculate a math expression')
    .addStringOption(opt => opt.setName('expression').setDescription('Math expression').setRequired(true)),
  cooldown: 3,
  async execute(message, args) {
    const isSlash = message.isChatInputCommand;
    const expr = isSlash ? message.options.getString('expression') : args.join(' ');
    if (!expr) return message.reply('Provide a math expression!');

    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%^ ]/g, '');
      if (!sanitized) return message.reply('Invalid expression.');
      const result = Function('"use strict";return (' + sanitized + ')')();

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle('🧮 Calculator')
        .addFields(
          { name: 'Expression', value: `\`${expr}\``, inline: true },
          { name: 'Result', value: `\`${result}\``, inline: true }
        );
      message.reply({ embeds: [embed] });
    } catch (e) {
      message.reply('❌ Invalid math expression.');
    }
  },
};
