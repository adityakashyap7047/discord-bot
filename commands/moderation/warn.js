const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, warnEmbed } = require('../../utils/helpers');
const { addWarning, getWarnings } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ModerateMembers')) {
      return message.reply({ embeds: [errorEmbed('No Permission', 'You need Moderate Members permission.')] });
    }
    const user = message.mentions.users.first();
    if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user to warn.')] });
    const reason = args.slice(1).join(' ') || 'No reason provided';

    addWarning(message.guild.id, user.id, message.author.id, reason);
    const warns = getWarnings(message.guild.id, user.id);

    message.reply({ embeds: [warnEmbed('Warned', `${user.tag} has been warned.\nReason: ${reason}\nTotal warnings: ${warns.length}`)] });
  },
};
