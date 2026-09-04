const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('List all commands'),
  cooldown: 3,
  async execute(message, args, client) {
    const isSlash = message.isChatInputCommand;
    const prefix = client.config.prefix;

    const categories = {
      'Economy & Gambling': {
        cmds: ['daily', 'balance', 'work', 'beg', 'deposit', 'withdraw', 'give', 'rob', 'slots', 'economyboard'],
        desc: 'Earn, save, gamble, and trade coins',
      },
      'Moderation': {
        cmds: ['ban', 'kick', 'mute', 'unmute', 'warn', 'warnings', 'purge', 'tempban', 'nick', 'slowmode', 'lock', 'unlock', 'serverlock', 'nuke', 'prune'],
        desc: 'Complete moderation toolkit',
      },
      'Anti-Scam & Security': {
        cmds: ['antiscam', 'verification', 'raid'],
        desc: 'Scam detection, verification, raid protection',
      },
      'Utility': {
        cmds: ['ping', 'help', 'avatar', 'userinfo', 'serverinfo', 'membercount', 'rolelist', 'invitecount', 'poll', 'remind', 'level', 'msg'],
        desc: 'Info, tools, and server utilities',
      },
      'Info': {
        cmds: ['botinfo', 'uptime'],
        desc: 'Bot status and information',
      },
      'Fun & Games': {
        cmds: ['8ball', 'roll', 'decide', 'say', 'reverse', 'coinflip', 'joke', 'quote', 'ship', 'rate', 'choose', 'ascii', 'wouldyourather', 'trivia'],
        desc: 'Games, jokes, and entertainment',
      },
      'Setup': {
        cmds: ['setup', 'setwelcome', 'setgoodbye', 'setlog', 'setprefix', 'setautorole', 'automod'],
        desc: 'Server configuration',
      },
      'Custom Commands': {
        cmds: ['addcommand', 'removecommand', 'listcommands'],
        desc: 'Create custom commands',
      },
      'Reaction Roles': {
        cmds: ['reactionrole'],
        desc: 'Self-assignable roles',
      },
      'Events': {
        cmds: ['giveaway', 'ticket'],
        desc: 'Giveaways and tickets',
      },
    };

    const embed = new EmbedBuilder()
      .setColor(0x00d4ff)
      .setTitle('⚡ VARUNASTRA — Command Arsenal')
      .setDescription(
        isSlash
          ? 'Type `/` to see all commands with autocomplete!\nOr use the prefix `!` on desktop.'
          : `Use the prefix \`${prefix}\` before each command.\nOr type \`/\` for autocomplete!`
      )
      .setTimestamp();

    for (const [cat, data] of Object.entries(categories)) {
      const cmdList = data.cmds.map(c => `\`${c}\``).join(', ');
      embed.addFields({ name: cat, value: `${cmdList}\n_${data.desc}_` });
    }

    embed.addFields(
      { name: 'Auto-Mod Toggles', value: [
        '`!automod automod` — Bad word filter',
        '`!automod antispam` — Flood/spam detection',
        '`!automod antilink` — Block links',
        '`!automod antiscam` — Scam detection',
        '`!automod accountagegate` — Account age gate',
        '`!automod duplicate` — Duplicate message filter',
        '`!automod massmention` — Mass mention limit',
        '',
        'Usage: `!automod <feature> on/off` or `/automod feature:<name> toggle:on`',
      ].join('\n'), inline: false },
    );

    embed.setFooter({ text: `${client.commands.size} commands | VARUNASTRA — Divine Power` });

    message.reply({ embeds: [embed] });
  },
};
