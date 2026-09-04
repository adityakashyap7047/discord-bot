const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('members')
    .setDescription('Show member count breakdown'),
  cooldown: 5,
  async execute(message) {
    const guild = message.guild;
    const total = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humans = total - bots;
    const online = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const boosters = guild.premiumSubscriberCount || 0;

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('👥 Member Count')
      .addFields(
        { name: 'Total', value: `${total}`, inline: true },
        { name: 'Humans', value: `${humans}`, inline: true },
        { name: 'Bots', value: `${bots}`, inline: true },
        { name: 'Online', value: `${online}`, inline: true },
        { name: 'Boosters', value: `${boosters}`, inline: true },
        { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true }
      );
    message.reply({ embeds: [embed] });
  },
};
