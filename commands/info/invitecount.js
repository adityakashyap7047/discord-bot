const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invitecount')
    .setDescription('Check invite count for a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to check')),
  cooldown: 3,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    try {
      const invites = await message.guild.invites.fetch();
      const userInvites = invites.filter(inv => inv.inviter?.id === target.id);
      let total = 0;
      let regular = 0;
      let boost = 0;
      let fake = 0;
      userInvites.forEach(inv => {
        total += inv.uses;
        if (inv.type) boost += inv.uses;
        else regular += inv.uses;
      });
      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle(`🎟️ ${target.username}'s Invites`)
        .addFields(
          { name: '📊 Total', value: `${total}`, inline: true },
          { name: '🔗 Regular', value: `${regular}`, inline: true },
          { name: '⭐ Boost', value: `${boost}`, inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [embed] });
    } catch (e) {
      message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Could not fetch invites.')] });
    }
  },
};
