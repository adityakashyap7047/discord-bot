const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const fakeHackSteps = [
  '🔍 Scanning target...',
  '🌐 Bypassing firewall...',
  '💉 Injecting payload...',
  '🔓 Cracking encryption...',
  '📡 Intercepting data streams...',
  '💉 Compromising database...',
  '🗂️ Extracting classified files...',
  '🧹 Covering tracks...',
  '✅ Hack complete! Just kidding, this is a prank.',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hack')
    .setDescription('Simulate hacking a user (prank)')
    .addUserOption(opt => opt.setName('user').setDescription('User to "hack"').setRequired(true)),
  cooldown: 10,
  async execute(message, args, client) {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Mention someone to "hack"!');
    if (user.id === client.user.id) return message.reply('Nice try! I hack hackers! 🤖');
    if (user.id === message.author.id) return message.reply("You can't hack yourself! 😂");

    const msg = await message.reply(`💉 Initializing hack on **${user.username}**...`);

    for (let i = 0; i < fakeHackSteps.length; i++) {
      await new Promise(r => setTimeout(r, 1500));
      await msg.edit(`\`${fakeHackSteps[i]}\``).catch(() => {});
    }

    const fakePasswords = ['ilovecats123', 'password123', 'hunter2', 'letmein', 'qwerty', '123456'];
    const fakeEmail = `${user.username}@gmail.com`;

    const embed = new EmbedBuilder()
      .setColor('#22c55e')
      .setTitle('💀 HACK COMPLETE')
      .setDescription(`Successfully hacked **${user.username}**`)
      .addFields(
        { name: '📧 Email', value: `\`${fakeEmail}\``, inline: true },
        { name: '🔑 Password', value: `\`${fakePasswords[Math.floor(Math.random() * fakePasswords.length)]}\``, inline: true },
        { name: '📱 Phone', value: `\`+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}\``, inline: true },
        { name: '🏠 IP Address', value: `\`${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}\``, inline: true },
        { name: '💳 Credit Card', value: `\`${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}\``, inline: true },
      )
      .setFooter({ text: '⚠️ This is all fake! Just a prank!' })
      .setTimestamp();

    await msg.edit({ content: null, embeds: [embed] });
  },
};
