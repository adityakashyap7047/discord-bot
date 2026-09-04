const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('uptime').setDescription('Check bot uptime'),
  cooldown: 3,
  async execute(message, args, client) {
    const ms = client.uptime;
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const bar = generateBar(d, h, m);
    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('⏱️ Bot Uptime')
      .setDescription(`\`\`\`${d}d ${h}h ${m}m ${sec}s\`\`\``)
      .addFields(
        { name: 'Days', value: `${d}`, inline: true },
        { name: 'Hours', value: `${h}`, inline: true },
        { name: 'Minutes', value: `${m}`, inline: true },
      )
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};

function generateBar(d, h, m) {
  const total = d * 24 * 60 + h * 60 + m;
  const filled = Math.min(Math.floor(total / 1440 * 20), 20);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}
