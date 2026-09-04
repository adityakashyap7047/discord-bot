const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const scenarios = [
  { a: 'Be able to fly', b: 'Be able to be invisible' },
  { a: 'Have unlimited money', b: 'Have unlimited time' },
  { a: 'Live in the past', b: 'Live in the future' },
  { a: 'Be famous', b: 'Be rich' },
  { a: 'Read minds', b: 'Control time' },
  { a: 'Have super strength', b: 'Have super speed' },
  { a: 'Never age', b: 'Never get sick' },
  { a: 'Live without music', b: 'Live without movies' },
  { a: 'Always be too hot', b: 'Always be too cold' },
  { a: 'Have a rewind button', b: 'Have a pause button' },
  { a: 'Be a superhero', b: 'Be a supervillain' },
  { a: 'Have more time', b: 'Have more money' },
];

module.exports = {
  data: new SlashCommandBuilder().setName('wouldyourather').setDescription('Would you rather...?'),
  cooldown: 5,
  async execute(message, args, client) {
    const s = scenarios[Math.floor(Math.random() * scenarios.length)];
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('🤔 Would You Rather?')
      .addFields(
        { name: '🅰️ Option A', value: s.a, inline: true },
        { name: '🅱️ Option B', value: s.b, inline: true },
      )
      .setFooter({ text: 'React with 🅰️ or 🅱️ to vote!' })
      .setTimestamp();
    const msg = await message.reply({ embeds: [embed] });
    await msg.react('🅰️');
    await msg.react('🅱️');
  },
};
