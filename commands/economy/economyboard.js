const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEconomyLeaderboard } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder().setName('economyboard').setDescription('Economy leaderboard for this server'),
  cooldown: 5,
  async execute(message, args, client) {
    const entries = await getEconomyLeaderboard(message.guild.id);
    if (!entries.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ No Data').setDescription('No economy data yet. Start earning with `/daily`!')] });
    const medals = ['🥇', '🥈', '🥉'];
    const leaderboard = entries.map((e, i) => `${medals[i] || `**${i + 1}.**`} <@${e.userId || e.user_id}> — **${((e.wallet || 0) + (e.bank || 0)).toLocaleString()}** coins`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 Economy Leaderboard')
      .setDescription(leaderboard)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
