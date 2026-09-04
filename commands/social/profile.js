const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a user\'s profile card')
    .addUserOption(opt => opt.setName('user').setDescription('User to view')),
  cooldown: 5,
  async execute(message, args, client) {
    const db = client.db;
    const target = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(target.id);

    const key = `${message.guild.id}_${target.id}`;
    const economy = db.get('economy') || {};
    const ecoData = economy[key] || { balance: 0, bank: 0 };
    const totalBalance = ecoData.balance + ecoData.bank;

    const social = db.get('social') || {};
    const socialData = social[key] || {};
    const reputation = socialData.reputation || 0;
    const marriedTo = socialData.marriedTo || null;

    const levels = db.get('levels') || {};
    const levelData = levels[key] || { level: 1, xp: 0 };

    const accountAge = Math.floor((Date.now() - target.createdTimestamp) / (1000 * 60 * 60 * 24));
    const accountYears = Math.floor(accountAge / 365);
    const accountDays = accountAge % 365;

    const serverJoin = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A';
    const accountCreated = `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`;

    let marriageText = 'Single';
    if (marriedTo) {
      try {
        const spouse = await client.users.fetch(marriedTo);
        marriageText = `💍 ${spouse.username}`;
      } catch {
        marriageText = '💍 Unknown User';
      }
    }

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
        { name: '📈 Level', value: `Level **${levelData.level}**`, inline: true },
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
