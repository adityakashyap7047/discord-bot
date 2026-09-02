const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  cooldown: 3,
  async execute(message, args, client) {
    const sent = await message.reply('Pinging...');
    const ping = sent.createdTimestamp - message.createdTimestamp;
    const embed = new EmbedBuilder()
      .setColor(ping < 200 ? 0x00ff00 : ping < 500 ? 0xffff00 : 0xff0000)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Latency', value: `${ping}ms`, inline: true },
        { name: 'API', value: `${client.ws.ping}ms`, inline: true },
      );
    sent.edit({ content: null, embeds: [embed] });
  },
};
