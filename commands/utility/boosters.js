const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boosters')
    .setDescription('List server boosters'),
  cooldown: 5,
  async execute(message) {
    const boosters = message.guild.premiumSubscribers;
    if (!boosters || boosters.size === 0) return message.reply('❌ No boosters in this server!');

    const embed = new EmbedBuilder()
      .setColor(0xec4899)
      .setTitle('💎 Server Boosters')
      .setDescription(boosters.map(b => `${b} — Since <t:${Math.floor((b.premiumSinceTimestamp || 0) / 1000)}:R>`).join('\n'))
      .setFooter({ text: `${boosters.size} booster(s) | Level ${message.guild.premiumTier}` });
    message.reply({ embeds: [embed] });
  },
};
