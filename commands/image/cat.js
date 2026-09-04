const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Get a random cat image'),
  cooldown: 3,
  async execute(message, args, client) {
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      if (!res.ok) throw new Error('API returned ' + res.status);
      const data = await res.json();
      const cat = data[0];

      const captions = [
        'Meow! Here\'s a cute kitty for you!',
        'Purrfect!',
        'Whiskers approved!',
        'A cat has appeared!',
        'So cute it hurts!',
        'Maximum fluffiness achieved!',
      ];
      const caption = captions[Math.floor(Math.random() * captions.length)];

      const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle('🐱 Random Cat')
        .setDescription(caption)
        .setImage(cat.url)
        .setFooter({ text: `ID: ${cat.id}` })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[CAT ERROR]', e);
      message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('Failed to fetch a cat image. Try again later!')] }).catch(() => {});
    }
  },
};
