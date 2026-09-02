const { Events } = require('discord.js');
const { getGuildSettings } = require('../utils/database');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member, client) {
    const settings = getGuildSettings(member.guild.id);

    if (settings.goodbyeEnabled && settings.goodbyeChannel) {
      const channel = member.guild.channels.cache.get(settings.goodbyeChannel);
      if (channel) {
        const msg = (settings.goodbyeMessage || 'Goodbye {user}!')
          .replace('{user}', member.user.tag)
          .replace('{server}', member.guild.name)
          .replace('{memberCount}', member.guild.memberCount);
        channel.send(msg);
      }
    }
  },
};
