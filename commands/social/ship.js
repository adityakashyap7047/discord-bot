const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Calculate love compatibility between two users')
    .addUserOption(opt => opt.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(opt => opt.setName('user2').setDescription('Second user').setRequired(true)),
  cooldown: 5,
  async execute(message, args, client) {
    const user1 = message.mentions.users.first();
    const user2 = message.mentions.users.getAll()[1] || message.author;

    if (!user1) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Mention two users to ship!')] });
    }

    if (user1.id === user2.id) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Cannot ship someone with themselves!')] });
    }

    const seed = (user1.id + user2.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const percentage = seed % 101;

    const bar = generateLoveBar(percentage);
    const verdict = getVerdict(percentage);
    const color = percentage >= 50 ? 0xff69b4 : 0x808080;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('💘 Love Calculator')
      .setDescription(`${user1} + ${user2}`)
      .addFields(
        { name: '💕 Compatibility', value: `**${percentage}%**`, inline: true },
        { name: '📊 Result', value: verdict, inline: true },
        { name: '❤️ Meter', value: bar, inline: false },
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

function generateLoveBar(percentage) {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  return `\`${filledBar}${emptyBar}\` ${percentage}%`;
}

function getVerdict(percentage) {
  if (percentage >= 90) return '💕 Perfect Match!';
  if (percentage >= 70) return '💖 Great Match!';
  if (percentage >= 50) return '💗 Good Match!';
  if (percentage >= 30) return '💔 Not Great...';
  return '💀 No Chance!';
}
