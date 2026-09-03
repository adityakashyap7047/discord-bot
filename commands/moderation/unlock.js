const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('ManageChannels')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Channels permission.')] });
      }
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
      message.reply({ embeds: [successEmbed('Unlocked', `🔓 ${message.channel} has been unlocked.`)] }).catch(() => {});
    } catch (e) {
      console.error('[UNLOCK ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to unlock channel.')] }).catch(() => {});
    }
  },
};
