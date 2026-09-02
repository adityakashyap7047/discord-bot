const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, updateGuildSetting } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('automod').setDescription('Toggle auto-moderation')
    .addStringOption(opt => opt.setName('feature').setDescription('Feature: automod, antispam, antilink').setRequired(true))
    .addStringOption(opt => opt.setName('toggle').setDescription('on or off').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const feature = args[0]?.toLowerCase();
    const toggle = args[1]?.toLowerCase();
    if (!['automod', 'antispam', 'antilink'].includes(feature)) return message.reply({ embeds: [errorEmbed('Error', 'Feature: `automod`, `antispam`, `antilink`')] });
    if (!['on', 'off'].includes(toggle)) return message.reply({ embeds: [errorEmbed('Error', 'Toggle: `on` or `off`')] });

    const key = feature === 'automod' ? 'autoMod' : feature === 'antispam' ? 'antiSpam' : 'antiLink';
    updateGuildSetting(client.db, message.guild.id, key, toggle === 'on' ? 1 : 0);
    message.reply({ embeds: [successEmbed('Auto Mod Updated', `${feature} is now **${toggle}**`)] });
  },
};
