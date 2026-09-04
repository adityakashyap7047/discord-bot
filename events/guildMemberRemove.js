const { Events, EmbedBuilder } = require('discord.js');
const { getGuildSettings, addLog } = require('../utils/database');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member, client) {
    const settings = await getGuildSettings(member.guild.id);

    // Goodbye Message
    if (settings.goodbyeEnabled && settings.goodbyeChannel) {
      const channel = member.guild.channels.cache.get(settings.goodbyeChannel);
      if (channel) {
        if (settings.goodbyeEmbed) {
          const msg = (settings.goodbyeMessage || 'Goodbye {user}!')
            .replace('{user}', member.user.tag)
            .replace('{server}', member.guild.name)
            .replace('{memberCount}', member.guild.memberCount);
          const embed = new EmbedBuilder()
            .setColor(settings.goodbyeColor || '#ff0000')
            .setDescription(msg)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
          if (settings.goodbyeImage && /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(settings.goodbyeImage)) {
            embed.setImage(settings.goodbyeImage);
          }
          channel.send({ embeds: [embed] }).catch(() => {});
        } else {
          const msg = (settings.goodbyeMessage || 'Goodbye {user}!')
            .replace('{user}', member.user.tag)
            .replace('{server}', member.guild.name)
            .replace('{memberCount}', member.guild.memberCount);
          channel.send(msg).catch(() => {});
        }
      }
    }

    // Log leave
    if (settings.logChannel && settings.logJoins) {
      const logCh = member.guild.channels.cache.get(settings.logChannel);
      if (logCh) {
        const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.name).join(', ') || 'None';
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('Member Left')
          .addFields(
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Roles', value: roles.slice(0, 1024), inline: true },
            { name: 'Members', value: String(member.guild.memberCount), inline: true },
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        logCh.send({ embeds: [embed] }).catch(() => {});
        addLog(member.guild.id, 'member_leave', null, member.id, 'Member left the server');
      }
    }
  },
};
