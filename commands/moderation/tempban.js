const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { addTempban, removeTempban, getTempbans } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Temporarily ban a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 1h, 1d, 7d, 30d)').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('BanMembers')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Ban Members permission.')] });
      }

      let user, durationStr, reason;
      if (message.isChatInputCommand) {
        user = message.options.getUser('user');
        durationStr = message.options.getString('duration');
        reason = message.options.getString('reason') || 'No reason provided';
      } else {
        user = message.mentions.users.first();
        if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user to tempban.\nUsage: `tempban @user <duration> [reason]`')] });
        durationStr = args[1];
        reason = args.slice(2).join(' ') || 'No reason provided';
        if (!durationStr) return message.reply({ embeds: [errorEmbed('Error', 'Provide a duration.\nExamples: `1h`, `1d`, `7d`, `30d`')] });
      }

      const member = message.guild.members.cache.get(user.id);
      if (!member) return message.reply({ embeds: [errorEmbed('Error', 'User not in this server.')] });
      if (!member.bannable) return message.reply({ embeds: [errorEmbed('Error', 'Cannot ban this user (role hierarchy).')] });

      const timeMs = parseDuration(durationStr);
      if (!timeMs) return message.reply({ embeds: [errorEmbed('Error', 'Invalid duration. Use formats like `1h`, `1d`, `7d`, `30d`.')] });

      await member.ban({ reason: `[TEMPBAN ${durationStr}] ${reason}` });

      try {
        await addTempban(message.guild.id, user.id, Date.now() + timeMs);
      } catch (e) {
        console.error('[TEMPBAN DB ERROR]', e);
      }

      setTimeout(async () => {
        try {
          await message.guild.members.unban(user.id, 'Tempban expired');
          try {
            await removeTempban(message.guild.id, user.id);
          } catch (e) {}
        } catch (e) {
          console.error('[TEMPBAN AUTO-UNBAN ERROR]', e);
        }
      }, timeMs);

      const expiresAt = new Date(Date.now() + timeMs).toLocaleString();

      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⏳ Tempban')
        .setDescription(`**${user.tag}** has been tempbanned.`)
        .addFields(
          { name: 'Duration', value: durationStr, inline: true },
          { name: 'Expires', value: expiresAt, inline: true },
          { name: 'Reason', value: reason },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[TEMPBAN ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to tempban.')] }).catch(() => {});
    }
  },
};

function parseDuration(str) {
  const match = str.match(/^(\d+)([mhd])$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  if (unit === 'm') return num * 60 * 1000;
  if (unit === 'h') return num * 60 * 60 * 1000;
  if (unit === 'd') return num * 24 * 60 * 60 * 1000;
  return null;
}
