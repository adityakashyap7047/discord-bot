const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('List all commands'),
  cooldown: 3,
  async execute(message, args, client) {
    const categories = {
      Moderation: ['ban', 'kick', 'mute', 'warn', 'warnings', 'purge', 'nick', 'slowmode', 'lock', 'unlock'],
      'Anti-Scam & Security': ['antiscam', 'verification', 'raid'],
      Utility: ['ping', 'help', 'avatar', 'userinfo', 'serverinfo', 'poll', 'remind', 'level', 'msg'],
      Fun: ['8ball', 'roll', 'decide', 'say', 'reverse'],
      Setup: ['setup', 'setwelcome', 'setgoodbye', 'setlog', 'setprefix', 'setautorole', 'automod', 'starboard'],
      'Custom Commands': ['addcommand', 'removecommand', 'listcommands'],
      'Reaction Roles': ['reactionrole'],
    };

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('Command List')
      .setDescription(`Use the prefix \`${client.config.prefix}\` before each command.`)
      .setTimestamp();

    for (const [cat, cmds] of Object.entries(categories)) {
      embed.addFields({ name: cat, value: cmds.map(c => `\`${c}\``).join(', ') });
    }

    embed.addFields(
      { name: 'Auto-Mod Toggles', value: '`!automod automod` `!automod antispam` `!automod antilink` `!automod antiscam` `!automod accountagegate` `!automod newmemberrestriction` `!automod newmembertimeout` `!automod duplicate` `!automod linkcheck` `!automod suspiciousname` `!automod massmention`\nUsage: `!automod <feature> on/off`', inline: false },
      { name: 'Prank', value: '`@BotBoy nitro` — Sends a fake Nitro gift (mention bot + type "nitro")', inline: false },
    );

    message.reply({ embeds: [embed] });
  },
};
