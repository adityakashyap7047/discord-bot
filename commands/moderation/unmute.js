const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to unmute').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('ModerateMembers')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Moderate Members permission.')] });
      }
      const user = message.mentions.users.first();
      if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user to unmute.')] });
      const member = message.guild.members.cache.get(user.id);
      if (!member) return message.reply({ embeds: [errorEmbed('Error', 'User not in this server.')] });
      if (!member.moderatable) return message.reply({ embeds: [errorEmbed('Error', 'Cannot unmute this user.')] });
      const reason = args.slice(1).join(' ') || 'No reason provided';
      await member.timeout(null, reason);
      message.reply({ embeds: [successEmbed('Unmuted', `${user.tag} has been unmuted.\nReason: ${reason}`)] }).catch(() => {});
    } catch (e) {
      console.error('[UNMUTE ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to unmute member.')] }).catch(() => {});
    }
  },
};
