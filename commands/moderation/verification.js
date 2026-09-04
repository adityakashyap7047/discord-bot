const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/database');

function getSourceInfo(source) {
  if (source.isChatInputCommand) {
    return {
      isSlash: true,
      guild: source.guild,
      member: source.member,
      user: source.user,
      reply: (opts) => source.reply(opts),
      sub: source.options.getSubcommand(),
      getString: (name) => source.options.getString(name),
      getChannel: (name) => source.options.getChannel(name),
      getRole: (name) => source.options.getRole(name),
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
    getString: (name) => {
      const idx = args.indexOf('--' + name);
      return idx !== -1 ? args[idx + 1] : args.slice(1).join(' ');
    },
    getChannel: (name) => source.mentions.channels.first(),
    getRole: (name) => source.mentions.roles.first(),
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verification')
    .setDescription('Configure verification system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('enable').setDescription('Enable verification'))
    .addSubcommand(sub =>
      sub.setName('disable').setDescription('Disable verification'))
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Set verification channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel for verification').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('role')
        .setDescription('Set verified role')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to give on verify').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('message')
        .setDescription('Set verification message')
        .addStringOption(opt => opt.setName('message').setDescription('Custom message').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('status').setDescription('Check verification status')),
  async execute(source, client) {
    const src = getSourceInfo(source);
    const settings = await getGuildSettings(src.guild.id);
    const sub = src.sub;

    if (sub === 'enable') {
      if (!settings.verificationChannel || !settings.verificationRole) {
        return src.reply({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Configuration Required')
            .setDescription('Please set the verification channel and role first.')],
          ephemeral: true,
        });
      }
      updateGuildSetting(src.guild.id, 'verificationEnabled', true);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Verification Enabled')
          .setDescription('New members will need to react with ✅ to verify.')],
      });
    }

    if (sub === 'disable') {
      updateGuildSetting(src.guild.id, 'verificationEnabled', false);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Verification Disabled')
          .setDescription('Verification system is now disabled.')],
      });
    }

    if (sub === 'channel') {
      const channel = src.getChannel('channel');
      updateGuildSetting(src.guild.id, 'verificationChannel', channel.id);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Verification Channel Set')
          .setDescription(`Verification messages will be sent to ${channel}`)],
      });
    }

    if (sub === 'role') {
      const role = src.getRole('role');
      updateGuildSetting(src.guild.id, 'verificationRole', role.id);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Verified Role Set')
          .setDescription(`Verified members will receive ${role}`)],
      });
    }

    if (sub === 'message') {
      const msg = src.getString('message');
      updateGuildSetting(src.guild.id, 'verificationMessage', msg);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Verification Message Updated')
          .setDescription(`New message: ${msg}`)],
      });
    }

    if (sub === 'status') {
      const verChannel = settings.verificationChannel
        ? src.guild.channels.cache.get(settings.verificationChannel)
        : null;
      const verRole = settings.verificationRole
        ? src.guild.roles.cache.get(settings.verificationRole)
        : null;

      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor(settings.verificationEnabled ? '#00ff00' : '#ff0000')
          .setTitle('Verification Status')
          .addFields(
            { name: 'Enabled', value: settings.verificationEnabled ? '✅ Yes' : '❌ No', inline: true },
            { name: 'Channel', value: verChannel ? `${verChannel}` : 'Not set', inline: true },
            { name: 'Role', value: verRole ? `${verRole}` : 'Not set', inline: true },
            { name: 'Message', value: settings.verificationMessage || 'Default', inline: false },
          )],
      });
    }

    return src.reply({ content: 'Unknown subcommand. Use `enable`, `disable`, `channel`, `role`, `message`, or `status`.', ephemeral: true });
  },
};
