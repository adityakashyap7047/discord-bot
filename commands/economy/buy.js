const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const SHOP_ITEMS = [
  { id: 'lucky_charm', name: 'Lucky Charm', emoji: '🎰', price: 1000, description: 'Increases your luck in games and gambles' },
  { id: 'shield', name: 'Shield', emoji: '🛡️', price: 2000, description: 'Protects you from one robbery attempt' },
  { id: 'disguise_kit', name: 'Disguise Kit', emoji: '🎭', price: 1500, description: 'Makes you harder to rob' },
  { id: 'speed_boost', name: 'Speed Boost', emoji: '⚡', price: 800, description: 'Reduces work cooldown by 50%' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', price: 5000, description: 'A rare precious gem that shows your status' },
  { id: 'mystery_box', name: 'Mystery Box', emoji: '🎁', price: 3000, description: 'Contains a random reward worth 1000-5000 coins' },
];

function getEconomy(client, guildId, userId) {
  const db = client.db.loadDB();
  if (!db.economy) db.economy = [];
  let entry = db.economy.find(e => e.guildId === guildId && e.userId === userId);
  if (!entry) {
    entry = { guildId, userId, wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, lastRob: 0 };
    db.economy.push(entry);
    client.db.saveDB(db);
  }
  if (entry.lastDaily === undefined) entry.lastDaily = 0;
  if (entry.lastWork === undefined) entry.lastWork = 0;
  if (entry.lastRob === undefined) entry.lastRob = 0;
  return entry;
}

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

function findItem(query) {
  const q = query.toLowerCase().replace(/ /g, '_');
  return SHOP_ITEMS.find(item => item.id === q || item.name.toLowerCase() === query.toLowerCase());
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop')
    .addStringOption(opt => opt.setName('item').setDescription('Item name to buy').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantity').setDescription('Quantity to buy (default: 1)').setMinValue(1)),
  cooldown: 3,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    const user = isSlash ? source.user : source.author;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    let itemName, quantity;
    if (isSlash) {
      itemName = source.options.getString('item');
      quantity = source.options.getInteger('quantity') || 1;
    } else {
      itemName = arg2[0];
      quantity = parseInt(arg2[1]) || 1;
    }

    if (!itemName) {
      return source.reply({ content: 'Please specify an item to buy. Use `/shop` or `!shop` to see available items.', ephemeral: true }).catch(() => {});
    }

    const item = findItem(itemName);
    if (!item) {
      const list = SHOP_ITEMS.map(i => `${i.emoji} ${i.name}`).join(', ');
      return source.reply({ content: `❌ Item not found. Available items: ${list}`, ephemeral: true }).catch(() => {});
    }

    const totalCost = item.price * quantity;
    const economy = getEconomy(client, guild.id, user.id);

    if (economy.wallet < totalCost) {
      return source.reply({
        content: `❌ You need **${totalCost.toLocaleString()}** coins but only have **${economy.wallet.toLocaleString()}** in your wallet.`,
        ephemeral: true,
      }).catch(() => {});
    }

    economy.wallet -= totalCost;
    const inventory = getInventory(client, guild.id, user.id);
    inventory.items[item.id] = (inventory.items[item.id] || 0) + quantity;

    const db = client.db.loadDB();
    client.db.saveDB(db);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('🛒 Purchase Successful!')
      .setDescription(`You bought **${quantity}x ${item.emoji} ${item.name}** for **${totalCost.toLocaleString()}** coins!`)
      .addFields(
        { name: '💰 Wallet', value: `${economy.wallet.toLocaleString()} coins`, inline: true },
        { name: '📦 Item', value: `${item.emoji} ${item.name} x${quantity}`, inline: true },
      )
      .setTimestamp();

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
