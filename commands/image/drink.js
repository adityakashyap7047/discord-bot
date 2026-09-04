const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const drinks = [
  { name: 'Matcha Latte', emoji: '🍵', desc: 'A calming green tea latte. Perfect for quiet moments.' },
  { name: 'Mango Smoothie', emoji: '🥭', desc: 'Tropical and refreshing. Like a vacation in a cup.' },
  { name: 'Iced Americano', emoji: '☕', desc: 'Bold, strong, and gets the job done. No nonsense coffee.' },
  { name: 'Strawberry Milkshake', emoji: '🍓', desc: 'Sweet, creamy, and nostalgic. Pure comfort in a glass.' },
  { name: 'Bubble Tea', emoji: '🧋', desc: 'Chewy boba, sweet tea. A textural adventure!' },
  { name: 'Lemonade', emoji: '🍋', desc: 'Tangy and refreshing. The classic summer cooler.' },
  { name: 'Hot Chocolate', emoji: '🍫', desc: 'Warm, rich, and cozy. Hug in a mug.' },
  { name: 'Blue Lagoon', emoji: '🫐', desc: 'A vibrant blue cocktail. Looks as good as it tastes.' },
  { name: 'Water', emoji: '💧', desc: 'Hydration is key. Stay healthy!' },
  { name: 'Energy Drink', emoji: '⚡', desc: 'Zoom zoom! Warning: may cause spontaneous productivity.' },
  { name: 'Piña Colada', emoji: '🍍', desc: 'Getting caught in the rain with this tropical delight.' },
  { name: 'Espresso Martini', emoji: '🍸', desc: 'Coffee meets cocktail. The best of both worlds.' },
  { name: 'Green Juice', emoji: '🥬', desc: 'Healthy and cleansing. Your body will thank you.' },
  { name: 'Root Beer Float', emoji: '🍺', desc: 'Ice cream meets soda. A timeless classic.' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('drink')
    .setDescription('Get a random drink recommendation'),
  cooldown: 3,
  async execute(message, args, client) {
    try {
      const drink = drinks[Math.floor(Math.random() * drinks.length)];

      const embed = new EmbedBuilder()
        .setColor(0x00BFFF)
        .setTitle(`${drink.emoji} Drink Recommendation`)
        .setDescription(`**${drink.name}**\n\n${drink.desc}`)
        .setFooter({ text: 'Enjoy your drink!' })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[DRINK ERROR]', e);
      message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('Failed to recommend a drink. Try again!')] }).catch(() => {});
    }
  },
};
