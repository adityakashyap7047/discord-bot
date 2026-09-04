const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const dictionaries = {
  es: {
    hello: 'hola', goodbye: 'adiós', thank: 'gracias', please: 'por favor',
    yes: 'sí', no: 'no', good: 'bueno', bad: 'malo', love: 'amor',
    friend: 'amigo', water: 'agua', food: 'comida', day: 'día',
    night: 'noche', morning: 'mañana', world: 'mundo', life: 'vida',
    happy: 'feliz', sad: 'triste', beautiful: 'hermoso', big: 'grande',
    small: 'pequeño', house: 'casa', car: 'coche', book: 'libro',
    cat: 'gato', dog: 'perro', time: 'tiempo', today: 'hoy',
    tomorrow: 'mañana', always: 'siempre', never: 'nunca',
  },
  fr: {
    hello: 'bonjour', goodbye: 'au revoir', thank: 'merci', please: 's\'il vous plaît',
    yes: 'oui', no: 'non', good: 'bon', bad: 'mauvais', love: 'amour',
    friend: 'ami', water: 'eau', food: 'nourriture', day: 'jour',
    night: 'nuit', morning: 'matin', world: 'monde', life: 'vie',
    happy: 'heureux', sad: 'triste', beautiful: 'beau', big: 'grand',
    small: 'petit', house: 'maison', car: 'voiture', book: 'livre',
    cat: 'chat', dog: 'chien', time: 'temps', today: 'aujourd\'hui',
    tomorrow: 'demain', always: 'toujours', never: 'jamais',
  },
  de: {
    hello: 'hallo', goodbye: 'auf wiedersehen', thank: 'danke', please: 'bitte',
    yes: 'ja', no: 'nein', good: 'gut', bad: 'schlecht', love: 'liebe',
    friend: 'freund', water: 'wasser', food: 'essen', day: 'tag',
    night: 'nacht', morning: 'morgen', world: 'welt', life: 'leben',
    happy: 'glücklich', sad: 'traurig', beautiful: 'schön', big: 'groß',
    small: 'klein', house: 'haus', car: 'auto', book: 'buch',
    cat: 'katze', dog: 'hund', time: 'zeit', today: 'heute',
    tomorrow: 'morgen', always: 'immer', never: 'niemals',
  },
  ja: {
    hello: 'こんにちは', goodbye: 'さようなら', thank: 'ありがとう', please: 'お願いします',
    yes: 'はい', no: 'いいえ', good: '良い', bad: '悪い', love: '愛',
    friend: '友達', water: '水', food: '食べ物', day: '日',
    night: '夜', morning: '朝', world: '世界', life: '人生',
    happy: '幸せ', sad: '悲しい', beautiful: '美しい', big: '大きい',
    small: '小さい', house: '家', car: '車', book: '本',
    cat: '猫', dog: '犬', time: '時間', today: '今日',
    tomorrow: '明日', always: 'いつも', never: '決して',
  },
  ko: {
    hello: '안녕하세요', goodbye: '안녕히 가세요', thank: '감사합니다', please: '부탁합니다',
    yes: '네', no: '아니요', good: '좋은', bad: '나쁜', love: '사랑',
    friend: '친구', water: '물', food: '음식', day: '날',
    night: '밤', morning: '아침', world: '세계', life: '인생',
    happy: '행복한', sad: '슬픈', beautiful: '아름다운', big: '큰',
    small: '작은', house: '집', car: '자동차', book: '책',
    cat: '고양이', dog: '개', time: '시간', today: '오늘',
    tomorrow: '내일', always: '항상', never: '절대',
  },
  pt: {
    hello: 'olá', goodbye: 'adeus', thank: 'obrigado', please: 'por favor',
    yes: 'sim', no: 'não', good: 'bom', bad: 'mau', love: 'amor',
    friend: 'amigo', water: 'água', food: 'comida', day: 'dia',
    night: 'noite', morning: 'manhã', world: 'mundo', life: 'vida',
    happy: 'feliz', sad: 'triste', beautiful: 'bonito', big: 'grande',
    small: 'pequeno', house: 'casa', car: 'carro', book: 'livro',
    cat: 'gato', dog: 'cachorro', time: 'tempo', today: 'hoje',
    tomorrow: 'amanhã', always: 'sempre', never: 'nunca',
  },
  es: {
    hello: 'hola', goodbye: 'adiós', thank: 'gracias', please: 'por favor',
    yes: 'sí', no: 'no', good: 'bueno', bad: 'malo', love: 'amor',
    friend: 'amigo', water: 'agua', food: 'comida', day: 'día',
    night: 'noche', morning: 'mañana', world: 'mundo', life: 'vida',
    happy: 'feliz', sad: 'triste', beautiful: 'hermoso', big: 'grande',
    small: 'pequeño', house: 'casa', car: 'coche', book: 'libro',
    cat: 'gato', dog: 'perro', time: 'tiempo', today: 'hoy',
    tomorrow: 'mañana', always: 'siempre', never: 'nunca',
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate words to another language')
    .addStringOption(opt => opt.setName('text').setDescription('Text to translate').setRequired(true))
    .addStringOption(opt =>
      opt.setName('to')
        .setDescription('Target language code')
        .setRequired(true)
        .addChoices(
          { name: 'Spanish (es)', value: 'es' },
          { name: 'French (fr)', value: 'fr' },
          { name: 'German (de)', value: 'de' },
          { name: 'Japanese (ja)', value: 'ja' },
          { name: 'Korean (ko)', value: 'ko' },
          { name: 'Portuguese (pt)', value: 'pt' },
        ),
    ),
  cooldown: 3,
  async execute(message, args, client) {
    const langIndex = args.findIndex(a => ['es', 'fr', 'de', 'ja', 'ko', 'pt'].includes(a.toLowerCase()));
    let targetLang;
    let text;

    if (langIndex !== -1) {
      targetLang = args[langIndex].toLowerCase();
      text = args.filter((_, i) => i !== langIndex).join(' ');
    } else {
      text = args.join(' ');
      targetLang = 'es';
    }

    if (!text) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Provide text to translate! Usage: `translate hello world to:es`')] });
    }

    const dict = dictionaries[targetLang];
    if (!dict) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription(`Unsupported language. Supported: ${Object.keys(dictionaries).join(', ')}`)] });
    }

    const words = text.toLowerCase().split(/\s+/);
    const translated = words.map(word => dict[word] || word).join(' ');

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('🌐 Translation')
      .addFields(
        { name: '📝 Original', value: text, inline: false },
        { name: `🔤 ${targetLang.toUpperCase()}`, value: translated, inline: false },
      )
      .setFooter({ text: 'Note: This uses a built-in word dictionary, not full translation.' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
