const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Change a member\'s nickname')
    .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
    .addStringOption(opt => opt.setName('nickname').setDescription('New nickname').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageNicknames')) {
      return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Nicknames permission.')] });
    }
    const user = message.mentions.users.first();
    if (!user) return message.reply({ embeds: [errorEmbed('Error', 'Mention a user.')] });
    const member = message.guild.members.cache.get(user.id);
    if (!member) return message.reply({ embeds: [errorEmbed('Error', 'User not found.')] });
    const nick = args.slice(1).join(' ');
    await member.setNickname(nick);
    message.reply({ embeds: [successEmbed('Nickname Changed', `${user.tag}'s nickname is now **${nick}**`)] });
  },
};
