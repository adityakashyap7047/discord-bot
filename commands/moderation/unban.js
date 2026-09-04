const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID')
    .addStringOption(opt => opt.setName('user').setDescription('User ID to unban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for unban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('BanMembers')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Ban Members permission.')] });
      }

      let userId, reason;
      if (message.isChatInputCommand) {
        userId = message.options.getString('user');
        reason = message.options.getString('reason') || 'No reason provided';
      } else {
        if (!args[0]) return message.reply({ embeds: [errorEmbed('Error', 'Provide a user ID to unban.\nUsage: `unban <userId> [reason]`')] });
        userId = args[0];
        reason = args.slice(1).join(' ') || 'No reason provided';
      }

      if (!/^\d+$/.test(userId)) {
        return message.reply({ embeds: [errorEmbed('Error', 'Invalid user ID. Must be a numeric ID.')] });
      }

      let banInfo;
      try {
        banInfo = await message.guild.bans.fetch(userId);
      } catch {
        return message.reply({ embeds: [errorEmbed('Error', `User with ID \`${userId}\` is not banned.`)] });
      }

      await message.guild.members.unban(userId, reason);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ User Unbanned')
        .setDescription(`**${banInfo.user.tag}** has been unbanned.`)
        .addFields(
          { name: 'User ID', value: userId, inline: true },
          { name: 'Reason', value: reason, inline: true },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[UNBAN ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to unban user.')] }).catch(() => {});
    }
  },
};
