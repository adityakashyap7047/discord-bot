const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/helpers');
const { getLevel } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder().setName('level').setDescription('Check your level'),
  cooldown: 3,
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const data = await getLevel(message.guild.id, user.id);
    if (!data) return message.reply({ embeds: [infoEmbed('Level', `${user.tag} has no level data yet.`)] });

    const xpNeeded = data.level * 100;
    const bar = '█'.repeat(Math.floor((data.xp / xpNeeded) * 20)) + '░'.repeat(20 - Math.floor((data.xp / xpNeeded) * 20));
    const embed = successEmbed('Level Info', `**${user.tag}**\nLevel: **${data.level}**\nXP: **${data.xp}/${xpNeeded}**\n[${bar}]`);
    message.reply({ embeds: [embed] });
  },
};
