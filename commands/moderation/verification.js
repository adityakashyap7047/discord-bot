const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/database');

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
  async execute(interaction) {
    const settings = getGuildSettings(interaction.guild.id);
    const sub = interaction.options.getSubcommand();

    if (sub === 'enable') {
      if (!settings.verificationChannel || !settings.verificationRole) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Configuration Required')
            .setDescription('Please set the verification channel and role first.')],
          ephemeral: true,
        });
      }
      updateGuildSetting(interaction.guild.id, 'verificationEnabled', true);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Verification Enabled')
          .setDescription('New members will need to react with ✅ to verify.')],
      });
    }

    if (sub === 'disable') {
      updateGuildSetting(interaction.guild.id, 'verificationEnabled', false);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Verification Disabled')
          .setDescription('Verification system is now disabled.')],
      });
    }

    if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');
      updateGuildSetting(interaction.guild.id, 'verificationChannel', channel.id);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Verification Channel Set')
          .setDescription(`Verification messages will be sent to ${channel}`)],
      });
    }

    if (sub === 'role') {
      const role = interaction.options.getRole('role');
      updateGuildSetting(interaction.guild.id, 'verificationRole', role.id);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Verified Role Set')
          .setDescription(`Verified members will receive ${role}`)],
      });
    }

    if (sub === 'message') {
      const msg = interaction.options.getString('message');
      updateGuildSetting(interaction.guild.id, 'verificationMessage', msg);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Verification Message Updated')
          .setDescription(`New message: ${msg}`)],
      });
    }

    if (sub === 'status') {
      const verChannel = settings.verificationChannel
        ? interaction.guild.channels.cache.get(settings.verificationChannel)
        : null;
      const verRole = settings.verificationRole
        ? interaction.guild.roles.cache.get(settings.verificationRole)
        : null;

      return interaction.reply({
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
  },
};
