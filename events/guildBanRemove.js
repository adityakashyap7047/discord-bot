const { Events, EmbedBuilder } = require('discord.js');
const { getGuildSettings, addLog } = require('../utils/database');

module.exports = {
  name: Events.GuildBanRemove,
  once: false,
  async execute(ban) {
    const settings = await getGuildSettings(ban.guild.id);
    if (!settings.logChannel || !settings.logBans) return;
    const channel = ban.guild.channels.cache.get(settings.logChannel);
    if (!channel) return;
    const user = ban.user;
    await channel.send({ embeds: [new EmbedBuilder()
      .setColor('#22c55e')
      .setTitle('Member Unbanned')
      .setDescription(`${user.tag} was unbanned.`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()] }).catch(() => {});
    addLog(ban.guild.id, 'unban', null, user.id, 'Member unbanned');
  },
};
