const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prune')
    .setDescription('Kick members who haven\'t spoken in X days')
    .addIntegerOption(opt => opt.setName('days').setDescription('Number of days (1-30)').setMinValue(1).setMaxValue(30).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  cooldown: 60,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('KickMembers')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Kick Members permission.')] });
      }

      let days;
      if (message.isChatInputCommand) {
        days = message.options.getInteger('days');
      } else {
        days = parseInt(args[0]);
        if (!days || isNaN(days) || days < 1 || days > 30) {
          return message.reply({ embeds: [errorEmbed('Error', 'Provide a number of days between 1 and 30.\nUsage: `prune <days>`')] });
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⏳ Pruning Members...')
        .setDescription(`Fetching members inactive for **${days}** days...`)
        .setTimestamp();

      const statusMsg = await message.reply({ embeds: [embed] });

      try {
        const pruned = await message.guild.members.prune({
          days,
          reason: `Pruned by ${message.author.tag} — inactive for ${days} days`,
          count: false,
        });

        const resultEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Prune Complete')
          .setDescription(`**${pruned}** member(s) who haven't spoken in **${days}** days have been kicked.`)
          .addFields(
            { name: 'Days Inactive', value: String(days), inline: true },
            { name: 'Members Kicked', value: String(pruned), inline: true },
          )
          .setTimestamp();

        statusMsg.edit({ embeds: [resultEmbed] });
      } catch (e) {
        const errEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Prune Failed')
          .setDescription('Could not complete pruning. Make sure I have permission to kick members and that the prune interval is valid.')
          .setTimestamp();

        statusMsg.edit({ embeds: [errEmbed] });
        console.error('[PRUNE ERROR]', e);
      }
    } catch (e) {
      console.error('[PRUNE ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to prune members.')] }).catch(() => {});
    }
  },
};
