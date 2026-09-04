const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot invite link'),
  cooldown: 3,
  async execute(message, args, client) {
    const link = `https://discord.com/api/oauth2/authorize?client_id=${client.config.clientId}&permissions=8&scope=bot%20applications.commands`;
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('📨 Invite Me!')
      .setDescription(`[Click here to add me to your server](${link})`)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};
