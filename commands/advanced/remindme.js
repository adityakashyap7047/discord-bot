const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Set a reminder that sends you a DM')
    .addStringOption(opt => opt.setName('time').setDescription('Time (e.g. 30m, 2h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Reminder message').setRequired(true)),
  cooldown: 5,
  async execute(message, args, client) {
    const db = client.db;
    const timeStr = args[0];
    const reminderMsg = args.slice(1).join(' ');

    if (!timeStr || !reminderMsg) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Usage: `remindme 30m Check oven`')] });
    }

    const match = timeStr.match(/^(\d+)(m|h|d)$/);
    if (!match) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Time format: `30m`, `2h`, `1d` (minutes/hours/days)')] });
    }

    const multipliers = { m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(match[1]) * multipliers[match[2]];
    const remindAt = new Date(Date.now() + ms);
    const timeDisplay = `${match[1]}${match[2]}`;

    const reminders = db.get('reminders') || [];
    const reminder = {
      userId: message.author.id,
      channelId: message.channel.id,
      message: reminderMsg,
      remindAt: remindAt.toISOString(),
      createdAt: Date.now(),
    };
    reminders.push(reminder);
    db.set('reminders', reminders);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('⏰ Reminder Set!')
      .setDescription(`I'll DM you in **${timeDisplay}** with your reminder.`)
      .addFields(
        { name: '📝 Reminder', value: reminderMsg, inline: false },
        { name: '🕐 Triggers At', value: `<t:${Math.floor(remindAt.getTime() / 1000)}:R>`, inline: true },
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });

    setTimeout(async () => {
      try {
        const user = await client.users.fetch(message.author.id);
        const dmEmbed = new EmbedBuilder()
          .setColor(0xf59e0b)
          .setTitle('⏰ Reminder!')
          .setDescription(reminderMsg)
          .setTimestamp();
        await user.send({ embeds: [dmEmbed] });
      } catch {
        try {
          const channel = await client.channels.fetch(message.channel.id);
          const fallbackEmbed = new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle('⏰ Reminder!')
            .setDescription(`<@${message.author.id}> ${reminderMsg}`)
            .setTimestamp();
          channel.send({ embeds: [fallbackEmbed] });
        } catch {}
      }

      const currentReminders = db.get('reminders') || [];
      const idx = currentReminders.findIndex(r => r.createdAt === reminder.createdAt);
      if (idx !== -1) {
        currentReminders.splice(idx, 1);
        db.set('reminders', currentReminders);
      }
    }, ms);
  },
};
