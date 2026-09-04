const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const jokes = [
  { q: 'Why do programmers prefer dark mode?', a: 'Because light attracts bugs!' },
  { q: 'Why do Java developers wear glasses?', a: 'Because they can\'t C#' },
  { q: 'What\'s a programmer\'s favorite hangout place?', a: 'Foo Bar!' },
  { q: 'Why was the JavaScript developer sad?', a: 'Because he didn\'t Node how to Express himself!' },
  { q: 'What do you call a group of 8 hobbits?', a: 'A hobbyte!' },
  { q: 'Why do programmers hate nature?', a: 'It has too many bugs.' },
  { q: 'What\'s the best thing about a Boolean?', a: 'Even if you\'re wrong, you\'re only off by a bit!' },
  { q: 'Why do Python programmers have low self-esteem?', a: 'They\'re constantly comparing themselves to others with ==.' },
  { q: 'How many programmers does it take to change a light bulb?', a: 'None, that\'s a hardware problem!' },
  { q: 'Why did the developer go broke?', a: 'Because he used up all his cache!' },
  { q: 'What\'s a computer\'s least favorite food?', a: 'Spam!' },
  { q: 'Why did the scarecrow win an award?', a: 'Because he was outstanding in his field!' },
  { q: 'What do you call a fake noodle?', a: 'An impasta!' },
  { q: 'Why don\'t scientists trust atoms?', a: 'Because they make up everything!' },
];

module.exports = {
  data: new SlashCommandBuilder().setName('joke').setDescription('Get a random joke'),
  cooldown: 2,
  async execute(message, args, client) {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('😂 Random Joke')
      .addFields(
        { name: '🤔', value: joke.q },
        { name: '😏', value: joke.a },
      )
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
