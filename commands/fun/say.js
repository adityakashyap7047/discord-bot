const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('say').setDescription('Make the bot say something')
    .addStringOption(opt => opt.setName('text').setDescription('Text to say').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    const text = args.join(' ');
    if (!text) return message.reply('Say something!');
    message.delete().catch(() => {});
    message.channel.send(text);
  },
};
