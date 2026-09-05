const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { addReactionRole } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder().setName('reactionrole').setDescription('Create a reaction role message')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel').setRequired(true))
    .addStringOption(opt => opt.setName('messageid').setDescription('Message ID').setRequired(true))
    .addStringOption(opt => opt.setName('emoji').setDescription('Emoji').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Role to give').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply({ embeds: [errorEmbed('No Permission', 'Need Manage Server.')] });
    const channel = message.mentions.channels.first();
    const messageId = args[1];
    const emoji = args[2];
    const role = message.mentions.roles.first();
    if (!channel || !messageId || !emoji || !role) return message.reply({ embeds: [errorEmbed('Error', 'Usage: `reactionrole #channel <messageId> <emoji> @role`')] });

    try {
      const targetMsg = await channel.messages.fetch(messageId);
      await targetMsg.react(emoji);
      await addReactionRole(message.guild.id, channel.id, messageId, emoji, role.id);
      message.reply({ embeds: [successEmbed('Reaction Role', `Reaction role created: ${emoji} → ${role}`)] });
    } catch (e) {
      message.reply({ embeds: [errorEmbed('Error', 'Could not set up reaction role. Check the message ID and emoji.')] });
    }
  },
};
