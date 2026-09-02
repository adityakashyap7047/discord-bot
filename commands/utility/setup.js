const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed, getGuildSettings, updateGuildSetting } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('setup').setDescription('Quick setup wizard')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 10,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Server permission.')] });
    }
    const settings = getGuildSettings(client.db, message.guild.id);
    const embed = successEmbed('Current Settings', [
      `**Prefix:** \`${settings.prefix}\``,
      `**Welcome:** ${settings.welcomeEnabled ? '✅' : '❌'} ${settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : ''}`,
      `**Goodbye:** ${settings.goodbyeEnabled ? '✅' : '❌'} ${settings.goodbyeChannel ? `<#${settings.goodbyeChannel}>` : ''}`,
      `**Mod Log:** ${settings.modLogChannel ? `<#${settings.modLogChannel}>` : '❌'}`,
      `**Auto Role:** ${settings.autoRole ? `<@&${settings.autoRole}>` : '❌'}`,
      `**Auto Mod:** ${settings.autoMod ? '✅' : '❌'}`,
      `**Anti-Spam:** ${settings.antiSpam ? '✅' : '❌'}`,
      `**Anti-Link:** ${settings.antiLink ? '✅' : '❌'}`,
    ].join('\n'));
    message.reply({ embeds: [embed] });
  },
};
