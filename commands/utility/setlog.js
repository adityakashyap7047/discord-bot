const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed, updateGuildSetting } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('setlog').setDescription('Set moderation log channel')
    .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply({ embeds: [errorEmbed('Error', 'Mention a channel.')] });
    updateGuildSetting(client.db, message.guild.id, 'modLogChannel', channel.id);
    message.reply({ embeds: [successEmbed('Log Set', `Mod log channel set to ${channel}`)] });
  },
};
