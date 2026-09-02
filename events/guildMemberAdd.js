const { Events } = require('discord.js');
const { getGuildSettings } = require('../utils/database');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, client) {
    const settings = getGuildSettings(member.guild.id);

    if (settings.welcomeEnabled && settings.welcomeChannel) {
      const channel = member.guild.channels.cache.get(settings.welcomeChannel);
      if (channel) {
        const msg = (settings.welcomeMessage || 'Welcome {user} to {server}!')
          .replace('{user}', `<@${member.id}>`)
          .replace('{server}', member.guild.name)
          .replace('{memberCount}', member.guild.memberCount);
        channel.send(msg);
      }
    }

    if (settings.autoRole) {
      try {
        const role = member.guild.roles.cache.get(settings.autoRole);
        if (role) await member.roles.add(role);
      } catch (e) {}
    }
  },
};
