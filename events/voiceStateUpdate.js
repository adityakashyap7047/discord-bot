const { Events, EmbedBuilder } = require('discord.js');
const { getGuildSettings, addLog } = require('../utils/database');

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState, newState) {
    if (newState.member?.user?.bot || oldState.channelId === newState.channelId) return;
    const guild = newState.guild;
    const settings = await getGuildSettings(guild.id);
    if (!settings.logChannel || !settings.voiceChannelLog) return;
    const channel = guild.channels.cache.get(settings.logChannel);
    if (!channel) return;
    const action = newState.channelId ? (oldState.channelId ? 'Moved Voice Channel' : 'Joined Voice Channel') : 'Left Voice Channel';
    const location = newState.channel || oldState.channel;
    await channel.send({ embeds: [new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle(action)
      .setDescription(`${newState.member} ${action.toLowerCase()}: ${location}`)
      .setTimestamp()] }).catch(() => {});
    addLog(guild.id, 'voice', null, newState.member.id, action, { channelId: location?.id || null });
  },
};
