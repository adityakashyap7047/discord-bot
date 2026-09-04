const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverlock')
    .setDescription('Lock or unlock the entire server')
    .addStringOption(opt => opt.setName('action').setDescription('Lock or unlock').addChoices({ name: 'Lock', value: 'lock' }, { name: 'Unlock', value: 'unlock' }).setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Administrator permission.')] });
      }
      const action = args[0];
      const reason = args.slice(1).join(' ') || 'No reason provided';
      const locked = action === 'lock';
      const everyone = message.guild.roles.everyone;
      await everyone.setPermissions(locked ? [] : ['SendMessages', 'AddReactions'], reason);
      const embed = successEmbed(
        locked ? '🔒 Server Locked' : '🔓 Server Unlocked',
        locked ? `Server has been locked.\nReason: ${reason}` : 'Server has been unlocked.'
      );
      message.reply({ embeds: [embed] }).catch(() => {});
    } catch (e) {
      console.error('[SERVERLOCK ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to lock/unlock server.')] }).catch(() => {});
    }
  },
};
