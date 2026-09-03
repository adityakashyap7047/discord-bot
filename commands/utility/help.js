const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('List all commands'),
  cooldown: 3,
  async execute(message, args, client) {
    const isSlash = message.isChatInputCommand;
    const prefix = client.config.prefix;

    const categories = {
      'Moderation': {
        cmds: ['ban', 'kick', 'mute', 'warn', 'warnings', 'purge', 'nick', 'slowmode', 'lock', 'unlock'],
        desc: 'Kick, ban, mute, warn, purge, slowmode, lock/unlock',
      },
      'Anti-Scam & Security': {
        cmds: ['antiscam', 'verification', 'raid'],
        desc: 'Scam detection, verification system, raid protection',
        slashExamples: '/antiscam enable | /verification channel #channel | /raid threshold count:10',
      },
      'Utility': {
        cmds: ['ping', 'help', 'avatar', 'userinfo', 'serverinfo', 'poll', 'remind', 'level', 'msg'],
        desc: 'Info commands, polls, reminders, leveling',
      },
      'Fun': {
        cmds: ['8ball', 'roll', 'decide', 'say', 'reverse'],
        desc: '8ball, dice roll, random decision, say, reverse',
      },
      'Setup': {
        cmds: ['setup', 'setwelcome', 'setgoodbye', 'setlog', 'setprefix', 'setautorole', 'automod'],
        desc: 'Server configuration, welcome/goodbye, logging, auto-mod',
        slashExamples: '/setup | /setwelcome channel:#channel message:Hello {user}! | /automod antispam on',
      },
      'Custom Commands': {
        cmds: ['addcommand', 'removecommand', 'listcommands'],
        desc: 'Create, remove, and list custom commands',
      },
      'Reaction Roles': {
        cmds: ['reactionrole'],
        desc: 'Self-assignable reaction roles',
      },
      'Events': {
        cmds: ['giveaway', 'ticket'],
        desc: 'Giveaways and ticket system',
        slashExamples: '/ticket setup category:#channel support-role:@role | /ticket panel channel:#channel',
      },
    };

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('Command List')
      .setDescription(
        isSlash
          ? 'Type `/` on mobile to see all commands with autocomplete!\nOr use the prefix `!` on desktop.'
          : `Use the prefix \`${prefix}\` before each command.\nOr type \`/\` on mobile for autocomplete!`
      )
      .setTimestamp();

    for (const [cat, data] of Object.entries(categories)) {
      const cmdList = data.cmds.map(c => `\`${c}\``).join(', ');
      let value = cmdList;
      if (data.desc) value += `\n${data.desc}`;
      if (data.slashExamples) value += `\n**Slash:** \`${data.slashExamples}\``;
      embed.addFields({ name: cat, value });
    }

    embed.addFields(
      { name: 'Auto-Mod Toggles', value: [
        '`!automod automod` / `/automod feature:automod`',
        '`!automod antispam` / `/automod feature:antispam`',
        '`!automod antilink` / `/automod feature:antilink`',
        '`!automod antiscam` / `/automod feature:antiscam`',
        '`!automod accountagegate` / `/automod feature:accountagegate`',
        '`!automod newmemberrestriction` / `/automod feature:newmemberrestriction`',
        '`!automod duplicate` / `/automod feature:duplicate`',
        '`!automod linkcheck` / `/automod feature:linkcheck`',
        '`!automod massmention` / `/automod feature:massmention`',
        '',
        'Usage: `!automod <feature> on/off` or `/automod feature:<name> toggle:on`',
      ].join('\n'), inline: false },
    );

    if (!isSlash) {
      embed.setFooter({ text: 'Tip: Type / on mobile for easy command access!' });
    }

    message.reply({ embeds: [embed] });
  },
};
