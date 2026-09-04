const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('choose')
    .setDescription('Choose between options')
    .addStringOption(opt => opt.setName('options').setDescription('Comma-separated options').setRequired(true)),
  cooldown: 2,
  async execute(message, args, client) {
    const optionsStr = args.join(' ');
    const options = optionsStr.split(',').map(o => o.trim()).filter(o => o);
    if (options.length < 2) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Need Options').setDescription('Provide at least 2 comma-separated options.')] });
    const chosen = options[Math.floor(Math.random() * options.length)];
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('🎯 Choice')
      .setDescription(`I choose: **${chosen}**`)
      .addFields({ name: 'Options', value: options.map((o, i) => `${i + 1}. ${o}`).join('\n') })
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
