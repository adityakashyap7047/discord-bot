const { Events, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/database');

module.exports = {
  name: Events.MessageDelete,
  once: false,
  async execute(message, client) {
    if (!message.guild || !message.content) return;
    const settings = getGuildSettings(message.guild.id);
    if (!settings.modLogChannel) return;
    const channel = message.guild.channels.cache.get(settings.modLogChannel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('Message Deleted')
      .addFields(
        { name: 'Author', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Content', value: message.content.slice(0, 1024) || 'No content' },
      )
      .setTimestamp();
    channel.send({ embeds: [embed] });
  },
};
