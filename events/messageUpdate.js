const { Events, EmbedBuilder } = require('discord.js');
const { getGuildSettings, addLog } = require('../utils/database');

module.exports = {
  name: Events.MessageUpdate,
  once: false,
  async execute(oldMessage, newMessage, client) {
    if (!oldMessage.guild || oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;
    const settings = await getGuildSettings(oldMessage.guild.id);
    if (!settings.logChannel || !settings.logEdits) return;
    const channel = oldMessage.guild.channels.cache.get(settings.logChannel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0xffff00)
      .setTitle('Message Edited')
      .addFields(
        { name: 'Author', value: `${oldMessage.author.tag}`, inline: true },
        { name: 'Channel', value: `<#${oldMessage.channel.id}>`, inline: true },
        { name: 'Before', value: oldMessage.content.slice(0, 512) || 'No content' },
        { name: 'After', value: newMessage.content.slice(0, 512) || 'No content' },
      )
      .setTimestamp();
    channel.send({ embeds: [embed] }).catch(() => {});
    addLog(oldMessage.guild.id, 'message_edit', null, oldMessage.author.id, 'Message edited', { channelId: oldMessage.channel.id });

    // Edit snipe support
    try {
      const editSnipeCmd = require('../commands/utility/editsnipe');
      editSnipeCmd.editSnipedMessages.set(oldMessage.channel.id, {
        author: `${oldMessage.author.tag}`,
        before: oldMessage.content,
        after: newMessage.content,
        timestamp: Date.now(),
      });
    } catch (e) {}
  },
};
