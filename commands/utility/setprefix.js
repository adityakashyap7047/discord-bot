const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, updateGuildSetting } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('setprefix').setDescription('Set the bot prefix')
    .addStringOption(opt => opt.setName('prefix').setDescription('New prefix').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const prefix = args[0];
    if (!prefix) return message.reply({ embeds: [errorEmbed('Error', 'Provide a prefix.')] });
    updateGuildSetting(client.db, message.guild.id, 'prefix', prefix);
    message.reply({ embeds: [successEmbed('Prefix Set', `Prefix changed to \`${prefix}\``)] });
  },
};
