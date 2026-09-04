const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const afkUsers = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set or remove your AFK status')
    .addStringOption(opt => opt.setName('reason').setDescription('AFK reason')),
  cooldown: 3,
  async execute(message, args, client) {
    const isSlash = typeof message.options !== 'undefined' && message.isChatInputCommand;
    const reason = isSlash ? (message.options.getString('reason') || 'AFK') : (args.join(' ') || 'AFK');
    const key = `${message.guild.id}_${message.author.id}`;

    if (afkUsers.has(key)) {
      afkUsers.delete(key);
      const embed = new (require('discord.js').EmbedBuilder)()
        .setColor(0x22c55e)
        .setTitle('Welcome Back!')
        .setDescription(`${message.author}, your AFK has been removed.`);
      return message.reply({ embeds: [embed] });
    }

    afkUsers.set(key, { reason, since: Date.now() });
    const embed = new (require('discord.js').EmbedBuilder)()
      .setColor(0xeab308)
      .setTitle('AFK Set')
      .setDescription(`${message.author} is now AFK: **${reason}**`);
    message.reply({ embeds: [embed] });
  },
  afkUsers,
  checkAFK(message) {
    const key = `${message.guild.id}_${message.author.id}`;
    if (afkUsers.has(key)) {
      afkUsers.delete(key);
      message.reply({ embeds: [new (require('discord.js').EmbedBuilder)()
        .setColor(0x22c55e)
        .setTitle('Welcome Back!')
        .setDescription(`${message.author}, your AFK has been removed.`)] }).catch(() => {});
    }
    message.mentions.users.forEach(user => {
      const mentionKey = `${message.guild.id}_${user.id}`;
      const afkData = afkUsers.get(mentionKey);
      if (afkData) {
        const time = Math.floor((Date.now() - afkData.since) / 60000);
        message.reply({ embeds: [new (require('discord.js').EmbedBuilder)()
          .setColor(0xeab308)
          .setTitle('AFK User')
          .setDescription(`${user} is AFK: **${afkData.reason}** (${time}m ago)`)] }).catch(() => {});
      }
    });
  },
};
