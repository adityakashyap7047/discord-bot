const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const fonts = {
  bubbles: (text) => {
    const map = { a: '🅐', b: '🅑', c: '🅒', d: '🅓', e: '🅔', f: '🅕', g: '🅖', h: '🅗', i: '🅘', j: '🅙', k: '🅚', l: '🅛', m: '🅜', n: '🅝', o: '🅞', p: '🅟', q: ' q', r: '🅡', s: '🅢', t: '🅣', u: '🅤', v: '🅥', w: '🅦', x: '🅧', y: '🅨', z: '🅩', ' ': ' ' };
    return text.toLowerCase().split('').map(c => map[c] || c).join('');
  },
  width: (text) => {
    const map = { a: 'ａ', b: 'ｂ', c: 'ｃ', d: 'ｄ', e: 'ｅ', f: 'ｆ', g: 'ｇ', h: 'ｈ', i: 'ｉ', j: 'ｊ', k: 'ｋ', l: 'ｌ', m: 'ｍ', n: 'ｎ', o: 'ｏ', p: 'ｐ', q: 'ｑ', r: 'ｒ', s: 'ｓ', t: 'ｔ', u: 'ｕ', v: 'ｖ', w: 'ｗ', x: 'ｘ', y: 'ｙ', z: 'ｚ' };
    return text.toLowerCase().split('').map(c => map[c] || c).join('');
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ascii')
    .setDescription('Convert text to fancy unicode')
    .addStringOption(opt => opt.setName('text').setDescription('Text to convert').setRequired(true))
    .addStringOption(opt => opt.setName('font').setDescription('Font style').addChoices({ name: 'Bubbles', value: 'bubbles' }, { name: 'Width', value: 'width' })),
  cooldown: 2,
  async execute(message, args, client) {
    const text = args[0] || 'Hello';
    const font = args[1] || 'bubbles';
    const converter = fonts[font] || fonts.bubbles;
    const result = converter(text);
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('✨ Fancy Text')
      .setDescription(result)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
