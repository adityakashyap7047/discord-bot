const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Get detailed information about a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to look up')),
  cooldown: 3,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(target.id);

    const accountAge = Math.floor((Date.now() - target.createdTimestamp) / (1000 * 60 * 60 * 24));
    const accountYears = Math.floor(accountAge / 365);
    const accountDays = accountAge % 365;

    let statusText = 'Offline';
    let statusColor = 0x808080;
    if (member) {
      const presence = member.presence;
      if (presence) {
        switch (presence.status) {
          case 'online': statusText = '🟢 Online'; statusColor = 0x22c55e; break;
          case 'idle': statusText = '🟡 Idle'; statusColor = 0xf59e0b; break;
          case 'dnd': statusText = '🔴 Do Not Disturb'; statusColor = 0xff0000; break;
          case 'offline': statusText = '⚫ Offline'; statusColor = 0x808080; break;
        }
      }
    }

    let roles = 'None';
    let roleCount = 0;
    if (member) {
      const roleList = member.roles.cache
        .filter(r => r.id !== message.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => `<@&${r.id}>`);
      roleCount = roleList.length;
      roles = roleList.length > 0 ? roleList.join(', ').substring(0, 1024) : 'None';
    }

    let permCount = 0;
    if (member) {
      permCount = member.permissions.toArray().length;
    }

    const embed = new EmbedBuilder()
      .setColor(statusColor)
      .setTitle(`🔍 Who Is: ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👤 Username', value: target.username, inline: true },
        { name: '🆔 ID', value: target.id, inline: true },
        { name: '🤖 Bot', value: target.bot ? 'Yes' : 'No', inline: true },
        { name: '📊 Status', value: statusText, inline: true },
        { name: '📆 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R> (${accountYears}y ${accountDays}d ago)`, inline: false },
        { name: '📅 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', inline: false },
      )
      .setTimestamp();

    if (target.banner) {
      embed.setImage(target.bannerURL({ size: 512 }));
    }

    if (member) {
      embed.addFields(
        { name: `🎭 Roles (${roleCount})`, value: roles, inline: false },
        { name: '🔑 Permissions', value: `${permCount} permissions`, inline: true },
      );

      if (member.nickname) {
        embed.addFields({ name: '📝 Nickname', value: member.nickname, inline: true });
      }
    }

    const avatarButtons = [];
    if (target.avatar) {
      avatarButtons.push(`[Avatar](${target.displayAvatarURL({ dynamic: true, size: 4096 })})`);
    }
    if (member && member.roles.highest) {
      avatarButtons.push(`Highest Role: ${member.roles.highest}`);
    }

    if (avatarButtons.length > 0) {
      embed.setFooter({ text: avatarButtons.join(' • ') });
    }

    message.reply({ embeds: [embed] });
  },
};
