const { Events, Collection, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, getCustomCommand, getLevel, updateLevel, addLog } = require('../utils/database');
const { detectScam, getScamDescription } = require('../utils/scamPatterns');
const { canSendLinks, canSendImages, getAgeRestrictionMessage } = require('../utils/accountChecks');
const { hasMassMentions, getMentionCount } = require('../utils/raidProtection');
const { trackMessage } = require('../utils/duplicateDetection');
const { checkMessage } = require('../utils/linkChecker');
const afkCmd = require('../commands/utility/afk');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.member) return;

    // AFK check
    try { afkCmd.checkAFK(message); } catch(e) { console.error('[AFK ERROR]', e.message); }

    const settings = getGuildSettings(message.guild.id);
    const prefix = settings.prefix || client.config.prefix;

    // New Member Restrictions - Links
    if (settings.newMemberRestriction && !canSendLinks(message.member, settings)) {
      if (/https?:\/\/[^\s]+/.test(message.content)) {
        await message.delete().catch(() => {});
        return message.channel.send({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`🚫 ${getAgeRestrictionMessage(message.member, settings)}`)
            .setFooter({ text: 'New Member Restriction' })],
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      }
    }

    // New Member Restrictions - Images/Attachments
    if (settings.newMemberRestriction && !canSendImages(message.member, settings)) {
      if (message.attachments.size > 0) {
        await message.delete().catch(() => {});
        return message.channel.send({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`🚫 ${getAgeRestrictionMessage(message.member, settings)}`)
            .setFooter({ text: 'New Member Restriction' })],
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      }
    }

    // Auto-moderation
    if (settings.autoMod) {
      const badWords = ['slur', 'nword', 'retard'];
      const lowerContent = message.content.toLowerCase();
      if (badWords.some(w => lowerContent.includes(w))) {
        await message.delete().catch(() => {});
        return message.channel.send('🚫 Message deleted: Contains banned words.').then(m => setTimeout(() => m.delete(), 5000));
      }
    }

    // Anti-Spam
    if (settings.antiSpam) {
      if (!client.spamCache) client.spamCache = new Map();
      const userSpam = client.spamCache.get(message.author.id) || [];
      userSpam.push(Date.now());
      const filtered = userSpam.filter(t => Date.now() - t < (settings.floodTimeframe || 5) * 1000);
      client.spamCache.set(message.author.id, filtered);
      if (filtered.length > (settings.floodLimit || 5)) {
        await message.delete().catch(() => {});
        return message.channel.send('🚫 Anti-spam: Slow down!').then(m => setTimeout(() => m.delete(), 3000));
      }
    }

    // Anti-Link
    if (settings.antiLink) {
      if (/https?:\/\/[^\s]+/.test(message.content) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        await message.delete().catch(() => {});
        return message.channel.send('🚫 Links are not allowed here.').then(m => setTimeout(() => m.delete(), 3000));
      }
    }

    // Mass Mention Protection
    if (settings.massMentionLimit && hasMassMentions(message.content, settings.massMentionLimit)) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        await message.delete().catch(() => {});
        const mentionCount = getMentionCount(message.content);
        return message.channel.send({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`🚫 Too many mentions! (${mentionCount} max: ${settings.massMentionLimit})`)
            .setFooter({ text: 'Mass Mention Protection' })],
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
      }
    }

    // Duplicate Message Detection
    if (settings.duplicateDetection) {
      const dupResult = trackMessage(message);
      if (dupResult.isDuplicate) {
        await message.delete().catch(() => {});
        return message.channel.send({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`🚫 Duplicate message detected! ${dupResult.selfSpam ? 'Stop spamming the same message.' : ''}`)
            .setFooter({ text: 'Duplicate Detection' })],
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
      }
    }

    // Link Reputation Check
    if (settings.linkReputationCheck && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const linkResult = checkMessage(message.content);
      if (linkResult.isHighRisk) {
        await message.delete().catch(() => {});
        return message.channel.send({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`🚫 Suspicious link detected and blocked!`)
            .addFields(
              linkResult.results.filter(r => r.isHighRisk).map(r => ({
                name: r.domain || 'Unknown',
                value: r.issues.join(', ') || 'High risk',
                inline: true,
              })),
            )
            .setFooter({ text: 'Link Reputation Check' })],
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      }
    }

    // Anti-Scam
    if (settings.antiScam) {
      const scamResult = detectScam(message.content);
      if (scamResult.isScam) {
        if (settings.scamWhitelist && settings.scamWhitelist.includes(message.author.id)) {
          return;
        }

        await message.delete().catch(() => {});

        const description = getScamDescription(scamResult.categories);

        if (settings.scamAction === 'mute' && settings.mutedRole) {
          await message.member.roles.add(settings.mutedRole).catch(() => {});
        } else if (settings.scamAction === 'kick') {
          await message.member.kick('Anti-scam: Posting scam content').catch(() => {});
        } else if (settings.scamAction === 'ban') {
          await message.member.ban({ reason: 'Anti-scam: Posting scam content' }).catch(() => {});
        }

        const logEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🚨 Scam Message Detected')
          .setDescription(description)
          .addFields(
            { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Channel', value: `${message.channel}`, inline: true },
            { name: 'Confidence', value: `${scamResult.confidence}%`, inline: true },
            { name: 'Action Taken', value: settings.scamAction || 'delete', inline: true },
            { name: 'Content', value: message.content.substring(0, 500) || 'No text content' },
          )
          .setTimestamp();

        const logChannelId = settings.scamLogChannel || settings.scamAlertsChannel;
        if (logChannelId) {
          const logCh = message.guild.channels.cache.get(logChannelId);
          if (logCh) logCh.send({ embeds: [logEmbed] }).catch(() => {});
        }

        addLog(message.guild.id, 'scam', client.user.id, message.author.id, description, {
          content: message.content,
          channel: message.channel.id,
          confidence: scamResult.confidence,
          categories: scamResult.categories,
        });

        const warningMsg = await message.channel.send({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`🚫 **Scam message blocked!** ${message.author}, this type of content is not allowed.`)
            .setFooter({ text: 'Anti-Scam Protection' })],
        });
        setTimeout(() => warningMsg.delete().catch(() => {}), 5000);

        return;
      }
    }

    // Bot mention + "nitro" trigger
    const botMention = message.mentions.users.first();
    if (botMention && botMention.id === client.user.id) {
      const textAfterMention = message.content.replace(/<@!?\d+>/g, '').trim().toLowerCase();
      if (textAfterMention === 'nitro') {
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('You received a gift!')
          .setDescription('You have been gifted **Nitro** from a friend!\n\n**Nitro** — Compare Nitro perks')
          .setThumbnail('https://discordassets.com/assets/nitro-star.77cd4e187900.svg')
          .setFooter({ text: 'This gift link is valid for 48 hours.' })
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`nitro_prank_${message.author.id}`)
            .setLabel('Claim')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎁'),
        );
        message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
        return;
      }
    }

    // Level system
    if (settings.levelSystem && !message.content.startsWith(prefix)) {
      const xpGain = Math.floor(Math.random() * 15) + 5;
      let levelData = getLevel(message.guild.id, message.author.id);
      if (!levelData) {
        updateLevel(message.guild.id, message.author.id, xpGain, 1);
        levelData = { xp: xpGain, level: 1 };
      } else {
        const newXp = levelData.xp + xpGain;
        const xpNeeded = levelData.level * 100;
        if (newXp >= xpNeeded) {
          updateLevel(message.guild.id, message.author.id, 0, levelData.level + 1);
          const msg = (settings.levelUpMessage || '🎉 {user} leveled up to **Level {level}**!')
            .replace('{user}', `<@${message.author.id}>`)
            .replace('{level}', levelData.level + 1);
          if (settings.levelChannel) {
            const ch = message.guild.channels.cache.get(settings.levelChannel);
            if (ch) ch.send(msg);
          } else {
            message.channel.send(msg);
          }
        } else {
          updateLevel(message.guild.id, message.author.id, newXp, levelData.level);
        }
      }
      return;
    }

    if (!message.content.startsWith(prefix)) return;

    // Custom commands
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const customCmd = getCustomCommand(message.guild.id, commandName);
    if (customCmd) {
      return message.channel.send(customCmd.response.replace('{user}', `<@${message.author.id}>`));
    }

    const command = client.commands.get(commandName);
    if (!command) return;

    // Cooldowns
    if (!client.cooldowns.has(command.data.name)) {
      client.cooldowns.set(command.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.data.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`Please wait ${timeLeft.toFixed(1)}s before using \`${command.data.name}\` again.`).catch(() => {});
      }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`[COMMAND ERROR] ${command.data.name}:`, error.message || error);
      message.reply('There was an error executing that command!').catch(() => {});
    }
  },
};
