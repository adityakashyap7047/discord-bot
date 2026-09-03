const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const SUSPICIOUS_USERNAME_PATTERNS = [
  /^(.{2,15})(\d{4,})$/i,
  /^(.{2,15})_?(discord|admin|mod|staff|bot|official|verified)$/i,
  /^(.{2,15})#?\d{4,}$/i,
  /^(admin|mod|staff|official|support|help|team|service)/i,
  /(nitro|giveaway|free|reward|gift|prize)/i,
  /^(.{1,3})\d{5,}$/i,
];

const DISCORD_EPOCH = 1420070400000;

function getAccountAgeDays(user) {
  const accountId = BigInt(user.id);
  const accountCreation = Number((accountId >> 22n) + BigInt(DISCORD_EPOCH));
  const ageMs = Date.now() - accountCreation;
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

function isSuspiciousUsername(username) {
  const cleaned = username.replace(/[^a-zA-Z0-9]/g, '');
  for (const pattern of SUSPICIOUS_USERNAME_PATTERNS) {
    if (pattern.test(cleaned) || pattern.test(username)) {
      return true;
    }
  }
  return false;
}

function hasDefaultAvatar(user) {
  return user.avatar === null;
}

function isHighRiskAccount(member) {
  const reasons = [];
  const ageDays = getAccountAgeDays(member.user);

  if (ageDays < 7) reasons.push(`Account is only ${ageDays} days old`);
  if (isSuspiciousUsername(member.user.username)) reasons.push('Suspicious username pattern');
  if (hasDefaultAvatar(member.user)) reasons.push('No profile picture');
  if (member.roles.cache.size <= 1) reasons.push('No roles assigned');

  return {
    isHighRisk: reasons.length >= 2,
    reasons,
    accountAge: ageDays,
  };
}

function canSendLinks(member, settings) {
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  if (!settings.newMemberRestriction) return true;

  const ageDays = getAccountAgeDays(member.user);
  const restrictDays = settings.newMemberRestrictionDays || 1;
  return ageDays >= restrictDays;
}

function canSendEmbeds(member, settings) {
  return canSendLinks(member, settings);
}

function canSendImages(member, settings) {
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  if (!settings.newMemberRestriction) return true;

  const ageDays = getAccountAgeDays(member.user);
  const restrictDays = settings.newMemberRestrictionDays || 1;
  return ageDays >= restrictDays;
}

function getAgeRestrictionMessage(member, settings) {
  const ageDays = getAccountAgeDays(member.user);
  const restrictDays = settings.newMemberRestrictionDays || 1;
  const daysLeft = restrictDays - ageDays;
  return `Your account is too new (${ageDays} days old). You can send links/embeds/images in ${daysLeft} more day(s).`;
}

module.exports = {
  getAccountAgeDays,
  isSuspiciousUsername,
  hasDefaultAvatar,
  isHighRiskAccount,
  canSendLinks,
  canSendEmbeds,
  canSendImages,
  getAgeRestrictionMessage,
  SUSPICIOUS_USERNAME_PATTERNS,
};
