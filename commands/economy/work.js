const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const jobs = [
  { job: 'Pizza Delivery Driver', emoji: '🍕', min: 100, max: 350, text: 'Delivered 15 pizzas in a thunderstorm. Your dedication is unmatched!' },
  { job: 'Freelance Coder', emoji: '💻', min: 200, max: 500, text: 'Fixed a critical production bug at 3 AM. The client is thrilled!' },
  { job: 'Street Artist', emoji: '🎨', min: 150, max: 400, text: 'Painted a stunning mural downtown. Tourists loved it!' },
  { job: 'Office Cleaner', emoji: '🧹', min: 100, max: 300, text: 'Cleaned up after the holiday party. Found some interesting things!' },
  { job: 'Dog Walker', emoji: '🐕', min: 150, max: 350, text: 'Walked 5 energetic dogs at once. What an adventure!' },
  { job: 'Warehouse Worker', emoji: '📦', min: 200, max: 450, text: 'Packed 200 orders before the deadline. Efficiency champion!' },
  { job: 'Game Tester', emoji: '🎮', min: 250, max: 500, text: 'Found 10 game-breaking bugs. The devs owe you one!' },
  { job: 'Ride-Share Driver', emoji: '🚗', min: 150, max: 400, text: 'Dropped off a VIP at the airport. Got a generous tip!' },
  { job: 'Personal Trainer', emoji: '🏋️', min: 200, max: 500, text: 'Trained a celebrity for their movie role. They nailed it!' },
  { job: 'Event Photographer', emoji: '📸', min: 200, max: 450, text: 'Shot an entire wedding in the rain. Every photo was perfect!' },
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work a job to earn coins'),
  cooldown: 10,
  async execute(source, arg2, arg3) {
    const isSlash = typeof source.isChatInputCommand === 'function';
    const client = isSlash ? arg2 : arg3;
    const guild = source.guild;
    const user = isSlash ? source.user : source.author;
    if (!guild) return source.reply({ content: 'This command can only be used in a server.', ephemeral: true }).catch(() => {});

    const data = getEconomy(client, guild.id, user.id);
    const now = Date.now();
    const cooldown = 30 * 60 * 1000;

    if (data.lastWork && now - data.lastWork < cooldown) {
      const remaining = cooldown - (now - data.lastWork);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Work Cooldown')
        .setDescription(`Rest a bit! Come back in **${minutes}m ${seconds}s**.`);
      return source.reply({ embeds: [embed] }).catch(() => {});
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
    data.wallet += earned;
    data.lastWork = now;

    const db = client.db.loadDB();
    client.db.saveDB(db);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle(`${job.emoji} Work Complete!`)
      .setDescription(`You worked as a **${job.job}** and earned **${earned.toLocaleString()}** coins!\n\n> ${job.text}`)
      .addFields(
        { name: '💰 Wallet', value: `${data.wallet.toLocaleString()} coins`, inline: true },
      )
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    source.reply({ embeds: [embed] }).catch(() => {});
  },
};
