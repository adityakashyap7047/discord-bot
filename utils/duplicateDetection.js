const { EmbedBuilder } = require('discord.js');

const messageCache = new Map();
const offenderCache = new Map();

function normalizeContent(content) {
  return content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/https?:\/\/[^\s]+/g, '[LINK]')
    .trim();
}

function trackMessage(message) {
  const guildId = message.guild.id;
  const normalized = normalizeContent(message.content);

  if (normalized.length < 20) return { isDuplicate: false };

  if (!messageCache.has(guildId)) messageCache.set(guildId, []);
  const cache = messageCache.get(guildId);

  const now = Date.now();
  const recentMessages = cache.filter(m => now - m.timestamp < 300000);

  const duplicate = recentMessages.find(m =>
    m.normalized === normalized && m.authorId !== message.author.id
  );

  if (duplicate) {
    cache.push({
      authorId: message.author.id,
      channelId: message.channel.id,
      normalized,
      timestamp: now,
      isDuplicate: true,
    });
    messageCache.set(guildId, recentMessages);

    return {
      isDuplicate: true,
      originalAuthor: duplicate.authorId,
      originalChannel: duplicate.channelId,
    };
  }

  const selfDuplicate = recentMessages.find(m =>
    m.normalized === normalized && m.authorId === message.author.id
  );

  if (selfDuplicate) {
    if (!offenderCache.has(guildId)) offenderCache.set(guildId, {});
    const offenders = offenderCache.get(guildId);
    if (!offenders[message.author.id]) offenders[message.author.id] = 0;
    offenders[message.author.id]++;

    cache.push({
      authorId: message.author.id,
      channelId: message.channel.id,
      normalized,
      timestamp: now,
      isDuplicate: true,
    });
    messageCache.set(guildId, recentMessages);

    return {
      isDuplicate: true,
      selfSpam: true,
      count: offenders[message.author.id],
    };
  }

  cache.push({
    authorId: message.author.id,
    channelId: message.channel.id,
    normalized,
    timestamp: now,
    isDuplicate: false,
  });

  if (cache.length > 500) {
    messageCache.set(guildId, cache.slice(-250));
  }

  return { isDuplicate: false };
}

function getOffenderCount(guildId, userId) {
  const offenders = offenderCache.get(guildId) || {};
  return offenders[userId] || 0;
}

function clearOffender(guildId, userId) {
  const offenders = offenderCache.get(guildId) || {};
  delete offenders[userId];
  offenderCache.set(guildId, offenders);
}

function getDuplicateStats(guildId) {
  const cache = messageCache.get(guildId) || [];
  const now = Date.now();
  const recent = cache.filter(m => now - m.timestamp < 3600000);
  const duplicates = recent.filter(m => m.isDuplicate);

  return {
    totalMessages: recent.length,
    duplicateMessages: duplicates.length,
    duplicateRate: recent.length > 0 ? ((duplicates.length / recent.length) * 100).toFixed(1) : 0,
  };
}

function clearGuildCache(guildId) {
  messageCache.delete(guildId);
  offenderCache.delete(guildId);
}

module.exports = {
  trackMessage,
  getOffenderCount,
  clearOffender,
  getDuplicateStats,
  clearGuildCache,
};
