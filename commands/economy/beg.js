const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEconomy, updateEconomy } = require('../../utils/database');

const responses = [
  'A kind stranger gives you', 'Someone drops', 'A rich player tosses you',
  'You find', 'A merchant gifts you', 'A ghost haunts you and leaves',
  'You stumble upon', 'A fairy blesses you with',
];

module.exports = {
  data: new SlashCommandBuilder().setName('beg').setDescription('Beg for coins'),
  cooldown: 5,
  async execute(message, args, client) {
    const eco = await getEconomy(message.guild.id, message.author.id);
    const now = Date.now();
    const cooldown = 15 * 60 * 1000;
    if (eco.lastBeg && now - eco.lastBeg < cooldown) {
      const remaining = Math.ceil((cooldown - (now - eco.lastBeg)) / 60000);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Beg Cooldown').setDescription(`Wait **${remaining}m** before begging again.`)] });
    }
    const chance = Math.random();
    if (chance < 0.3) {
      await updateEconomy(message.guild.id, message.author.id, { lastBeg: now });
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('😢 Nobody cares...').setDescription('You beg but nobody gives you anything. Try again later!')] });
    }
    const earned = Math.floor(Math.random() * 200) + 10;
    await updateEconomy(message.guild.id, message.author.id, { wallet: (eco.wallet || 0) + earned, lastBeg: now });
    const resp = responses[Math.floor(Math.random() * responses.length)];
    const embed = new EmbedBuilder()
      .setColor(0xeab308)
      .setTitle('🙏 You Begged!')
      .setDescription(`${resp} **${earned.toLocaleString()}** coins!`)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
