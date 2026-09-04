const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Get information about a channel')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to inspect')),
  cooldown: 3,
  async execute(message) {
    const channel = message.options?.getChannel('channel') || message.channel;
    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`📋 Channel Info: ${channel.name}`)
      .addFields(
        { name: 'ID', value: channel.id, inline: true },
        { name: 'Type', value: `${channel.type}`, inline: true },
        { name: 'Category', value: channel.parent?.name || 'None', inline: true },
        { name: 'Created', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
        { name: 'Topic', value: channel.topic || 'None', inline: false }
      );
    message.reply({ embeds: [embed] });
  },
};
