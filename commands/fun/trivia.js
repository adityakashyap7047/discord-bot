const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const questions = [
  { q: 'What planet is known as the Red Planet?', a: 'Mars', opts: ['Venus', 'Mars', 'Jupiter', 'Saturn'] },
  { q: 'What is the largest ocean on Earth?', a: 'Pacific', opts: ['Atlantic', 'Indian', 'Pacific', 'Arctic'] },
  { q: 'How many bones are in the human body?', a: '206', opts: ['186', '206', '216', '256'] },
  { q: 'What is the chemical symbol for gold?', a: 'Au', opts: ['Ag', 'Au', 'Go', 'Gd'] },
  { q: 'What year did World War II end?', a: '1945', opts: ['1943', '1944', '1945', '1946'] },
  { q: 'What is the speed of light in km/s?', a: '299,792', opts: ['199,792', '299,792', '399,792', '499,792'] },
  { q: 'Which planet has the most moons?', a: 'Saturn', opts: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'] },
  { q: 'What is the hardest natural substance?', a: 'Diamond', opts: ['Gold', 'Iron', 'Diamond', 'Titanium'] },
  { q: 'How many continents are there?', a: '7', opts: ['5', '6', '7', '8'] },
  { q: 'What gas do plants absorb?', a: 'Carbon Dioxide', opts: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'] },
  { q: 'What is the largest mammal?', a: 'Blue Whale', opts: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'] },
  { q: 'Who painted the Mona Lisa?', a: 'Leonardo da Vinci', opts: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'] },
  { q: 'What is the boiling point of water?', a: '100 C', opts: ['90 C', '100 C', '110 C', '120 C'] },
  { q: 'What language has the most native speakers?', a: 'Mandarin', opts: ['English', 'Spanish', 'Mandarin', 'Hindi'] },
  { q: 'What is the smallest prime number?', a: '2', opts: ['1', '2', '3', '5'] },
  { q: 'Which element has atomic number 1?', a: 'Hydrogen', opts: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'] },
  { q: 'How many days in a leap year?', a: '366', opts: ['364', '365', '366', '367'] },
  { q: 'What is the capital of Japan?', a: 'Tokyo', opts: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'] },
  { q: 'What planet is closest to the Sun?', a: 'Mercury', opts: ['Venus', 'Mercury', 'Mars', 'Earth'] },
  { q: 'What is the chemical formula for water?', a: 'H2O', opts: ['CO2', 'H2O', 'NaCl', 'O2'] },
];

module.exports = {
  data: new SlashCommandBuilder().setName('trivia').setDescription('Answer a trivia question'),
  cooldown: 5,
  async execute(message) {
    const q = questions[Math.floor(Math.random() * questions.length)];
    const shuffled = [...q.opts].sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.indexOf(q.a);

    const row = new ActionRowBuilder().addComponents(
      shuffled.map((opt, i) =>
        new ButtonBuilder().setCustomId(`trivia_${i}`).setLabel(opt).setStyle(ButtonStyle.Secondary)
      )
    );

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('🧠 Trivia')
      .setDescription(`**${q.q}**`)
      .setFooter({ text: 'You have 15 seconds to answer!' });

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 15000 });
    const answered = new Set();

    collector.on('collect', async (interaction) => {
      if (answered.has(interaction.user.id)) return interaction.reply({ content: 'You already answered!', ephemeral: true });
      answered.add(interaction.user.id);

      const index = parseInt(interaction.customId.split('_')[1]);
      const isCorrect = index === correctIndex;

      const disabledRow = new ActionRowBuilder().addComponents(
        shuffled.map((opt, i) =>
          new ButtonBuilder()
            .setCustomId(`trivia_${i}`)
            .setLabel(opt)
            .setStyle(i === correctIndex ? ButtonStyle.Success : i === index && !isCorrect ? ButtonStyle.Danger : ButtonStyle.Secondary)
            .setDisabled(true)
        )
      );

      await interaction.update({
        embeds: [EmbedBuilder.from(embed).setColor(isCorrect ? 0x22c55e : 0xef4444).setFooter({ text: isCorrect ? `${interaction.user.tag} got it right!` : `${interaction.user.tag} got it wrong! The answer was: ${q.a}` })],
        components: [disabledRow],
      });
    });

    collector.on('end', () => { msg.edit({ components: [] }).catch(() => {}); });
  },
};
