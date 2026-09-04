const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('Display bot information'),
  cooldown: 3,
  async execute(message, args, client) {
    const uptime = formatUptime(client.uptime);
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('🤖 Bot Boy NOTIX')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '📊 Servers', value: `${client.guilds.cache.size.toLocaleString()}`, inline: true },
        { name: '👥 Users', value: `${client.users.cache.size.toLocaleString()}`, inline: true },
        { name: '📡 Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: '⏱️ Uptime', value: uptime, inline: true },
        { name: '🔧 Commands', value: `${client.commands.size}`, inline: true },
        { name: '📦 Discord.js', value: `v${require('discord.js').version}`, inline: true },
        { name: '💾 Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true },
        { name: '🏓 Node.js', value: process.version, inline: true },
        { name: '📋 OS', value: `${process.platform} ${process.arch}`, inline: true },
      )
      .setFooter({ text: 'Bot Boy NOTIX • Powering your server' })
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
  return `${d}d ${h}h ${m}m ${sec}s`;
}
