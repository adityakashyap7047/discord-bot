const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Get a random meme from Reddit'),
  cooldown: 3,
  async execute(message, args, client) {
    try {
      const res = await fetch('https://meme-api.com/gimme');
      if (!res.ok) throw new Error('API returned ' + res.status);
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle(data.title || 'Random Meme')
        .setImage(data.url)
        .setFooter({ text: `👍 ${data.ups || 0} | Posted by u/${data.author || 'unknown'} in r/${data.subreddit || 'memes'}` })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[MEME ERROR]', e);
      const fallback = [
        'When the code works on the first try...',
        'Debugging is like being a detective in a crime movie where you are also the murderer.',
        'There are 10 types of people: those who understand binary and those who don\'t.',
        'I don\'t always test my code, but when I do, I do it in production.',
        '99 little bugs in the code, 99 little bugs. Take one down, patch it around... 127 little bugs in the code.',
      ];
      const text = fallback[Math.floor(Math.random() * fallback.length)];
      const embed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle('🤣 Dev Meme')
        .setDescription(text);
      message.reply({ embeds: [embed] }).catch(() => {});
    }
  },
};
