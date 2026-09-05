const { Events } = require('discord.js');
const { getReactionRole } = require('../utils/database');

module.exports = {
  name: Events.MessageReactionRemove,
  once: false,
  async execute(reaction, user, client) {
    if (user.bot) return;
    if (!reaction.message.guild) return;
    try {
      if (reaction.partial) await reaction.fetch();
    } catch {
      return;
    }

    try {
      const rr = await getReactionRole(reaction.message.guild.id, reaction.message.id, reaction.emoji.name);
      if (rr) {
        const member = reaction.message.guild.members.cache.get(user.id);
        if (member) await member.roles.remove(rr.roleId).catch(() => {});
      }
    } catch (e) {
      console.error('[REACTION REMOVE ERROR]', e);
    }
  },
};
