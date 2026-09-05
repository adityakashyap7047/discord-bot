const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getReputation, addReputation, hasGivenRep } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Give +1 reputation to a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to give reputation to').setRequired(true)),
  cooldown: 5,
  async execute(message, args, client) {
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

    if (await hasGivenRep(message.author.id, target.id)) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Already Given').setDescription(`You have already given reputation to ${target} before!`)],
      });
    }

    await addReputation(target.id, message.author.id);

    const repData = await getReputation(target.id);
    const reputation = repData.length;
    const repBar = generateRepBar(reputation);

    const embed = new EmbedBuilder()
      .setColor(0xfbbf24)
      .setTitle('⭐ Reputation Given!')
      .setDescription(`${message.author} gave +1 rep to ${target}!`)
      .addFields(
        { name: 'New Reputation', value: `${reputation} rep`, inline: true },
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
