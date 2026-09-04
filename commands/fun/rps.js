const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock Paper Scissors')
    .addStringOption(opt =>
      opt.setName('choice').setDescription('Your choice').setRequired(true)
        .addChoices({ name: 'Rock', value: 'rock' }, { name: 'Paper', value: 'paper' }, { name: 'Scissors', value: 'scissors' })
    ),
  cooldown: 3,
  async execute(message, args, client) {
    const isSlash = message.isChatInputCommand;
    const choice = isSlash ? message.options.getString('choice') : (args[0] || '').toLowerCase();
    const valid = ['rock', 'paper', 'scissors'];
    if (!valid.includes(choice)) return message.reply({ embeds: [require('../../utils/helpers').errorEmbed('Error', 'Pick `rock`, `paper`, or `scissors`.')] });

    const botChoice = valid[Math.floor(Math.random() * 3)];
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    let result;
    if (choice === botChoice) result = "It's a tie! 🤝";
    else if ((choice === 'rock' && botChoice === 'scissors') || (choice === 'paper' && botChoice === 'rock') || (choice === 'scissors' && botChoice === 'paper')) result = 'You win! 🎉';
    else result = 'I win! 🤖';

    const embed = new EmbedBuilder()
      .setColor(result.includes('win! 🎉') ? 0x22c55e : result.includes('I win') ? 0xef4444 : 0xeab308)
      .setTitle('Rock Paper Scissors')
      .addFields(
        { name: 'Your Choice', value: `${emojis[choice]} ${choice.charAt(0).toUpperCase() + choice.slice(1)}`, inline: true },
        { name: 'My Choice', value: `${emojis[botChoice]} ${botChoice.charAt(0).toUpperCase() + botChoice.slice(1)}`, inline: true },
        { name: 'Result', value: result, inline: false }
      );
    message.reply({ embeds: [embed] });
  },
};
