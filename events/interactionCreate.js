const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('nitro_prank_')) {
      const file = new AttachmentBuilder(path.join(__dirname, '..', 'd05cde43af751fc4445a9f4456d74e93.jpg'));
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Here is your Nitro!')
        .setDescription(`${interaction.user} You really thought you were getting free Nitro? **LOL**`)
        .setImage('attachment://d05cde43af751fc4445a9f4456d74e93.jpg')
        .setFooter({ text: 'Gottem!' });
      await interaction.reply({ embeds: [embed], files: [file] });
    }

    if (interaction.customId === 'giveaway_enter') {
      const { giveaways } = require('../commands/moderation/giveaway');
      const giveaway = giveaways.get(interaction.message.id);

      if (!giveaway || giveaway.ended) {
        return interaction.reply({ content: 'This giveaway has ended.', ephemeral: true });
      }

      if (giveaway.entries.has(interaction.user.id)) {
        giveaway.entries.delete(interaction.user.id);
        return interaction.reply({ content: 'You left the giveaway.', ephemeral: true });
      }

      giveaway.entries.add(interaction.user.id);
      return interaction.reply({ content: `You entered the giveaway! (${giveaway.entries.size} entries)`, ephemeral: true });
    }

    if (interaction.customId.startsWith('ticket_')) {
      const { handleTicket } = require('../commands/moderation/ticket');
      await handleTicket(interaction, client);
    }
  },
};
