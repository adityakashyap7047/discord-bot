const { SlashCommandBuilder } = require('discord.js');

const roasts = [
  "You're the reason God created the middle finger.",
  "If you were any more inbred, you'd be a sandwich.",
  "You're a few fries short of a Happy Meal.",
  "I'd agree with you, but then we'd both be wrong.",
  "You bring everyone a lot of joy... when you leave.",
  "I'm jealous of people who don't know you.",
  "You're like a cloud. When you disappear, it's a beautiful day.",
  "You're proof that even evolution has hiccups.",
  "I'd explain it to you, but I left my English-to-Dumb dictionary at home.",
  "You're the human version of a participation trophy.",
  "Somewhere out there, a tree is producing oxygen for you. I'm sorry, tree.",
  "You're like a Monday morning. Nobody likes you.",
  "If stupid was a sport, you'd be an Olympic gold medalist.",
  "I'm not saying you're stupid, but you have a bad case of the not-smarts.",
  "You're the reason I prefer animals.",
  "Your village called. They want their idiot back.",
  "I'd tell you to go to hell, but I work there and I don't want to see you every day.",
  "You're so dense, light bends around you.",
  "I'm not saying you're ugly, but you're the reason God created the word 'unfortunately'.",
  "If looks could kill, you'd be a weapon of mass destruction.",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Roast a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to roast').setRequired(false)),
  cooldown: 3,
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    message.reply(`🔥 **${user.username}**, ${roast}`);
  },
};
