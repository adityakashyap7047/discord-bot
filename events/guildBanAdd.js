const { Events, EmbedBuilder } = require('discord.js');
const { getGuildSettings, addLog } = require('../utils/database');

module.exports = {
  name: Events.GuildBanAdd,
  once: false,
  async execute(ban) {
    const settings = await getGuildSettings(ban.guild.id);
    if (!settings.logChannel || !settings.logBans) return;
    const channel = ban.guild.channels.cache.get(settings.logChannel);
    if (!channel) return;
    const user = ban.user;
    await channel.send({ embeds: [new EmbedBuilder()
      .setColor('#ef4444')
      .setTitle('Member Banned')
      .setDescription(`${user.tag} was banned.`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()] }).catch(() => {});
    addLog(ban.guild.id, 'ban', null, user.id, 'Member banned');
  },
};
