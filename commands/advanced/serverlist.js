const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverlist')
    .setDescription('Show all servers the bot is in'),
  cooldown: 5,
  async execute(message, args, client) {
    const servers = client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount);

    if (servers.size === 0) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('No servers found.')] });
    }

    const totalPages = Math.ceil(servers.size / 10);
    const page = 1;
    const startIdx = (page - 1) * 10;
    const endIdx = startIdx + 10;
    const pageServers = [...servers.values()].slice(startIdx, endIdx);

    const serverList = pageServers.map((g, i) => {
      const idx = startIdx + i + 1;
      return `**${idx}.** ${g.name}\n├ Members: ${g.memberCount.toLocaleString()} | ID: ${g.id}`;
    }).join('\n\n');

    const totalUsers = servers.reduce((acc, g) => acc + g.memberCount, 0);

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`📋 Server List (${servers.size} servers)`)
      .setDescription(serverList)
      .setFooter({ text: `Page ${page}/${totalPages} • Total users: ${totalUsers.toLocaleString()}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
