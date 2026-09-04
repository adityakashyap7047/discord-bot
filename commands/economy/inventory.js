const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const SHOP_ITEMS = [
  { id: 'lucky_charm', name: 'Lucky Charm', emoji: '🎰', price: 1000, description: 'Increases your luck in games and gambles' },
  { id: 'shield', name: 'Shield', emoji: '🛡️', price: 2000, description: 'Protects you from one robbery attempt' },
  { id: 'disguise_kit', name: 'Disguise Kit', emoji: '🎭', price: 1500, description: 'Makes you harder to rob' },
  { id: 'speed_boost', name: 'Speed Boost', emoji: '⚡', price: 800, description: 'Reduces work cooldown by 50%' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', price: 5000, description: 'A rare precious gem that shows your status' },
  { id: 'mystery_box', name: 'Mystery Box', emoji: '🎁', price: 3000, description: 'Contains a random reward worth 1000-5000 coins' },
];

function getInventory(client, guildId, userId) {
  const db = client.db.loadDB();
  if (!db.inventories) db.inventories = [];
  let entry = db.inventories.find(e => e.guildId === guildId && e.userId === userId);
  if (!entry) {
    entry = { guildId, userId, items: {} };
    db.inventories.push(entry);
    client.db.saveDB(db);
  }
  return entry;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your or another user\'s inventory')
    .addUserOption(opt => opt.setName('user').setDescription('User to check inventory of')),
  cooldown: 3,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    let target;
    if (isSlash) {
      target = source.options.getUser('user') || source.user;
    } else {
      target = source.mentions.users.first() || source.author;
    }

    const inventory = getInventory(client, guild.id, target.id);
    const items = inventory.items || {};

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`📦 ${target.username}'s Inventory`)
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();

    const entries = Object.entries(items).filter(([, qty]) => qty > 0);

    if (entries.length === 0) {
      embed.setDescription('This inventory is empty. Visit the shop with `/shop` or `!shop`!');
    } else {
      const lines = entries.map(([itemId, qty]) => {
        const shopItem = SHOP_ITEMS.find(i => i.id === itemId);
        if (shopItem) {
          return `${shopItem.emoji} **${shopItem.name}** — x${qty}`;
        }
        return `❓ **${itemId}** — x${qty}`;
      });
      embed.setDescription(lines.join('\n'));
      embed.setFooter({ text: `${entries.length} item type(s) • ${Object.values(items).reduce((a, b) => a + b, 0)} total items` });
    }

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
