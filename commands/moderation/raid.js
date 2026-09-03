const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/database');
const { isLockdown, clearLockdown, getLockdownTimeRemaining } = require('../../utils/raidProtection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Configure raid protection')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('enable').setDescription('Enable raid protection'))
    .addSubcommand(sub =>
      sub.setName('disable').setDescription('Disable raid protection'))
    .addSubcommand(sub =>
      sub.setName('threshold')
        .setDescription('Set raid threshold')
        .addIntegerOption(opt => opt.setName('count').setDescription('Joins to trigger raid').setRequired(true).setMinValue(2).setMaxValue(50)))
    .addSubcommand(sub =>
      sub.setName('timeframe')
        .setDescription('Set raid timeframe in seconds')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('Time window (seconds)').setRequired(true).setMinValue(10).setMaxValue(300)))
    .addSubcommand(sub =>
      sub.setName('lockdown')
        .setDescription('Set lockdown duration in minutes')
        .addIntegerOption(opt => opt.setName('minutes').setDescription('Duration').setRequired(true).setMinValue(1).setMaxValue(60)))
    .addSubcommand(sub =>
      sub.setName('unlock').setDescription('Manually end lockdown'))
    .addSubcommand(sub =>
      sub.setName('status').setDescription('Check raid protection status')),
  async execute(interaction) {
    const settings = getGuildSettings(interaction.guild.id);
    const sub = interaction.options.getSubcommand();

    if (sub === 'enable') {
      updateGuildSetting(interaction.guild.id, 'raidProtection', true);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Raid Protection Enabled')
          .setDescription(`Server will auto-lock when ${settings.raidThreshold || 5} accounts join within ${settings.raidTimeframe || 60}s.`)],
      });
    }

    if (sub === 'disable') {
      updateGuildSetting(interaction.guild.id, 'raidProtection', false);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Raid Protection Disabled')
          .setDescription('Raid protection is now disabled.')],
      });
    }

    if (sub === 'threshold') {
      const count = interaction.options.getInteger('count');
      updateGuildSetting(interaction.guild.id, 'raidThreshold', count);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Raid Threshold Updated')
          .setDescription(`Raid will trigger at ${count} joins.`)],
      });
    }

    if (sub === 'timeframe') {
      const seconds = interaction.options.getInteger('seconds');
      updateGuildSetting(interaction.guild.id, 'raidTimeframe', seconds);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Raid Timeframe Updated')
          .setDescription(`Raid timeframe set to ${seconds} seconds.`)],
      });
    }

    if (sub === 'lockdown') {
      const minutes = interaction.options.getInteger('minutes');
      updateGuildSetting(interaction.guild.id, 'raidLockdownDuration', minutes * 60000);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Lockdown Duration Updated')
          .setDescription(`Lockdown will last ${minutes} minutes.`)],
      });
    }

    if (sub === 'unlock') {
      if (!isLockdown(interaction.guild.id)) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('No Active Lockdown')
            .setDescription('Server is not currently in lockdown.')],
          ephemeral: true,
        });
      }
      clearLockdown(interaction.guild.id);
      for (const [, channel] of interaction.guild.channels.cache) {
        if (channel.isTextBased() && !channel.isVoiceBased()) {
          try {
            await channel.permissionOverwrites.edit(interaction.guild.id, {
              SendMessages: null,
            }).catch(() => {});
          } catch (e) {}
        }
      }
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Lockdown Ended')
          .setDescription('All text channels have been unlocked.')],
      });
    }

    if (sub === 'status') {
      const inLockdown = isLockdown(interaction.guild.id);
      const remaining = getLockdownTimeRemaining(interaction.guild.id);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(settings.raidProtection ? '#00ff00' : '#ff0000')
          .setTitle('Raid Protection Status')
          .addFields(
            { name: 'Enabled', value: settings.raidProtection ? '✅ Yes' : '❌ No', inline: true },
            { name: 'Threshold', value: `${settings.raidThreshold || 5} joins`, inline: true },
            { name: 'Timeframe', value: `${settings.raidTimeframe || 60}s`, inline: true },
            { name: 'Lockdown Duration', value: `${(settings.raidLockdownDuration || 300000) / 60000} min`, inline: true },
            { name: 'Current Status', value: inLockdown ? `🔒 LOCKED (${Math.ceil(remaining / 60000)} min left)` : '🔓 Unlocked', inline: true },
          )],
      });
    }
  },
};
