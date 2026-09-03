const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('BanMembers')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Ban Members permission.')] });
      }
      const user = message.mentions.users.first();
      if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user to ban.')] });
      const member = message.guild.members.cache.get(user.id);
      if (!member) return message.reply({ embeds: [errorEmbed('Error', 'User not in this server.')] });
      if (!member.bannable) return message.reply({ embeds: [errorEmbed('Error', 'Cannot ban this user.')] });
      const reason = args.slice(1).join(' ') || 'No reason provided';
      await member.ban({ reason });
      message.reply({ embeds: [successEmbed('Banned', `${user.tag} has been banned.\nReason: ${reason}`)] }).catch(() => {});
    } catch (e) {
      console.error('[BAN ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to ban member.')] }).catch(() => {});
    }
  },
};
