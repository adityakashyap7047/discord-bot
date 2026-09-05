const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed, updateGuildSetting } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('setgoodbye').setDescription('Set goodbye channel and message')
    .addChannelOption(opt => opt.setName('channel').setDescription('Goodbye channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Message with {user}, {server}, {memberCount}'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply({ embeds: [errorEmbed('Error', 'Mention a channel.')] });
    await updateGuildSetting(client.db, message.guild.id, 'goodbyeChannel', channel.id);
    await updateGuildSetting(client.db, message.guild.id, 'goodbyeEnabled', true);
    if (args[1]) await updateGuildSetting(client.db, message.guild.id, 'goodbyeMessage', args.slice(1).join(' '));
    message.reply({ embeds: [successEmbed('Goodbye Set', `Goodbye channel set to ${channel}`)] });
  },
};
