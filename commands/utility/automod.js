const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder().setName('automod').setDescription('Toggle auto-moderation features'),
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription('❌ You need **Manage Server** permission.')],
      });
    }

    const feature = args[0]?.toLowerCase();
    const toggle = args[1]?.toLowerCase();

    const features = {
      'automod': 'autoMod',
      'antispam': 'antiSpam',
      'antilink': 'antiLink',
      'antiscam': 'antiScam',
      'accountagegate': 'accountAgeGate',
      'newmemberrestriction': 'newMemberRestriction',
      'newmembertimeout': 'newMemberTimeout',
      'duplicate': 'duplicateDetection',
      'linkcheck': 'linkReputationCheck',
      'suspiciousname': 'suspiciousUsernameDetection',
      'massmention': 'massMentionLimit',
    };

    if (!feature || !features[feature]) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Auto-Mod Features')
        .setDescription('Use: `!automod <feature> on/off`')
        .addFields(
          { name: 'Basic', value: '`automod` `antispam` `antilink` `antiscam`', inline: false },
          { name: 'Account Protection', value: '`accountagegate` `newmemberrestriction` `newmembertimeout`', inline: false },
          { name: 'Content Filtering', value: '`duplicate` `linkcheck` `suspiciousname` `massmention`', inline: false },
        );
      return message.reply({ embeds: [embed] });
    }

    if (!toggle || !['on', 'off'].includes(toggle)) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription('❌ Toggle: `on` or `off`')],
      });
    }

    const key = features[feature];
    if (key === 'massMentionLimit') {
      await updateGuildSetting(message.guild.id, key, toggle === 'on' ? 5 : 0);
    } else {
      await updateGuildSetting(message.guild.id, key, toggle === 'on');
    }

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#00ff00')
        .setDescription(`✅ **${feature}** is now **${toggle}**`)],
    });
  },
};
