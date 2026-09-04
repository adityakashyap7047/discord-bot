const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rate')
    .setDescription('Rate something out of 100')
    .addStringOption(opt => opt.setName('thing').setDescription('What to rate').setRequired(true)),
  cooldown: 3,
  async execute(message, args, client) {
    try {
      let thing;
      if (message.isChatInputCommand) {
        thing = message.options.getString('thing');
      } else {
        thing = args.join(' ');
      }
      if (!thing) thing = 'something';

      const rating = Math.floor(Math.random() * 101);
      let color;
      let emoji;
      if (rating >= 80) { color = 0x22c55e; emoji = '🔥'; }
      else if (rating >= 60) { color = 0x84cc16; emoji = '👍'; }
      else if (rating >= 40) { color = 0xeab308; emoji = '🤷'; }
      else if (rating >= 20) { color = 0xf97316; emoji = '😬'; }
      else { color = 0xff0000; emoji = '💀'; }

      const filled = Math.round(rating / 5);
      const empty = 20 - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);

      let description;
      if (rating === 100) description = 'PERFECT SCORE! Absolutely legendary!';
      else if (rating >= 80) description = 'Amazing! Top tier stuff right there.';
      else if (rating >= 60) description = 'Pretty good! Solid performance.';
      else if (rating >= 40) description = 'It\'s alright. Nothing special.';
      else if (rating >= 20) description = 'Could be better... a lot better.';
      else description = 'Yikes. Just yikes.';

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} Rate`)
        .setDescription(`I rate **${thing}** a **${rating}/100**!`)
        .addFields(
          { name: 'Rating Bar', value: `\`\`\`${bar}\`\`\`` },
          { name: 'Verdict', value: description },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('[RATE ERROR]', e);
      message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('Failed to rate. Try again!')] }).catch(() => {});
    }
  },
};
