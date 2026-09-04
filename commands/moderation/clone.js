const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clone')
    .setDescription('Clone a channel')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to clone').setRequired(true))
    .addStringOption(opt => opt.setName('name').setDescription('New channel name'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('ManageChannels')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Channels permission.')] });
      }

      const isSlash = message.isChatInputCommand;
      const channel = isSlash ? message.options.getChannel('channel') : message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Error', 'Mention a channel to clone.')] });

      const newName = isSlash ? (message.options.getString('name') || channel.name) : (args[1] || channel.name);

      const cloned = await channel.clone({ name: newName, reason: `Cloned by ${message.author.tag}` });
      const embed = successEmbed('Channel Cloned', `Successfully cloned <#${channel.id}> as <#${cloned.id}>`);
      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[CLONE ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to clone channel.')] }).catch(() => {});
    }
  },
};
