const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addLog } = require('./database');

const raidCache = new Map();
const lockdownCache = new Map();

function trackJoin(guildId) {
  if (!raidCache.has(guildId)) raidCache.set(guildId, []);
  const joins = raidCache.get(guildId);
  joins.push(Date.now());
  const now = Date.now();
  const filtered = joins.filter(t => now - t < 60000);
  raidCache.set(guildId, filtered);
  return filtered.length;
}

function getJoinsInTimeframe(guildId, timeframeSeconds) {
  if (!raidCache.has(guildId)) return 0;
  const joins = raidCache.get(guildId);
  const now = Date.now();
  return joins.filter(t => now - t < timeframeSeconds * 1000).length;
}

function isLockdown(guildId) {
  return lockdownCache.has(guildId) && lockdownCache.get(guildId) > Date.now();
}

function setLockdown(guildId, durationMs) {
  lockdownCache.set(guildId, Date.now() + durationMs);
}

function clearLockdown(guildId) {
  lockdownCache.delete(guildId);
}

function getLockdownTimeRemaining(guildId) {
  if (!lockdownCache.has(guildId)) return 0;
  const remaining = lockdownCache.get(guildId) - Date.now();
  if (remaining <= 0) {
    lockdownCache.delete(guildId);
    return 0;
  }
  return remaining;
}

async function checkRaid(member, settings, client) {
  if (!settings.raidProtection) return { triggered: false };

  const guildId = member.guild.id;
  const joinCount = trackJoin(guildId);
  const threshold = settings.raidThreshold || 5;
  const timeframe = settings.raidTimeframe || 60;

  const joinsInTimeframe = getJoinsInTimeframe(guildId, timeframe);

  if (joinsInTimeframe >= threshold && !isLockdown(guildId)) {
    const lockdownDuration = settings.raidLockdownDuration || 300000;
    setLockdown(guildId, lockdownDuration);

    await applyLockdown(member.guild, settings, client);

    return {
      triggered: true,
      joinCount: joinsInTimeframe,
      threshold,
      timeframe,
    };
  }

  if (isLockdown(guildId)) {
    await member.kick('Raid protection: Server is in lockdown').catch(() => {});
    return {
      triggered: true,
      inLockdown: true,
    };
  }

  return { triggered: false };
}

async function applyLockdown(guild, settings, client) {
  const { EmbedBuilder } = require('discord.js');

  for (const [, channel] of guild.channels.cache) {
    if (channel.isTextBased() && !channel.isVoiceBased()) {
      try {
        await channel.permissionOverwrites.edit(guild.id, {
          SendMessages: false,
        }).catch(() => {});
      } catch (e) {}
    }
  }

  if (settings.scamLogChannel || settings.logChannel) {
    const logChId = settings.scamLogChannel || settings.logChannel;
    const logCh = guild.channels.cache.get(logChId);
    if (logCh) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚨 RAID DETECTED - Server Locked Down')
        .setDescription(`A raid has been detected. All text channels are now locked.`)
        .addFields(
          { name: 'Threshold', value: `${settings.raidThreshold || 5} joins per ${settings.raidTimeframe || 60}s`, inline: true },
          { name: 'Duration', value: `${(settings.raidLockdownDuration || 300000) / 60000} minutes`, inline: true },
        )
        .setTimestamp();
      logCh.send({ embeds: [embed] }).catch(() => {});
    }
  }

  addLog(guild.id, 'raid', client.user.id, null, 'Raid detected - server locked down', {
    threshold: settings.raidThreshold || 5,
    timeframe: settings.raidTimeframe || 60,
  });

  setTimeout(async () => {
    try {
      clearLockdown(guild.id);
      for (const [, channel] of guild.channels.cache) {
        if (channel.isTextBased() && !channel.isVoiceBased()) {
          await channel.permissionOverwrites.edit(guild.id, {
            SendMessages: null,
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('[RAID] Lockdown release error:', e);
    }
  }, settings.raidLockdownDuration || 300000);
}

function hasMassMentions(content, limit) {
  const mentionRegex = /@(everyone|here|!?\d{17,19})/g;
  const mentions = content.match(mentionRegex) || [];
  return mentions.length > (limit || 5);
}

function getMentionCount(content) {
  const mentionRegex = /@(everyone|here|!?\d{17,19})/g;
  return (content.match(mentionRegex) || []).length;
}

module.exports = {
  trackJoin,
  getJoinsInTimeframe,
  isLockdown,
  setLockdown,
  clearLockdown,
  getLockdownTimeRemaining,
  checkRaid,
  applyLockdown,
  hasMassMentions,
  getMentionCount,
};
