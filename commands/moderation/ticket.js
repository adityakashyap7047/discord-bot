const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/database');

const ticketCache = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Configure ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Setup ticket system')
        .addChannelOption(opt => opt.setName('category').setDescription('Category for ticket channels').setRequired(true))
        .addRoleOption(opt => opt.setName('support-role').setDescription('Role that can see tickets').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('panel')
        .setDescription('Send ticket panel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send panel').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('close')
        .setDescription('Close current ticket')
    ),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You need **Manage Server** permission.');
    }

    const settings = getGuildSettings(message.guild.id);

    if (message.content.startsWith('!')) {
      const sub = args[0]?.toLowerCase();

      if (sub === 'setup') {
        const channel = message.mentions.channels.first();
        const role = message.mentions.roles.first();
        if (!channel || !role) return message.reply('Usage: `!ticket setup #category @support-role`');

        updateGuildSetting(message.guild.id, 'ticketCategory', channel.id);
        updateGuildSetting(message.guild.id, 'ticketSupportRole', role.id);
        return message.reply(`Ticket system configured!\nCategory: ${channel}\nSupport Role: ${role}`);
      }

      if (sub === 'panel') {
        const channel = message.mentions.channels.first() || message.channel;
        if (!settings.ticketCategory) return message.reply('Run `!ticket setup` first.');

        const embed = new EmbedBuilder()
          .setColor('#8b5cf6')
          .setTitle('Support Tickets')
          .setDescription('Need help? Click the button below to create a support ticket.\n\nOur staff will assist you shortly.')
          .setFooter({ text: 'Ticket System' })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_create')
            .setLabel('Create Ticket')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary),
        );

        await channel.send({ embeds: [embed], components: [row] });
        return message.delete().catch(() => {});
      }

      if (sub === 'close') {
        if (!message.channel.name.startsWith('ticket-')) return message.reply('This is not a ticket channel.');
        const ticketData = ticketCache.get(message.channel.id);
        if (!ticketData) return message.reply('No ticket data found.');

        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('Ticket Closed')
          .setDescription(`Closed by ${message.author}\nTicket will be deleted in 10 seconds.`)
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        setTimeout(() => message.channel.delete().catch(() => {}), 10000);
        return;
      }

      return message.reply('Subcommands: `setup`, `panel`, `close`');
    }
  },
};

async function handleTicket(interaction, client) {
  if (interaction.customId === 'ticket_create') {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    const settings = getGuildSettings(interaction.guild.id);
    if (!settings.ticketCategory) {
      return interaction.editReply({ content: 'Ticket system not configured.' }).catch(() => {});
    }

    const ticketNumber = (interaction.guild.channels.cache.filter(c => c.name.startsWith('ticket-')).size || 0) + 1;

    const channel = await interaction.guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      parent: settings.ticketCategory,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
        { id: settings.ticketSupportRole || interaction.guild.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
      ],
    }).catch(() => null);

    if (!channel) return interaction.editReply({ content: 'Failed to create ticket channel.' }).catch(() => {});

    ticketCache.set(channel.id, {
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      createdAt: Date.now(),
    });

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle(`Ticket #${ticketNumber}`)
      .setDescription(`Welcome ${interaction.user}!\nDescribe your issue and our staff will assist you.\n\nTo close this ticket, type \`!ticket close\``)
      .setFooter({ text: `User ID: ${interaction.user.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
    );

    await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    return interaction.editReply({ content: `Ticket created: ${channel}` }).catch(() => {});
  }

  if (interaction.customId === 'ticket_close') {
    if (!interaction.channel.name.startsWith('ticket-')) return;
    const ticketData = ticketCache.get(interaction.channel.id);
    if (!ticketData) return;

    const embed = new EmbedBuilder()
      .setColor('#ef4444')
      .setTitle('Ticket Closed')
      .setDescription(`Closed by ${interaction.user}\nTicket will be deleted in 10 seconds.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] }).catch(() => {});
    setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
    ticketCache.delete(interaction.channel.id);
  }
}

module.exports.handleTicket = handleTicket;
module.exports.ticketCache = ticketCache;
