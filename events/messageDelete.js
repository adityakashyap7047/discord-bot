const { Events, EmbedBuilder } = require('discord.js');
const { getGuildSettings, addLog } = require('../utils/database');

module.exports = {
  name: Events.MessageDelete,
  once: false,
  async execute(message, client) {
    if (!message.guild || !message.content || message.author.bot) return;
    const settings = await getGuildSettings(message.guild.id);
    if (!settings.logChannel || !settings.logMessages) return;
    const channel = message.guild.channels.cache.get(settings.logChannel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('Message Deleted')
      .addFields(
        { name: 'Author', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Content', value: message.content.slice(0, 1024) || 'No text content' },
      )
      .setTimestamp();
    if (message.attachments.size > 0) {
      embed.addFields({ name: 'Attachments', value: message.attachments.map(a => a.url).join('\n').slice(0, 1024) });
    }
    channel.send({ embeds: [embed] }).catch(() => {});
    addLog(message.guild.id, 'message_delete', null, message.author.id, 'Message deleted', { channelId: message.channel.id });

    // Snipe support
    try {
      const snipeCmd = require('../commands/utility/snipe');
      snipeCmd.snipedMessages.set(message.channel.id, {
        author: `${message.author.tag}`,
        content: message.content,
        timestamp: Date.now(),
      });
    } catch (e) {}
  },
};
