const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('List all commands'),
  cooldown: 3,
  async execute(message, args, client) {
    const categories = {
      Moderation: ['kick', 'ban', 'mute', 'warn', 'warnings', 'purge', 'nick', 'slowmode', 'lock', 'unlock'],
      Utility: ['avatar', 'userinfo', 'serverinfo', 'ping', 'help', 'poll', 'remind', 'level'],
      Fun: ['8ball', 'roll', 'decide', 'say', 'reverse'],
      'Reaction Roles': ['reactionrole'],
      'Custom Commands': ['addcommand', 'removecommand', 'listcommands'],
      'Setup': ['setup', 'setwelcome', 'setgoodbye', 'setlog', 'setprefix', 'setautorole', 'automod', 'starboard'],
    };

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📋 Command List')
      .setDescription(`Use the prefix \`${client.config.prefix}\` before each command.`)
      .setTimestamp();

    for (const [cat, cmds] of Object.entries(categories)) {
      embed.addFields({ name: cat, value: cmds.map(c => `\`${c}\``).join(', ') });
    }

    message.reply({ embeds: [embed] });
  },
};
