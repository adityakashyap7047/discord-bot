const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('economyboard').setDescription('Economy leaderboard for this server'),
  cooldown: 5,
  async execute(message, args, client) {
    const db = client.db;
    const economy = db.get('economy') || {};
    const guildId = message.guild.id;
    const entries = Object.entries(economy)
      .filter(([k]) => k.startsWith(guildId + '_'))
      .map(([k, v]) => ({ userId: k.split('_')[1], total: (v.balance || 0) + (v.bank || 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    if (!entries.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ No Data').setDescription('No economy data yet. Start earning with `/daily`!')] });
    const medals = ['🥇', '🥈', '🥉'];
    const leaderboard = entries.map((e, i) => `${medals[i] || `**${i + 1}.**`} <@${e.userId}> — **${e.total.toLocaleString()}** coins`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 Economy Leaderboard')
      .setDescription(leaderboard)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
