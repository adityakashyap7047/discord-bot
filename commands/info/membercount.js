const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('membercount').setDescription('Show server member count'),
  cooldown: 3,
  async execute(message, args, client) {
    const guild = message.guild;
    const total = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humans = total - bots;
    const online = guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size;
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(`👥 ${guild.name} — Member Count`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: '📊 Total', value: `${total.toLocaleString()}`, inline: true },
        { name: '👤 Humans', value: `${humans.toLocaleString()}`, inline: true },
        { name: '🤖 Bots', value: `${bots.toLocaleString()}`, inline: true },
        { name: '🟢 Online', value: `${online.toLocaleString()}`, inline: true },
      )
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
