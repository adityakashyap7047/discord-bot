const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/database');
const { isLockdown, clearLockdown, getLockdownTimeRemaining } = require('../../utils/raidProtection');

function getSourceInfo(source) {
  if (source.isChatInputCommand) {
    return {
      isSlash: true,
      guild: source.guild,
      member: source.member,
      user: source.user,
      reply: (opts) => source.reply(opts),
      sub: source.options.getSubcommand(),
      getInteger: (name) => source.options.getInteger(name),
    };
  }
  const args = source.content.trim().split(/ +/).slice(1);
  return {
    isSlash: false,
    guild: source.guild,
    member: source.member,
    user: source.author,
    reply: (opts) => source.reply(opts),
    sub: args[0]?.toLowerCase() || '',
    getInteger: (name) => {
      const idx = args.indexOf('--' + name);
      return idx !== -1 ? parseInt(args[idx + 1]) : parseInt(args[1]);
    },
  };
}

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
  async execute(source, client) {
    const src = getSourceInfo(source);
    const settings = await getGuildSettings(src.guild.id);
    const sub = src.sub;

    if (sub === 'enable') {
      await updateGuildSetting(src.guild.id, 'raidProtection', true);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Raid Protection Enabled')
          .setDescription(`Server will auto-lock when ${settings.raidThreshold || 5} accounts join within ${settings.raidTimeframe || 60}s.`)],
      });
    }

    if (sub === 'disable') {
      await updateGuildSetting(src.guild.id, 'raidProtection', false);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Raid Protection Disabled')
          .setDescription('Raid protection is now disabled.')],
      });
    }

    if (sub === 'threshold') {
      const count = src.getInteger('count');
      await updateGuildSetting(src.guild.id, 'raidThreshold', count);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Raid Threshold Updated')
          .setDescription(`Raid will trigger at ${count} joins.`)],
      });
    }

    if (sub === 'timeframe') {
      const seconds = src.getInteger('seconds');
      await updateGuildSetting(src.guild.id, 'raidTimeframe', seconds);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Raid Timeframe Updated')
          .setDescription(`Raid timeframe set to ${seconds} seconds.`)],
      });
    }

    if (sub === 'lockdown') {
      const minutes = src.getInteger('minutes');
      await updateGuildSetting(src.guild.id, 'raidLockdownDuration', minutes * 60000);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Lockdown Duration Updated')
          .setDescription(`Lockdown will last ${minutes} minutes.`)],
      });
    }

    if (sub === 'unlock') {
      if (!isLockdown(src.guild.id)) {
        return src.reply({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('No Active Lockdown')
            .setDescription('Server is not currently in lockdown.')],
          ephemeral: true,
        });
      }
      clearLockdown(src.guild.id);
      for (const [, channel] of src.guild.channels.cache) {
        if (channel.isTextBased() && !channel.isVoiceBased()) {
          try {
            await channel.permissionOverwrites.edit(src.guild.id, {
              SendMessages: null,
            }).catch(() => {});
          } catch (e) {}
        }
      }
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Lockdown Ended')
          .setDescription('All text channels have been unlocked.')],
      });
    }

    if (sub === 'status') {
      const inLockdown = isLockdown(src.guild.id);
      const remaining = getLockdownTimeRemaining(src.guild.id);

      return src.reply({
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

    return src.reply({ content: 'Unknown subcommand. Use `enable`, `disable`, `threshold`, `timeframe`, `lockdown`, `unlock`, or `status`.', ephemeral: true });
  },
};
