const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEconomy, updateEconomy } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give coins to another user')
    .addUserOption(opt => opt.setName('user').setDescription('User to give coins to').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to give').setRequired(true)),
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ No User').setDescription('Mention a user to give coins to.')] });
    if (target.id === message.author.id) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Self-Transfer').setDescription('You cannot give coins to yourself!')] });
    if (target.bot) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Bots').setDescription('You cannot give coins to bots!')] });
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Invalid Amount').setDescription('Enter a valid number.')] });
    const sender = await getEconomy(message.guild.id, message.author.id);
    const receiver = await getEconomy(message.guild.id, target.id);
    if ((sender.wallet || 0) < amount) return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Insufficient Funds').setDescription(`You only have **${(sender.wallet || 0).toLocaleString()}** in your wallet.`)] });
    await updateEconomy(message.guild.id, message.author.id, { wallet: (sender.wallet || 0) - amount });
    await updateEconomy(message.guild.id, target.id, { wallet: (receiver.wallet || 0) + amount });
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('🤝 Transfer Complete!')
      .setDescription(`${message.author} gave **${amount.toLocaleString()}** coins to ${target}!`)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
