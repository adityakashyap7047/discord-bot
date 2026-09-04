const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Ban then unban a user to purge their messages')
    .addUserOption(opt => opt.setName('user').setDescription('User to softban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('BanMembers')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Ban Members permission.')] });
      }

      let user, reason;
      if (message.isChatInputCommand) {
        user = message.options.getUser('user');
        reason = message.options.getString('reason') || 'Softban - message purge';
      } else {
        user = message.mentions.users.first();
        if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user to softban.')] });
        reason = args.slice(1).join(' ') || 'Softban - message purge';
      }

      const member = message.guild.members.cache.get(user.id);
      if (!member) return message.reply({ embeds: [errorEmbed('Error', 'User not in this server.')] });
      if (!member.bannable) return message.reply({ embeds: [errorEmbed('Error', 'Cannot ban this user (role hierarchy).')] });

      await member.ban({ reason: `[SOFTBAN] ${reason}`, deleteMessageSeconds: 7 * 24 * 60 * 60 });

      setTimeout(async () => {
        try {
          await message.guild.members.unban(user.id, 'Softban completed');
        } catch (e) {
          console.error('[SOFTBAN UNBAN ERROR]', e);
        }
      }, 1000);

      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⚠️ Softban Executed')
        .setDescription(`**${user.tag}** has been softbanned.`)
        .addFields(
          { name: 'What happened', value: 'User was banned and immediately unbanned. Their recent messages (up to 7 days) have been purged.' },
          { name: 'Reason', value: reason },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[SOFTBAN ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to softban.')] }).catch(() => {});
    }
  },
};
