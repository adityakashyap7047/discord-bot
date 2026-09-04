const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlockall')
    .setDescription('Unlock all text channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 10,
  async execute(message) {
    try {
      if (!message.member.permissions.has('ManageChannels')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Channels permission.')] });
      }
      const channels = message.guild.channels.cache.filter(c => c.isTextBased() && c.viewable && !c.isThread());
      let unlocked = 0;

      for (const [, ch] of channels) {
        try {
          await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }, { reason: 'Unlocked by moderator' });
          unlocked++;
        } catch (e) {}
      }

      message.reply({ embeds: [successEmbed('Channels Unlocked', `Successfully unlocked **${unlocked}** text channels.`)] });
    } catch (e) {
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to unlock channels.')] }).catch(() => {});
    }
  },
};
