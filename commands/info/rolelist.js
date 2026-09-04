const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('rolelist').setDescription('List all roles in the server'),
  cooldown: 3,
  async execute(message, args, client) {
    const roles = message.guild.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `${r} — **${r.members.size}** members`)
      .slice(0, 25);
    if (!roles.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ No Roles').setDescription('This server has no roles.')] });
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(`🎭 Roles (${message.guild.roles.cache.size - 1})`)
      .setDescription(roles.join('\n'))
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
