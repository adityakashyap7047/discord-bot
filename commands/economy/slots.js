const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Play the slot machine')
    .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    const db = client.db;
    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Invalid Bet').setDescription('Enter a valid bet amount.')] });
    const key = `${message.guild.id}_${message.author.id}`;
    const economy = db.get('economy') || {};
    const userData = economy[key] || { balance: 0, bank: 0 };
    if (userData.balance < bet) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Insufficient Funds').setDescription(`You need **${bet.toLocaleString()}** in your wallet.`)] });
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];
    let multiplier = 0;
    if (s1 === s2 && s2 === s3) multiplier = s1 === '💎' ? 10 : s1 === '7️⃣' ? 7 : 5;
    else if (s1 === s2 || s2 === s3 || s1 === s3) multiplier = 2;
    const winnings = bet * multiplier;
    userData.balance += winnings - bet;
    economy[key] = userData;
    db.set('economy', economy);
    const result = `**[ ${s1} | ${s2} | ${s3} ]**`;
    const embed = new EmbedBuilder()
      .setColor(multiplier > 0 ? 0x22c55e : 0xff0000)
      .setTitle(multiplier > 0 ? '🎰 You Won!' : '🎰 You Lost!')
      .setDescription(result)
      .addFields({ name: multiplier > 0 ? '💰 Won' : '💸 Lost', value: `${(multiplier > 0 ? winnings : bet).toLocaleString()} coins`, inline: true });
    if (multiplier >= 5) embed.addFields({ name: '🎉 JACKPOT', value: `**${multiplier}x multiplier!**`, inline: false });
    message.reply({ embeds: [embed] });
  },
};
