const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massban')
    .setDescription('Ban multiple users at once')
    .addStringOption(opt => opt.setName('users').setDescription('User IDs separated by spaces').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 10,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('BanMembers')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Ban Members permission.')] });
      }

      let userIds, reason;
      if (message.isChatInputCommand) {
        userIds = message.options.getString('users').split(/\s+/);
        reason = message.options.getString('reason') || 'Mass ban';
      } else {
        if (args.length < 1) return message.reply({ embeds: [errorEmbed('Error', 'Provide user IDs separated by spaces.\nUsage: `massban <id1> <id2> ... [reason]`')] });
        userIds = args.filter(a => /^\d+$/.test(a));
        reason = args.filter(a => !/^\d+$/.test(a)).join(' ') || 'Mass ban';
      }

      if (userIds.length === 0) {
        return message.reply({ embeds: [errorEmbed('Error', 'No valid user IDs provided.')] });
      }

      if (userIds.length > 25) {
        return message.reply({ embeds: [errorEmbed('Error', 'Cannot mass ban more than 25 users at once.')] });
      }

      const results = [];

      for (const id of userIds) {
        try {
          const member = await message.guild.members.fetch(id).catch(() => null);
          if (member) {
            if (!member.bannable) {
              results.push(`❌ <@${id}> — Cannot ban (insufficient permissions)`);
              continue;
            }
            await member.ban({ reason });
            results.push(`✅ <@${id}> — Banned`);
          } else {
            await message.guild.members.ban(id, { reason });
            results.push(`✅ ${id} — Banned`);
          }
        } catch (e) {
          results.push(`❌ ${id} — ${e.message}`);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle('🔨 Mass Ban Complete')
        .setDescription(results.join('\n').substring(0, 2000) || 'No users were banned.')
        .addFields({ name: 'Reason', value: reason })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[MASSBAN ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to mass ban.')] }).catch(() => {});
    }
  },
};
