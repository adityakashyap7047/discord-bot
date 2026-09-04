const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Give +1 reputation to a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to give reputation to').setRequired(true)),
  cooldown: 5,
  async execute(message, args, client) {
    const db = client.db;
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Mention a user to give reputation!')] });
    }

    if (target.id === message.author.id) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('You cannot give reputation to yourself!')] });
    }

    if (target.bot) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('You cannot give reputation to bots!')] });
    }

    const social = db.get('social') || {};
    const giverKey = `repCooldown_${message.author.id}_${target.id}`;
    const cooldownTime = 24 * 60 * 60 * 1000;

    if (social[giverKey] && (Date.now() - social[giverKey]) < cooldownTime) {
      const remaining = cooldownTime - (Date.now() - social[giverKey]);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0xf59e0b).setTitle('⏳ Cooldown').setDescription(`You already gave rep to ${target} recently.\nTry again in **${hours}h ${minutes}m**.`)],
      });
    }

    const targetKey = `${message.guild.id}_${target.id}`;
    const socialData = social[targetKey] || { reputation: 0, repGivers: [] };

    if (!socialData.repGivers) socialData.repGivers = [];
    if (socialData.repGivers.includes(message.author.id)) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Already Given').setDescription(`You have already given reputation to ${target} before!`)],
      });
    }

    socialData.reputation = (socialData.reputation || 0) + 1;
    socialData.repGivers.push(message.author.id);
    social[giverKey] = Date.now();
    social[targetKey] = socialData;
    db.set('social', social);

    const repBar = generateRepBar(socialData.reputation);

    const embed = new EmbedBuilder()
      .setColor(0xfbbf24)
      .setTitle('⭐ Reputation Given!')
      .setDescription(`${message.author} gave +1 rep to ${target}!`)
      .addFields(
        { name: 'New Reputation', value: `${socialData.reputation} rep`, inline: true },
        { name: 'Rep Bar', value: repBar, inline: true },
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

function generateRepBar(rep) {
  const maxRep = 100;
  const filled = Math.min(Math.floor((rep / maxRep) * 10), 10);
  const empty = 10 - filled;
  return '⭐'.repeat(filled) + '・'.repeat(empty);
}
