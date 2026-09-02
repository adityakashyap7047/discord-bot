const { SlashCommandBuilder } = require('discord.js');

const responses = [
  'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes - definitely.',
  'You may rely on it.', 'As I see it, yes.', 'Most likely.', 'Outlook good.',
  'Yes.', 'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
  'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
  'Don\'t count on it.', 'My reply is no.', 'My sources say no.',
  'Outlook not so good.', 'Very doubtful.',
];

module.exports = {
  data: new SlashCommandBuilder().setName('8ball').setDescription('Magic 8-ball')
    .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    const question = args.join(' ');
    if (!question) return message.reply('Ask a question!');
    const response = responses[Math.floor(Math.random() * responses.length)];
    message.reply(`🎱 **Question:** ${question}\n**Answer:** ${response}`);
  },
};
