const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/helpers');
const { getCustomCommands } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder().setName('listcommands').setDescription('List all custom commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    const cmds = getCustomCommands(message.guild.id);
    if (!cmds.length) return message.reply({ embeds: [infoEmbed('Custom Commands', 'No custom commands set.')] });
    const list = cmds.map(c => `\`${c.name}\` - ${c.response.slice(0, 50)}...`).join('\n');
    message.reply({ embeds: [infoEmbed('Custom Commands', list)] });
  },
};
