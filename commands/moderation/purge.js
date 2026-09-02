const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages (1-100)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Messages permission.')] });
    }
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) {
      return message.reply({ embeds: [errorEmbed('Error', 'Provide a number between 1 and 100.')] });
    }
    await message.delete().catch(() => {});
    const deleted = await message.channel.bulkDelete(amount, true);
    const msg = await message.channel.send({ embeds: [successEmbed('Purged', `Deleted ${deleted.size} messages.`)] });
    setTimeout(() => msg.delete(), 5000);
  },
};
