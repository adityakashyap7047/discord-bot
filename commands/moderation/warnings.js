const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/helpers');
const { getWarnings } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Check warnings for a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,
  async execute(message, args, client) {
    const user = message.mentions.users.first();
    if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user.')] });
    const warns = getWarnings(message.guild.id, user.id);
    if (!warns.length) return message.reply({ embeds: [infoEmbed('Warnings', `${user.tag} has no warnings.`)] });

    const list = warns.map((w, i) => `**${i + 1}.** ${w.reason} - <@${w.moderatorId}> (${w.timestamp})`).join('\n');
    message.reply({ embeds: [infoEmbed(`Warnings for ${user.tag}`, list)] });
  },
};
