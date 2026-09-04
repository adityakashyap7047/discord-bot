const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('waifu')
    .setDescription('Get a random SFW waifu image'),
  cooldown: 3,
  async execute(message, args, client) {
    try {
      const res = await fetch('https://api.waifu.pics/sfw/waifu');
      if (!res.ok) throw new Error('API returned ' + res.status);
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle('💕 Random Waifu')
        .setDescription('Here is your random waifu!')
        .setImage(data.url)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[WAIFU ERROR]', e);
      message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('Failed to fetch a waifu image. Try again later!')] }).catch(() => {});
    }
  },
};
