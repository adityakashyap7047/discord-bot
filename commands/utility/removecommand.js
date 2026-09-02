const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { removeCustomCommand } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder().setName('removecommand').setDescription('Remove a custom command')
    .addStringOption(opt => opt.setName('name').setDescription('Command name').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const name = args[0]?.toLowerCase();
    if (!name) return message.reply({ embeds: [errorEmbed('Error', 'Provide a command name.')] });
    removeCustomCommand(message.guild.id, name);
    message.reply({ embeds: [successEmbed('Command Removed', `\`${name}\` command deleted.`)] });
  },
};
