const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mutelist')
    .setDescription('List all currently muted members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,
  async execute(message) {
    if (!message.member.permissions.has('ModerateMembers')) {
      return message.reply({ embeds: [errorEmbed('No Permission', 'You need Moderate Members permission.')] });
    }

    const muted = message.guild.members.cache.filter(m => m.isCommunicationDisabled());
    if (muted.size === 0) return message.reply({ embeds: [errorEmbed('Muted', 'No members are currently muted.')] });

    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle('🔇 Muted Members')
      .setDescription(muted.map(m => {
        const ends = m.communicationDisabledUntil;
        const timeLeft = ends ? `<t:${Math.floor(ends.getTime() / 1000)}:R>` : 'Unknown';
        return `**${m.user.tag}** — ${timeLeft}`;
      }).join('\n'))
      .setFooter({ text: `${muted.size} muted member(s)` });

    message.reply({ embeds: [embed] });
  },
};
