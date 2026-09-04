const { SlashCommandBuilder, EmbedBuilder, version: discordVersion } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show bot statistics'),
  cooldown: 5,
  async execute(message, args, client) {
    const uptime = formatUptime(client.uptime);
    const memUsage = process.memoryUsage();

    const servers = client.guilds.cache.size;
    const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    const channels = client.channels.cache.size;
    const commands = client.commands.size;

    const dbSize = client.db ? Object.keys(client.db.data || {}).length : 0;

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('📊 Bot Statistics')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '🏠 Servers', value: `${servers}`, inline: true },
        { name: '👥 Users', value: `${users.toLocaleString()}`, inline: true },
        { name: '💬 Channels', value: `${channels}`, inline: true },
        { name: '⚙️ Commands', value: `${commands}`, inline: true },
        { name: '📁 DB Keys', value: `${dbSize}`, inline: true },
        { name: '⏱️ Uptime', value: uptime, inline: true },
        { name: '💾 Memory', value: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: '🧠 Heap Total', value: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: '📦 RSS', value: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: '🤖 Discord.js', value: `v${discordVersion}`, inline: true },
        { name: '🟢 Node.js', value: process.version, inline: true },
        { name: '🖥️ Platform', value: `${process.platform} ${process.arch}`, inline: true },
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${sec}s`);

  return parts.join(' ');
}
