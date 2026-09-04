const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('base64')
    .setDescription('Encode or decode Base64')
    .addStringOption(opt => opt.setName('text').setDescription('Text to encode/decode').setRequired(true))
    .addStringOption(opt => opt.setName('action').setDescription('Action').setRequired(true)
      .addChoices({ name: 'Encode', value: 'encode' }, { name: 'Decode', value: 'decode' })),
  cooldown: 3,
  async execute(message, args) {
    const isSlash = message.isChatInputCommand;
    const text = isSlash ? message.options.getString('text') : (args.slice(1).join(' ') || '');
    const action = isSlash ? message.options.getString('action') : (args[0] || 'encode');
    if (!text) return message.reply('Provide text!');

    try {
      let result;
      if (action === 'encode') {
        result = Buffer.from(text).toString('base64');
      } else {
        result = Buffer.from(text, 'base64').toString('utf-8');
      }

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle(`🔐 Base64 ${action === 'encode' ? 'Encoded' : 'Decoded'}`)
        .addFields(
          { name: 'Input', value: `\`\`\`${text.slice(0, 1000)}\`\`\``, inline: false },
          { name: 'Output', value: `\`\`\`${result.slice(0, 1000)}\`\`\``, inline: false }
        );
      message.reply({ embeds: [embed] });
    } catch (e) {
      message.reply('❌ Failed to process. Check your input.');
    }
  },
};
