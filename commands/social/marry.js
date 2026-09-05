const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getMarriage, addMarriage } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Propose marriage to another user')
    .addUserOption(opt => opt.setName('user').setDescription('User to propose to').setRequired(true)),
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Mention someone to propose to!')] });
    }

    if (target.id === message.author.id) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('You cannot marry yourself!')] });
    }

    if (target.bot) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('You cannot marry a bot!')] });
    }

    const existingMarriage = await getMarriage(message.author.id);
    if (existingMarriage) {
      const spouseId = existingMarriage.user1 === message.author.id ? existingMarriage.user2 : existingMarriage.user1;
      try {
        const spouse = await client.users.fetch(spouseId);
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Already Married').setDescription(`You are already married to ${spouse.username}!`)] });
      } catch {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Already Married').setDescription('You are already married!')] });
      }
    }

    const targetMarriage = await getMarriage(target.id);
    if (targetMarriage) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Already Married').setDescription(`${target.username} is already married!`)] });
    }

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('💍 Marriage Proposal!')
      .setDescription(`${message.author} has proposed to ${target}!\n\n${target}, do you accept this proposal?`)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/1048/1048953.png')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`marry_accept_${message.author.id}_${target.id}`).setLabel('Accept 💕').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`marry_decline_${message.author.id}_${target.id}`).setLabel('Decline 💔').setStyle(ButtonStyle.Danger),
    );

    const response = await message.reply({ embeds: [embed], components: [row] });

    const filter = i => i.user.id === target.id;
    const collector = response.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId.startsWith('marry_accept')) {
        await addMarriage(message.author.id, target.id);
        const acceptEmbed = new EmbedBuilder()
          .setColor(0xff69b4)
          .setTitle('💒 Marriage Accepted!')
          .setDescription(`🎉 **${message.author.username}** and **${target.username}** are now married! 🎉\n\nCongratulations to the happy couple! 🥂`)
          .setTimestamp();
        await interaction.update({ embeds: [acceptEmbed], components: [] });
      } else if (interaction.customId.startsWith('marry_decline')) {
        const declineEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('💔 Proposal Declined')
          .setDescription(`${target.username} has declined the proposal from ${message.author}.`)
          .setTimestamp();
        await interaction.update({ embeds: [declineEmbed], components: [] });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(0x808080)
          .setTitle('💔 Proposal Expired')
          .setDescription(`${target.username} did not respond to the proposal in time.`)
          .setTimestamp();
        await response.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  },
};
