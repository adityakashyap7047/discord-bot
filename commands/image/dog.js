const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Get a random dog image'),
  cooldown: 3,
  async execute(message, args, client) {
    try {
      const res = await fetch('https://dog.ceo/api/breeds/image/random');
      if (!res.ok) throw new Error('API returned ' + res.status);
      const data = await res.json();

      const captions = [
        'Woof! Here\'s a good boy!',
        'Such doge. Much wow.',
        'Who\'s a good boy? YOU ARE!',
        'Bork bork!',
        'Maximum tail wagging detected!',
        'Pawsitively adorable!',
      ];
      const caption = captions[Math.floor(Math.random() * captions.length)];

      const breed = data.message.split('/')[4] || 'Unknown';

      const embed = new EmbedBuilder()
        .setColor(0xD2691E)
        .setTitle('🐶 Random Dog')
        .setDescription(caption)
        .setImage(data.message)
        .setFooter({ text: `Breed: ${breed.replace(/-/g, ' ')}` })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[DOG ERROR]', e);
      message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('Failed to fetch a dog image. Try again later!')] }).catch(() => {});
    }
  },
};
