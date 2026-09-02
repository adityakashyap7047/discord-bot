const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageReactionRemove,
  once: false,
  async execute(reaction, user, client) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    const rr = client.db.prepare('SELECT * FROM reaction_roles WHERE guildId = ? AND messageId = ? AND emoji = ?')
      .get(reaction.message.guild.id, reaction.message.id, reaction.emoji.name);
    if (rr) {
      const member = reaction.message.guild.members.cache.get(user.id);
      if (member) await member.roles.remove(rr.roleId).catch(() => {});
    }
  },
};
