const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, getGuildSettings } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes'))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ModerateMembers')) {
      return message.reply({ embeds: [errorEmbed('No Permission', 'You need Moderate Members permission.')] });
    }
    const user = message.mentions.users.first();
    if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user to mute.')] });
    const member = message.guild.members.cache.get(user.id);
    if (!member) return message.reply({ embeds: [errorEmbed('Error', 'User not in this server.')] });
    if (!member.moderatable) return message.reply({ embeds: [errorEmbed('Error', 'Cannot mute this user.')] });

    const duration = parseInt(args[1]) || 10;
    const reason = args.slice(2).join(' ') || 'No reason provided';
    const ms = duration * 60 * 1000;

    await member.timeout(ms, reason);
    message.reply({ embeds: [successEmbed('Muted', `${user.tag} has been muted for ${duration} minutes.\nReason: ${reason}`)] });

    setTimeout(async () => {
      try { await member.timeout(null); } catch (e) {}
    }, ms);
  },
};
