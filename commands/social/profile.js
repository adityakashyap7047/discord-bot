const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEconomy, getLevel, getMarriage, getReputation } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a user\'s profile card')
    .addUserOption(opt => opt.setName('user').setDescription('User to view')),
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(target.id);

    const eco = getEconomy(message.guild.id, target.id);
    const totalBalance = (eco.wallet || 0) + (eco.bank || 0);

    const repData = getReputation(target.id);
    const reputation = repData.length;

    const marriage = getMarriage(target.id);
    let marriageText = 'Single';
    if (marriage) {
      const spouseId = marriage.user1 === target.id ? marriage.user2 : marriage.user1;
      try {
        const spouse = await client.users.fetch(spouseId);
        marriageText = `💍 ${spouse.username}`;
      } catch {
        marriageText = '💍 Unknown User';
      }
    }

    const levelData = getLevel(message.guild.id, target.id);
    const level = levelData ? levelData.level : 1;
    const xp = levelData ? levelData.xp : 0;

    const accountAge = Math.floor((Date.now() - target.createdTimestamp) / (1000 * 60 * 60 * 24));
    const accountYears = Math.floor(accountAge / 365);
    const accountDays = accountAge % 365;

    const serverJoin = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A';
    const accountCreated = `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`;

    const repBar = generateRepBar(reputation);

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(`${target.username}'s Profile`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👤 User', value: `${target}`, inline: true },
        { name: '📅 Joined Server', value: serverJoin, inline: true },
        { name: '🎂 Account Age', value: `${accountYears}y ${accountDays}d`, inline: true },
        { name: '⭐ Reputation', value: `${reputation} rep\n${repBar}`, inline: true },
        { name: '💰 Balance', value: `**${totalBalance.toLocaleString()}** coins`, inline: true },
        { name: '📈 Level', value: `Level **${level}** (${xp} XP)`, inline: true },
        { name: '💑 Status', value: marriageText, inline: true },
        { name: '📆 Created', value: accountCreated, inline: true },
        { name: '🆔 ID', value: target.id, inline: true },
      )
      .setFooter({ text: `${message.guild.name} Profile`, iconURL: message.guild.iconURL() })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

function generateRepBar(rep) {
  const maxRep = 100;
  const filled = Math.min(Math.floor((rep / maxRep) * 10), 10);
  const empty = 10 - filled;
  return '⭐'.repeat(filled) + '・'.repeat(empty);
}
