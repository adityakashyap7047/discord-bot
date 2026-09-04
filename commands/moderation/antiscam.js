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
      getUser: (name) => source.options.getUser(name),
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
      return idx !== -1 ? args[idx + 1] : args[1];
    },
    getChannel: (name) => source.mentions.channels.first(),
    getUser: (name) => source.mentions.users.first(),
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiscam')
    .setDescription('Configure anti-scam protection')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('enable').setDescription('Enable anti-scam protection'))
    .addSubcommand(sub =>
      sub.setName('disable').setDescription('Disable anti-scam protection'))
    .addSubcommand(sub =>
      sub.setName('action')
        .setDescription('Set action for scammers')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Action to take')
            .setRequired(true)
            .addChoices(
              { name: 'Delete only', value: 'delete' },
              { name: 'Delete + Mute', value: 'mute' },
              { name: 'Delete + Kick', value: 'kick' },
              { name: 'Delete + Ban', value: 'ban' },
            )))
    .addSubcommand(sub =>
      sub.setName('logchannel')
        .setDescription('Set channel for scam logs')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Log channel')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('whitelist')
        .setDescription('Whitelist a user from anti-scam')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to whitelist')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('unwhitelist')
        .setDescription('Remove user from whitelist')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to remove')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('status').setDescription('Check anti-scam status')),
  async execute(source, client) {
    const src = getSourceInfo(source);
    const settings = await getGuildSettings(src.guild.id);
    const sub = src.sub;

    if (sub === 'enable') {
      updateGuildSetting(src.guild.id, 'antiScam', true);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Anti-Scam Enabled')
          .setDescription('Scam protection is now **enabled**. Crypto scams, celebrity impersonation, and suspicious links will be detected and blocked.')
          .setTimestamp()],
      });
    }

    if (sub === 'disable') {
      updateGuildSetting(src.guild.id, 'antiScam', false);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Anti-Scam Disabled')
          .setDescription('Scam protection is now **disabled**.')
          .setTimestamp()],
      });
    }

    if (sub === 'action') {
      const type = src.getString('type');
      updateGuildSetting(src.guild.id, 'scamAction', type);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Anti-Scam Action Updated')
          .setDescription(`Action for scammers set to: **${type}**`)
          .setTimestamp()],
      });
    }

    if (sub === 'logchannel') {
      const channel = src.getChannel('channel');
      updateGuildSetting(src.guild.id, 'scamLogChannel', channel.id);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Scam Log Channel Set')
          .setDescription(`Scam logs will be sent to ${channel}`)
          .setTimestamp()],
      });
    }

    if (sub === 'whitelist') {
      const user = src.getUser('user');
      const whitelist = settings.scamWhitelist || [];
      if (!whitelist.includes(user.id)) {
        whitelist.push(user.id);
        updateGuildSetting(src.guild.id, 'scamWhitelist', whitelist);
      }
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('User Whitelisted')
          .setDescription(`${user.tag || user.username} has been whitelisted from anti-scam.`)
          .setTimestamp()],
      });
    }

    if (sub === 'unwhitelist') {
      const user = src.getUser('user');
      const whitelist = (settings.scamWhitelist || []).filter(id => id !== user.id);
      updateGuildSetting(src.guild.id, 'scamWhitelist', whitelist);
      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('User Removed from Whitelist')
          .setDescription(`${user.tag || user.username} has been removed from the whitelist.`)
          .setTimestamp()],
      });
    }

    if (sub === 'status') {
      const whitelist = settings.scamWhitelist || [];
      const logChannel = settings.scamLogChannel
        ? src.guild.channels.cache.get(settings.scamLogChannel)
        : null;

      return src.reply({
        embeds: [new EmbedBuilder()
          .setColor(settings.antiScam ? '#00ff00' : '#ff0000')
          .setTitle('Anti-Scam Status')
          .addFields(
            { name: 'Enabled', value: settings.antiScam ? '✅ Yes' : '❌ No', inline: true },
            { name: 'Action', value: settings.scamAction || 'delete', inline: true },
            { name: 'Log Channel', value: logChannel ? `${logChannel}` : 'Not set', inline: true },
            { name: 'Whitelisted Users', value: whitelist.length > 0 ? whitelist.length.toString() : 'None', inline: true },
          )
          .setDescription('Detects: Crypto scams, celebrity impersonation, urgency tactics, suspicious links')
          .setTimestamp()],
      });
    }

    return src.reply({ content: 'Unknown subcommand. Use `enable`, `disable`, `action`, `logchannel`, `whitelist`, `unwhitelist`, or `status`.', ephemeral: true });
  },
};
