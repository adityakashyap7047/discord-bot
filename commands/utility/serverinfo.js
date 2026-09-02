const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Get server information'),
  cooldown: 3,
  async execute(message, args, client) {
    const g = message.guild;
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Server Info: ${g.name}`)
      .setThumbnail(g.iconURL({ dynamic: true }))
      .addFields(
        { name: 'ID', value: g.id, inline: true },
        { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: 'Members', value: String(g.memberCount), inline: true },
        { name: 'Channels', value: String(g.channels.cache.size), inline: true },
        { name: 'Roles', value: String(g.roles.cache.size), inline: true },
        { name: 'Emojis', value: String(g.emojis.cache.size), inline: true },
        { name: 'Boosts', value: String(g.premiumSubscriptionCount || 0), inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Verification Level', value: String(g.verificationLevel), inline: true },
      )
      .setTimestamp();
    if (g.bannerURL()) embed.setImage(g.bannerURL({ dynamic: true }));
    message.reply({ embeds: [embed] });
  },
};
