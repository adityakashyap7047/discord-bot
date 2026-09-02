const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(opt => opt.setName('options').setDescription('Options separated by comma').setRequired(true)),
  cooldown: 10,
  async execute(message, args, client) {
    const question = args[0];
    const options = args.slice(1).join(' ').split(',').map(o => o.trim()).filter(Boolean);

    if (!question) return message.reply({ embeds: [errorEmbed('Error', 'Provide a question.')] });
    if (options.length < 2 || options.length > 10) return message.reply({ embeds: [errorEmbed('Error', 'Provide 2-10 options.')] });

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const desc = options.map((o, i) => `${emojis[i]} ${o}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`📊 ${question}`)
      .setDescription(desc)
      .setFooter({ text: `Poll by ${message.author.tag}` })
      .setTimestamp();

    const msg = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < options.length; i++) {
      await msg.react(emojis[i]);
    }
    message.delete().catch(() => {});
  },
};
