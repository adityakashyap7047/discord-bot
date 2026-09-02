const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, getGuildSettings, updateGuildSetting } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel')
    .addIntegerOption(opt => opt.setName('seconds').setDescription('Slowmode in seconds (0 to disable)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageChannels')) {
      return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Channels permission.')] });
    }
    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply({ embeds: [errorEmbed('Error', 'Provide 0-21600 seconds.')] });
    }
    await message.channel.setRateLimitPerUser(seconds);
    message.reply({ embeds: [successEmbed('Slowmode', `Slowmode set to ${seconds} seconds.`)] });
  },
};
