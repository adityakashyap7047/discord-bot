const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purgebot')
    .setDescription('Delete messages from bots only')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to check (default 100)').setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,
  async execute(message, args) {
    try {
      if (!message.member.permissions.has('ManageMessages')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Messages permission.')] });
      }
      const amount = message.isChatInputCommand ? (message.options.getInteger('amount') || 100) : (parseInt(args[0]) || 100);
      const fetched = await message.channel.messages.fetch({ limit: Math.min(amount, 100) });
      const botMessages = fetched.filter(m => m.author.bot);

      if (botMessages.size === 0) return message.reply({ embeds: [errorEmbed('Purge', 'No bot messages found in the last 100 messages.')] });

      const deleted = await message.channel.bulkDelete(botMessages, true);
      const embed = successEmbed('Bot Messages Purged', `Deleted **${deleted.size}** bot messages.`);
      message.reply({ embeds: [embed] }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    } catch (e) {
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to purge.')] }).catch(() => {});
    }
  },
};
