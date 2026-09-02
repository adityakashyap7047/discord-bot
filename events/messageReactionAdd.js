const { Events } = require('discord.js');
const { getReactionRole, addStarboard, getStarboard } = require('../utils/database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.MessageReactionAdd,
  once: false,
  async execute(reaction, user, client) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const rr = getReactionRole(reaction.message.guild.id, reaction.message.id, reaction.emoji.name);
    if (rr) {
      const member = reaction.message.guild.members.cache.get(user.id);
      if (member) await member.roles.add(rr.roleId).catch(() => {});
    }

    if (reaction.emoji.name === '⭐' && reaction.count >= 3) {
      const existing = getStarboard(reaction.message.guild.id, reaction.message.id);
      if (!existing) {
        const embed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle('⭐ Starred Message')
          .addFields(
            { name: 'Author', value: reaction.message.author.tag, inline: true },
            { name: 'Channel', value: `<#${reaction.message.channel.id}>`, inline: true },
            { name: 'Content', value: reaction.message.content.slice(0, 1024) || 'No content' },
          )
          .setTimestamp();
        const { getGuildSettings } = require('../utils/database');
        const settings = getGuildSettings(reaction.message.guild.id);
        if (settings.modLogChannel) {
          const starChannel = reaction.message.guild.channels.cache.get(settings.modLogChannel);
          if (starChannel) {
            const msg = await starChannel.send({ embeds: [embed] });
            addStarboard(reaction.message.guild.id, reaction.message.id, msg.id, reaction.count);
          }
        }
      }
    }
  },
};
