const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('howgay')
    .setDescription('Check how gay someone is')
    .addUserOption(opt => opt.setName('user').setDescription('User to check')),
  cooldown: 3,
  async execute(message, args, client) {
    try {
      let user;
      if (message.isChatInputCommand) {
        user = message.options.getUser('user') || message.user;
      } else {
        user = message.mentions.users.first() || message.author;
      }

      const percent = Math.floor(Math.random() * 101);
      const filled = Math.round(percent / 5);
      const empty = 20 - filled;
      const bar = 'gay'.repeat(filled).split('').map(() => '█').join('') + '░'.repeat(empty);

      let verdict;
      if (percent === 0) verdict = 'Not gay at all! Or... are you hiding something?';
      else if (percent < 20) verdict = 'A little curious, nothing wrong with that!';
      else if (percent < 40) verdict = 'Starting to sway there...';
      else if (percent < 60) verdict = 'Halfway there! Embrace it!';
      else if (percent < 80) verdict = 'Pretty gay. No turning back now!';
      else if (percent < 100) verdict = 'Super gay! Fabulous!';
      else verdict = 'MAXIMUM GAY ACHIEVED! 🌈';

      const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle('🌈 Gay Rate')
        .setDescription(`**${user.username}** is **${percent}%** gay!`)
        .addFields(
          { name: 'Gay Meter', value: `\`\`\`${bar}\`\`\`` },
          { name: 'Verdict', value: verdict },
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[HOWGAY ERROR]', e);
      message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('Failed to calculate. Try again!')] }).catch(() => {});
    }
  },
};
