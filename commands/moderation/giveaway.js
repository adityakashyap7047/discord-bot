const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { addLog } = require('../../utils/database');

const giveaways = new Map();

function parseTime(str) {
  const match = str.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  if (unit === 'm') return num * 60 * 1000;
  if (unit === 'h') return num * 60 * 60 * 1000;
  if (unit === 'd') return num * 24 * 60 * 60 * 1000;
  return null;
}

function formatTime(ms) {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Start a giveaway')
        .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 10m, 2h, 1d)').setRequired(true))
        .addStringOption(opt => opt.setName('prize').setDescription('Prize to give away').setRequired(true))
        .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(false))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('End a giveaway early')
        .addStringOption(opt => opt.setName('message-id').setDescription('Giveaway message ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reroll')
        .setDescription('Reroll a giveaway winner')
        .addStringOption(opt => opt.setName('message-id').setDescription('Giveaway message ID').setRequired(true))
    ),
  cooldown: 5,
  async execute(message, args, client) {
    if (message.content.startsWith('!')) {
      const sub = args[0]?.toLowerCase();

      if (sub === 'start' || !sub) {
        const duration = args[1];
        const prize = args.slice(2, -1).join(' ');
        const winners = parseInt(args[args.length - 1]) || 1;

        if (!duration || !prize) {
          return message.reply('Usage: `!giveaway start <duration> <prize> [winners]`\nDuration: `10m`, `2h`, `1d`');
        }

        const ms = parseTime(duration);
        if (!ms) return message.reply('Invalid duration. Use `10m`, `2h`, or `1d`.');

        const embed = new EmbedBuilder()
          .setColor('#8b5cf6')
          .setTitle('GIVEAWAY')
          .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor((Date.now() + ms) / 1000)}:R>\n\nReact with 🎉 to enter!`)
          .setFooter({ text: `Started by ${message.author.tag}` })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('giveaway_enter')
            .setLabel('Enter')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Primary),
        );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });
        await msg.react('🎉');

        giveaways.set(msg.id, {
          guildId: message.guild.id,
          channelId: message.channel.id,
          messageId: msg.id,
          prize,
          winners,
          endAt: Date.now() + ms,
          hostId: message.author.id,
          ended: false,
          entries: new Set(),
        });

        setTimeout(() => endGiveaway(msg.id, client), ms);
        return message.delete().catch(() => {});
      }

      if (sub === 'end') {
        const msgId = args[1];
        if (!msgId) return message.reply('Provide the giveaway message ID.');
        const giveaway = giveaways.get(msgId);
        if (!giveaway) return message.reply('Giveaway not found.');
        if (giveaway.ended) return message.reply('Giveaway already ended.');
        await endGiveaway(msgId, client);
        return message.delete().catch(() => {});
      }

      if (sub === 'reroll') {
        const msgId = args[1];
        if (!msgId) return message.reply('Provide the giveaway message ID.');
        const giveaway = giveaways.get(msgId);
        if (!giveaway) return message.reply('Giveaway not found.');
        if (!giveaway.ended) return message.reply('Giveaway not ended yet.');

        const channel = client.channels.cache.get(giveaway.channelId);
        if (!channel) return message.reply('Channel not found.');

        const fetched = await channel.messages.fetch(msgId).catch(() => null);
        if (!fetched) return message.reply('Message not found.');

        const entries = Array.from(giveaway.entries);
        if (entries.length === 0) return message.reply('No entries to reroll.');

        const newWinner = entries[Math.floor(Math.random() * entries.length)];
        const embed = new EmbedBuilder()
          .setColor('#ec4899')
          .setTitle('GIVEAWAY REROLL')
          .setDescription(`**Prize:** ${giveaway.prize}\n\n🎉 New Winner: <@${newWinner}>`)
          .setTimestamp();
        return message.channel.send({ embeds: [embed] });
      }

      return message.reply('Subcommands: `start`, `end`, `reroll`');
    }
  },
};

async function endGiveaway(messageId, client) {
  const giveaway = giveaways.get(messageId);
  if (!giveaway || giveaway.ended) return;

  giveaway.ended = true;

  const channel = client.channels.cache.get(giveaway.channelId);
  if (!channel) return;

  const fetched = await channel.messages.fetch(messageId).catch(() => null);
  if (!fetched) return;

  const entries = Array.from(giveaway.entries);
  let winners = [];

  if (entries.length > 0) {
    const shuffled = entries.sort(() => Math.random() - 0.5);
    winners = shuffled.slice(0, giveaway.winners);
  }

  const embed = new EmbedBuilder()
    .setColor('#22c55e')
    .setTitle('GIVEAWAY ENDED')
    .setDescription(`**Prize:** ${giveaway.prize}\n\n${winners.length > 0 ? `Winner(s): ${winners.map(w => `<@${w}>`).join(', ')}` : 'No entries.'}`)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_ended')
      .setLabel(winners.length > 0 ? `Winner: ${winners[0]}` : 'No Winner')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  fetched.edit({ embeds: [embed], components: [row] }).catch(() => {});

  if (winners.length > 0) {
    channel.send(`Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**!`);
  }
}

module.exports.giveaways = giveaways;
module.exports.endGiveaway = endGiveaway;
