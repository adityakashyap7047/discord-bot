const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const SHOP_ITEMS = [
  { id: 'lucky_charm', name: 'Lucky Charm', emoji: '🎰', price: 1000, description: 'Increases your luck in games and gambles' },
  { id: 'shield', name: 'Shield', emoji: '🛡️', price: 2000, description: 'Protects you from one robbery attempt' },
  { id: 'disguise_kit', name: 'Disguise Kit', emoji: '🎭', price: 1500, description: 'Makes you harder to rob' },
  { id: 'speed_boost', name: 'Speed Boost', emoji: '⚡', price: 800, description: 'Reduces work cooldown by 50%' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', price: 5000, description: 'A rare precious gem that shows your status' },
  { id: 'mystery_box', name: 'Mystery Box', emoji: '🎁', price: 3000, description: 'Contains a random reward worth 1000-5000 coins' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View the item shop'),
  cooldown: 3,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🛒 Item Shop')
      .setDescription('Use `/buy` or `!buy` to purchase items.\n\n' +
        SHOP_ITEMS.map(item =>
          `${item.emoji} **${item.name}** — ${item.price.toLocaleString()} coins\n> ${item.description}`
        ).join('\n\n'))
      .setFooter({ text: 'Use buy <item> <quantity> to purchase' })
      .setTimestamp();

    source.reply({ embeds: [embed] }).catch(() => {});
  },
  SHOP_ITEMS,
};
