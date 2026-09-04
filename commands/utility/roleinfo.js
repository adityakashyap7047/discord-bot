const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Get information about a role')
    .addRoleOption(opt => opt.setName('role').setDescription('Role to inspect').setRequired(true)),
  cooldown: 3,
  async execute(message) {
    const role = message.options.getRole('role');
    const embed = new EmbedBuilder()
      .setColor(role.color || 0x8b5cf6)
      .setTitle(`📋 Role Info: ${role.name}`)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Color', value: role.hexColor || 'None', inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Members', value: `${role.members.size}`, inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true }
      );
    message.reply({ embeds: [embed] });
  },
};
