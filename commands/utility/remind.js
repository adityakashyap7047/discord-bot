const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { addReminder } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder().setName('remind').setDescription('Set a reminder')
    .addStringOption(opt => opt.setName('time').setDescription('Time (e.g. 10m, 1h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Reminder message').setRequired(true)),
  cooldown: 5,
  async execute(message, args, client) {
    const timeStr = args[0];
    const reminder = args.slice(1).join(' ');
    if (!timeStr || !reminder) return message.reply({ embeds: [errorEmbed('Error', 'Usage: `remind 10m Do homework`')] });

    const match = timeStr.match(/^(\d+)(m|h|d)$/);
    if (!match) return message.reply({ embeds: [errorEmbed('Error', 'Time format: `10m`, `1h`, `1d`')] });

    const multipliers = { m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(match[1]) * multipliers[match[2]];
    const remindAt = new Date(Date.now() + ms);

    addReminder(message.author.id, message.channel.id, reminder, remindAt.toISOString());

    message.reply({ embeds: [successEmbed('Reminder Set', `I'll remind you in ${timeStr}.`)] });

    setTimeout(async () => {
      try {
        const channel = await client.channels.fetch(message.channel.id);
        channel.send(`⏰ <@${message.author.id}>, reminder: **${reminder}**`);
      } catch (e) {}
    }, ms);
  },
};
