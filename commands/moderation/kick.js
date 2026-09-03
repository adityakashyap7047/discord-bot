const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('KickMembers')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Kick Members permission.')] });
      }
      const user = message.mentions.users.first();
      if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user to kick.')] });
      const member = message.guild.members.cache.get(user.id);
      if (!member) return message.reply({ embeds: [errorEmbed('Error', 'User not in this server.')] });
      if (!member.kickable) return message.reply({ embeds: [errorEmbed('Error', 'Cannot kick this user.')] });
      const reason = args.slice(1).join(' ') || 'No reason provided';
      await member.kick(reason);
      message.reply({ embeds: [successEmbed('Kicked', `${user.tag} has been kicked.\nReason: ${reason}`)] }).catch(() => {});
    } catch (e) {
      console.error('[KICK ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to kick member.')] }).catch(() => {});
    }
  },
};
