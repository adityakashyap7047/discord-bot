const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const definitions = [
  { word: 'Algorithm', def: 'A word used by programmers when they don\'t want to explain what they did.', example: 'I used an algorithm to solve it.' },
  { word: 'Bug', def: 'An error in code. Originally called a moth found in a computer in 1947.', example: 'The bug crashed the entire server.' },
  { word: 'Coffee', def: 'The fuel that powers all programmers. Without it, no code would exist.', example: 'I need more coffee to fix this bug.' },
  { word: 'Deadline', def: 'A magical date that makes code work at the last possible second.', example: 'The deadline is tomorrow, pray for me.' },
  { word: 'Debugging', def: 'The art of finding a needle in a haystack made of your own code.', example: 'I\'ve been debugging for 6 hours straight.' },
  { word: 'Full Stack', def: 'Someone who can break the entire application in multiple ways.', example: 'He\'s a full stack developer, he breaks everything.' },
  { word: 'Git Push', def: 'The act of sending your broken code to production and hoping for the best.', example: 'git push origin main --force' },
  { word: 'Hacker', def: 'Someone who solves problems you didn\'t know you had in ways you don\'t understand.', example: 'He\'s a real hacker, not the movie kind.' },
  { word: 'Junior Developer', def: 'A person who writes code that a senior developer will rewrite.', example: 'The junior developer said it works on his machine.' },
  { word: 'Legacy Code', def: 'Code that was written before you joined, that nobody dares to touch.', example: 'Don\'t touch the legacy code, it will break everything.' },
  { word: 'Production', def: 'The environment where users find bugs that QA missed.', example: 'We just deployed to production, hold my beer.' },
  { word: 'Refactor', def: 'Changing code that works into code that might work differently.', example: 'Let me refactor this real quick.' },
  { word: 'Stack Overflow', def: 'The real compiler of every developer. Copy, paste, pray.', example: 'Let me check Stack Overflow real quick.' },
  { word: 'WhatsApp University', def: 'Where 90% of developers learned to code.', example: 'I graduated from WhatsApp University.' },
  { word: 'It Works on My Machine', def: 'The universal developer excuse when code fails in production.', example: 'It works on my machine, I don\'t know what\'s wrong.' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('urban')
    .setDescription('Look up a fake urban dictionary entry')
    .addStringOption(opt => opt.setName('word').setDescription('Word to look up').setRequired(false)),
  cooldown: 3,
  async execute(message, args, client) {
    const query = args.join(' ').toLowerCase();
    let entry;
    if (query) {
      entry = definitions.find(d => d.word.toLowerCase().includes(query));
      if (!entry) entry = definitions[Math.floor(Math.random() * definitions.length)];
    } else {
      entry = definitions[Math.floor(Math.random() * definitions.length)];
    }

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle(`📖 ${entry.word}`)
      .setDescription(entry.def)
      .addFields({ name: 'Example', value: `\`${entry.example}\`` })
      .setFooter({ text: 'Urban Dictionary (Programmer Edition)' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
