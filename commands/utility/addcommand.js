const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { addCustomCommand } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder().setName('addcommand').setDescription('Add a custom command')
    .addStringOption(opt => opt.setName('name').setDescription('Command name').setRequired(true))
    .addStringOption(opt => opt.setName('response').setDescription('Bot response (use {user} for mention)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const name = args[0]?.toLowerCase();
    const response = args.slice(1).join(' ');
    if (!name || !response) return message.reply({ embeds: [errorEmbed('Error', 'Usage: `addcommand hello Hello {user}!`')] });

    await addCustomCommand(message.guild.id, name, response, message.author.id);
    message.reply({ embeds: [successEmbed('Command Added', `\`${name}\` command created/updated.`)] });
  },
};
