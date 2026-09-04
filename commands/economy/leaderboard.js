const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top 10 richest users'),
  cooldown: 5,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    const db = client.db.loadDB();
    const economy = db.economy || [];
    const guildEntries = economy.filter(e => e.guildId === guild.id);

    if (guildEntries.length === 0) {
      return source.reply({
        embeds: [new EmbedBuilder().setColor(0xf59e0b).setTitle('🏆 Economy Leaderboard').setDescription('No economy data yet. Start earning with `/daily` or `!daily`!')],
      }).catch(() => {});
    }

    const sorted = guildEntries
      .map(e => ({ userId: e.userId, total: (e.wallet || 0) + (e.bank || 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const medals = ['🥇', '🥈', '🥉'];
    const lines = sorted.map((entry, i) => {
      const medal = medals[i] || `**#${i + 1}**`;
      return `${medal} <@${entry.userId}> — **${entry.total.toLocaleString()}** coins`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🏆 Economy Leaderboard')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Top ${sorted.length} richest users in ${guild.name}` })
      .setTimestamp();

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
