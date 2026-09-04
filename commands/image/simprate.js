const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simprate')
    .setDescription('Check how much of a simp someone is')
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
      const bar = '█'.repeat(filled) + '░'.repeat(empty);

      let verdict;
      if (percent === 0) verdict = 'Not a simp. Respect.';
      else if (percent < 20) verdict = 'A little flirty, but keeping it cool.';
      else if (percent < 40) verdict = 'Getting awfully friendly there...';
      else if (percent < 60) verdict = 'Definite simp territory. You know what you\'re doing.';
      else if (percent < 80) verdict = 'Hopeless simp. There\'s no coming back.';
      else if (percent < 100) verdict = 'World-class simp. Professional level.';
      else verdict = 'MAXIMUM SIMP ACHIEVED! Touch grass!';

      const embed = new EmbedBuilder()
        .setColor(0xFF1493)
        .setTitle('💘 Simp Rate')
        .setDescription(`**${user.username}** is **${percent}%** simp!`)
        .addFields(
          { name: 'Simp Meter', value: `\`\`\`${bar}\`\`\`` },
          { name: 'Verdict', value: verdict },
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[SIMPRATE ERROR]', e);
      message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('Failed to calculate simp level. Try again!')] }).catch(() => {});
    }
  },
};
