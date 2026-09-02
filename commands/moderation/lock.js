const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageChannels')) {
      return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Channels permission.')] });
    }
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    message.reply({ embeds: [successEmbed('Locked', `🔒 ${message.channel} has been locked.`)] });
  },
};
