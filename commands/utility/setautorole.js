const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, updateGuildSetting } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('setautorole').setDescription('Set auto role for new members')
    .addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const role = message.mentions.roles.first();
    if (!role) return message.reply({ embeds: [errorEmbed('Error', 'Mention a role.')] });
    await updateGuildSetting(client.db, message.guild.id, 'autoroleId', role.id);
    await updateGuildSetting(client.db, message.guild.id, 'autoroleEnabled', true);
    message.reply({ embeds: [successEmbed('Auto Role Set', `Auto role set to ${role}`)] });
  },
};
