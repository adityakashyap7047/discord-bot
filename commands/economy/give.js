const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give coins to another user')
    .addUserOption(opt => opt.setName('user').setDescription('User to give coins to').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to give').setRequired(true)),
  cooldown: 5,
  async execute(message, args, client) {
    const db = client.db;
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ No User').setDescription('Mention a user to give coins to.')] });
    if (target.id === message.author.id) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Self-Transfer').setDescription('You cannot give coins to yourself!')] });
    if (target.bot) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Bots').setDescription('You cannot give coins to bots!')] });
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Invalid Amount').setDescription('Enter a valid number.')] });
    const economy = db.get('economy') || {};
    const senderKey = `${message.guild.id}_${message.author.id}`;
    const receiverKey = `${message.guild.id}_${target.id}`;
    const sender = economy[senderKey] || { balance: 0, bank: 0 };
    const receiver = economy[receiverKey] || { balance: 0, bank: 0 };
    if (sender.balance < amount) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Insufficient Funds').setDescription(`You only have **${sender.balance.toLocaleString()}** in your wallet.`)] });
    sender.balance -= amount;
    receiver.balance += amount;
    economy[senderKey] = sender;
    economy[receiverKey] = receiver;
    db.set('economy', economy);
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('🤝 Transfer Complete!')
      .setDescription(`${message.author} gave **${amount.toLocaleString()}** coins to ${target}!`)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
