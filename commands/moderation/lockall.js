const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockall')
    .setDescription('Lock all text channels')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for locking'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 10,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('ManageChannels')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Channels permission.')] });
      }
      const reason = message.isChatInputCommand ? (message.options.getString('reason') || 'Locked by moderator') : (args.join(' ') || 'Locked by moderator');
      const channels = message.guild.channels.cache.filter(c => c.isTextBased() && c.viewable && !c.isThread());
      let locked = 0;

      for (const [, ch] of channels) {
        try {
          await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }, { reason });
          locked++;
        } catch (e) {}
      }

      message.reply({ embeds: [successEmbed('Channels Locked', `Successfully locked **${locked}** text channels.\nReason: ${reason}`)] });
    } catch (e) {
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to lock channels.')] }).catch(() => {});
    }
  },
};
