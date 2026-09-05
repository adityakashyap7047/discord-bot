const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed, updateGuildSetting } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('setwelcome').setDescription('Set welcome channel and message')
    .addChannelOption(opt => opt.setName('channel').setDescription('Welcome channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Message with {user}, {server}, {memberCount}'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply({ embeds: [errorEmbed('Error', 'Mention a channel.')] });
    await updateGuildSetting(client.db, message.guild.id, 'welcomeChannel', channel.id);
    await updateGuildSetting(client.db, message.guild.id, 'welcomeEnabled', true);
    if (args[1]) await updateGuildSetting(client.db, message.guild.id, 'welcomeMessage', args.slice(1).join(' '));
    message.reply({ embeds: [successEmbed('Welcome Set', `Welcome channel set to ${channel}`)] });
  },
};
