const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'bot.json');

let cache = null;

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function getDefaultDB() {
  return {
    guild_settings: {},
    warnings: [],
    reaction_roles: [],
    custom_commands: [],
    level_system: [],
    starboard: [],
    reminders: [],
    invites: {},
    tempbans: [],
    logs: [],
    embeds: [],
    autoroles: [],
    goodbye_config: {},
    welcome_config: {},
    economy: [],
    inventories: [],
    profiles: {},
    marriages: [],
    reputation: [],
    notes: [],
  };
}

function loadDB() {
  if (cache) return cache;
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    cache = getDefaultDB();
    saveDB(cache);
    return cache;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch (err) {
    console.error('[DB] Failed to parse bot.json, creating backup and resetting:', err.message);
    try {
      fs.copyFileSync(DB_FILE, DB_FILE + '.corrupt.' + Date.now());
    } catch (_) {}
    cache = getDefaultDB();
    saveDB(cache);
  }
  return cache;
}

function saveDB(data) {
  cache = data;
  ensureDir();
  const tmp = DB_FILE + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.error('[DB] Failed to save:', err.message);
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

function getGuildSettings(guildId) {
  const db = loadDB();
  if (!db.guild_settings[guildId]) {
    db.guild_settings[guildId] = {
      guildId,
      prefix: '!',
      welcomeEnabled: false,
      welcomeChannel: null,
      welcomeMessage: 'Welcome {user} to {server}! You are member #{memberCount}.',
      welcomeEmbed: false,
      welcomeColor: '#00ff00',
      welcomeImage: '',
      goodbyeEnabled: false,
      goodbyeChannel: null,
      goodbyeMessage: 'Goodbye {user}! We will miss you.',
      goodbyeEmbed: false,
      goodbyeColor: '#ff0000',
      goodbyeImage: '',
      modLogChannel: null,
      modLogEnabled: false,
      autoRole: null,
      autoRoleEnabled: false,
      autoMod: false,
      antiSpam: false,
      antiLink: false,
      antiRaid: false,
      antiScam: false,
      scamLogChannel: null,
      scamAction: 'delete',
      scamWhitelist: [],
      mutedRole: null,
      logChannel: null,
      logMessages: false,
      logJoins: false,
      logBans: false,
      logEdits: false,
      starboardChannel: null,
      starboardEnabled: false,
      starboardThreshold: 3,
      levelSystem: false,
      levelChannel: null,
      levelUpMessage: '🎉 {user} leveled up to **Level {level}**!',
      inviteTracker: false,
      inviteLogChannel: null,
      autoroleEnabled: false,
      autoroleId: null,
      voiceChannelLog: false,
      floodLimit: 5,
      floodTimeframe: 5,
      welcomeRoles: [],
      boostMessage: '',
      boostChannel: null,
      customReactions: [],
      disabledCommands: [],
      commandAliases: {},
      accountAgeGate: false,
      minAccountAge: 7,
      newMemberRestriction: false,
      newMemberRestrictionDays: 1,
      newMemberTimeout: false,
      newMemberTimeoutDuration: 60000,
      verificationEnabled: false,
      verificationChannel: null,
      verificationRole: null,
      verificationMessage: 'Welcome! Please react with ✅ to verify.',
      raidProtection: false,
      raidThreshold: 5,
      raidTimeframe: 60,
      raidLockdownDuration: 300000,
      massMentionLimit: 5,
      duplicateDetection: false,
      suspiciousUsernameDetection: false,
      linkReputationCheck: false,
      scamAlertsChannel: null,
    };
    saveDB(db);
  }
  return db.guild_settings[guildId];
}

function updateGuildSetting(guildId, key, value) {
  const db = loadDB();
  if (!db.guild_settings[guildId]) getGuildSettings(guildId);
  db.guild_settings[guildId][key] = value;
  saveDB(db);
}

function updateGuildSettings(guildId, updates) {
  const db = loadDB();
  if (!db.guild_settings[guildId]) getGuildSettings(guildId);
  Object.assign(db.guild_settings[guildId], updates);
  saveDB(db);
}

function addWarning(guildId, userId, moderatorId, reason) {
  const db = loadDB();
  db.warnings.push({ guildId, userId, moderatorId, reason, timestamp: new Date().toISOString() });
  saveDB(db);
}

function getWarnings(guildId, userId) {
  const db = loadDB();
  return db.warnings.filter(w => w.guildId === guildId && w.userId === userId);
}

function clearWarnings(guildId, userId) {
  const db = loadDB();
  db.warnings = db.warnings.filter(w => !(w.guildId === guildId && w.userId === userId));
  saveDB(db);
}

function addReactionRole(guildId, channelId, messageId, emoji, roleId) {
  const db = loadDB();
  db.reaction_roles.push({ guildId, channelId, messageId, emoji, roleId });
  saveDB(db);
}

function getReactionRoles(guildId) {
  const db = loadDB();
  return db.reaction_roles.filter(r => r.guildId === guildId);
}

function removeReactionRole(guildId, messageId, emoji) {
  const db = loadDB();
  db.reaction_roles = db.reaction_roles.filter(r => !(r.guildId === guildId && r.messageId === messageId && r.emoji === emoji));
  saveDB(db);
}

function getReactionRole(guildId, messageId, emoji) {
  const db = loadDB();
  return db.reaction_roles.find(r => r.guildId === guildId && r.messageId === messageId && r.emoji === emoji);
}

function addCustomCommand(guildId, name, response, createdBy) {
  const db = loadDB();
  const idx = db.custom_commands.findIndex(c => c.guildId === guildId && c.name === name);
  if (idx >= 0) {
    db.custom_commands[idx].response = response;
    db.custom_commands[idx].updatedBy = createdBy;
    db.custom_commands[idx].updatedAt = new Date().toISOString();
  } else {
    db.custom_commands.push({ guildId, name, response, createdBy, createdAt: new Date().toISOString() });
  }
  saveDB(db);
}

function removeCustomCommand(guildId, name) {
  const db = loadDB();
  db.custom_commands = db.custom_commands.filter(c => !(c.guildId === guildId && c.name === name));
  saveDB(db);
}

function getCustomCommand(guildId, name) {
  const db = loadDB();
  return db.custom_commands.find(c => c.guildId === guildId && c.name === name);
}

function getCustomCommands(guildId) {
  const db = loadDB();
  return db.custom_commands.filter(c => c.guildId === guildId);
}

function getLevel(guildId, userId) {
  const db = loadDB();
  return db.level_system.find(l => l.guildId === guildId && l.userId === userId);
}

function updateLevel(guildId, userId, xp, level) {
  const db = loadDB();
  const idx = db.level_system.findIndex(l => l.guildId === guildId && l.userId === userId);
  if (idx >= 0) {
    db.level_system[idx].xp = xp;
    db.level_system[idx].level = level;
  } else {
    db.level_system.push({ guildId, userId, xp, level });
  }
  saveDB(db);
}

function getLeaderboard(guildId) {
  const db = loadDB();
  return db.level_system
    .filter(l => l.guildId === guildId)
    .sort((a, b) => (b.level * 100 + b.xp) - (a.level * 100 + a.xp))
    .slice(0, 20);
}

function addReminder(userId, channelId, reminder, remindAt) {
  const db = loadDB();
  db.reminders.push({ userId, channelId, reminder, remindAt });
  saveDB(db);
}

function removeReminder(userId, reminder) {
  const db = loadDB();
  db.reminders = db.reminders.filter(r => !(r.userId === userId && r.reminder === reminder));
  saveDB(db);
}

function addInvite(guildId, code, inviterId, uses) {
  const db = loadDB();
  if (!db.invites) db.invites = {};
  if (!db.invites[guildId]) db.invites[guildId] = {};
  db.invites[guildId][code] = { inviterId, uses, created: new Date().toISOString() };
  saveDB(db);
}

function updateInvite(guildId, code, uses) {
  const db = loadDB();
  if (db.invites[guildId] && db.invites[guildId][code]) {
    db.invites[guildId][code].uses = uses;
    saveDB(db);
  }
}

function getInvites(guildId) {
  const db = loadDB();
  return db.invites[guildId] || {};
}

function getInviteLeaderboard(guildId) {
  const db = loadDB();
  const invites = db.invites[guildId] || {};
  const counts = {};
  for (const [code, data] of Object.entries(invites)) {
    if (!counts[data.inviterId]) counts[data.inviterId] = 0;
    counts[data.inviterId] += data.uses || 0;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([userId, uses]) => ({ userId, uses }));
}

function addTempban(guildId, userId, expiresAt) {
  const db = loadDB();
  if (!db.tempbans) db.tempbans = [];
  db.tempbans.push({ guildId, userId, expiresAt });
  saveDB(db);
}

function removeTempban(guildId, userId) {
  const db = loadDB();
  db.tempbans = (db.tempbans || []).filter(t => !(t.guildId === guildId && t.userId === userId));
  saveDB(db);
}

function getTempbans(guildId) {
  const db = loadDB();
  return (db.tempbans || []).filter(t => t.guildId === guildId);
}

function addLog(guildId, type, moderatorId, targetId, reason, details) {
  const db = loadDB();
  if (!db.logs) db.logs = [];
  db.logs.push({ guildId, type, moderatorId, targetId, reason, details, timestamp: new Date().toISOString() });
  if (db.logs.length > 500) db.logs = db.logs.slice(-500);
  saveDB(db);
}

function getLogs(guildId, type, limit = 50) {
  const db = loadDB();
  return (db.logs || [])
    .filter(l => l.guildId === guildId && (!type || l.type === type))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

function getStarboard(guildId, messageId) {
  const db = loadDB();
  return db.starboard.find(s => s.guildId === guildId && s.messageId === messageId);
}

function addStarboard(guildId, messageId, starboardMessageId, stars) {
  const db = loadDB();
  db.starboard.push({ guildId, messageId, starboardMessageId, stars });
  saveDB(db);
}

function addEmbed(guildId, name, embedData, createdBy) {
  const db = loadDB();
  if (!db.embeds) db.embeds = [];
  const idx = db.embeds.findIndex(e => e.guildId === guildId && e.name === name);
  if (idx >= 0) {
    db.embeds[idx] = { guildId, name, embedData, createdBy, updatedAt: new Date().toISOString() };
  } else {
    db.embeds.push({ guildId, name, embedData, createdBy, createdAt: new Date().toISOString() });
  }
  saveDB(db);
}

function removeEmbed(guildId, name) {
  const db = loadDB();
  db.embeds = (db.embeds || []).filter(e => !(e.guildId === guildId && e.name === name));
  saveDB(db);
}

function getEmbeds(guildId) {
  const db = loadDB();
  return (db.embeds || []).filter(e => e.guildId === guildId);
}

function getEmbed(guildId, name) {
  const db = loadDB();
  return (db.embeds || []).find(e => e.guildId === guildId && e.name === name);
}

function getGuildStats(guildId) {
  const db = loadDB();
  return {
    warnings: db.warnings.filter(w => w.guildId === guildId).length,
    customCommands: db.custom_commands.filter(c => c.guildId === guildId).length,
    reactionRoles: db.reaction_roles.filter(r => r.guildId === guildId).length,
    levels: db.level_system.filter(l => l.guildId === guildId).length,
    logs: (db.logs || []).filter(l => l.guildId === guildId).length,
    embeds: (db.embeds || []).filter(e => e.guildId === guildId).length,
  };
}

// ============ ECONOMY ============
function getEconomy(guildId, userId) {
  const db = loadDB();
  if (!db.economy) db.economy = [];
  let entry = db.economy.find(e => e.guildId === guildId && e.userId === userId);
  if (!entry) {
    entry = { guildId, userId, wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, lastRob: 0 };
    db.economy.push(entry);
    saveDB(db);
  }
  return entry;
}

function updateEconomy(guildId, userId, updates) {
  const db = loadDB();
  if (!db.economy) db.economy = [];
  let entry = db.economy.find(e => e.guildId === guildId && e.userId === userId);
  if (!entry) {
    entry = { guildId, userId, wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, lastRob: 0 };
    db.economy.push(entry);
  }
  Object.assign(entry, updates);
  saveDB(db);
  return entry;
}

function getEconomyLeaderboard(guildId) {
  const db = loadDB();
  return (db.economy || [])
    .filter(e => e.guildId === guildId)
    .sort((a, b) => ((b.wallet || 0) + (b.bank || 0)) - ((a.wallet || 0) + (a.bank || 0)))
    .slice(0, 10);
}

// ============ INVENTORY ============
function getInventory(guildId, userId) {
  const db = loadDB();
  if (!db.inventories) db.inventories = [];
  let entry = db.inventories.find(e => e.guildId === guildId && e.userId === userId);
  if (!entry) {
    entry = { guildId, userId, items: {} };
    db.inventories.push(entry);
    saveDB(db);
  }
  return entry;
}

function updateInventory(guildId, userId, items) {
  const db = loadDB();
  if (!db.inventories) db.inventories = [];
  let entry = db.inventories.find(e => e.guildId === guildId && e.userId === userId);
  if (!entry) {
    entry = { guildId, userId, items: {} };
    db.inventories.push(entry);
  }
  entry.items = items;
  saveDB(db);
  return entry;
}

// ============ PROFILES ============
function getProfile(userId) {
  const db = loadDB();
  if (!db.profiles) db.profiles = {};
  if (!db.profiles[userId]) {
    db.profiles[userId] = { bio: '', banner: '', color: '#8b5cf6' };
    saveDB(db);
  }
  return db.profiles[userId];
}

function updateProfile(userId, updates) {
  const db = loadDB();
  if (!db.profiles) db.profiles = {};
  if (!db.profiles[userId]) db.profiles[userId] = { bio: '', banner: '', color: '#8b5cf6' };
  Object.assign(db.profiles[userId], updates);
  saveDB(db);
}

// ============ MARRIAGES ============
function getMarriage(userId) {
  const db = loadDB();
  if (!db.marriages) db.marriages = [];
  return db.marriages.find(m => m.user1 === userId || m.user2 === userId);
}

function addMarriage(user1, user2) {
  const db = loadDB();
  if (!db.marriages) db.marriages = [];
  db.marriages.push({ user1, user2, marriedAt: new Date().toISOString() });
  saveDB(db);
}

function removeMarriage(userId) {
  const db = loadDB();
  if (!db.marriages) db.marriages = [];
  db.marriages = db.marriages.filter(m => m.user1 !== userId && m.user2 !== userId);
  saveDB(db);
}

// ============ REPUTATION ============
function getReputation(userId) {
  const db = loadDB();
  if (!db.reputation) db.reputation = [];
  return db.reputation.filter(r => r.userId === userId);
}

function addReputation(userId, fromUserId) {
  const db = loadDB();
  if (!db.reputation) db.reputation = [];
  db.reputation.push({ userId, fromUserId, timestamp: new Date().toISOString() });
  saveDB(db);
}

function hasGivenRep(userId, targetId) {
  const db = loadDB();
  if (!db.reputation) db.reputation = [];
  return db.reputation.some(r => r.userId === targetId && r.fromUserId === userId);
}

// ============ NOTES ============
function getNotes(userId) {
  const db = loadDB();
  if (!db.notes) db.notes = [];
  return db.notes.filter(n => n.userId === userId);
}

function addNote(userId, title, content) {
  const db = loadDB();
  if (!db.notes) db.notes = [];
  db.notes.push({ userId, title, content, createdAt: new Date().toISOString() });
  saveDB(db);
}

function removeNote(userId, title) {
  const db = loadDB();
  if (!db.notes) db.notes = [];
  db.notes = db.notes.filter(n => !(n.userId === userId && n.title.toLowerCase() === title.toLowerCase()));
  saveDB(db);
}

function getNote(userId, title) {
  const db = loadDB();
  if (!db.notes) db.notes = [];
  return db.notes.find(n => n.userId === userId && n.title.toLowerCase() === title.toLowerCase());
}

module.exports = {
  loadDB, saveDB, getGuildSettings, updateGuildSetting, updateGuildSettings,
  addWarning, getWarnings, clearWarnings,
  addReactionRole, getReactionRoles, removeReactionRole, getReactionRole,
  addCustomCommand, removeCustomCommand, getCustomCommand, getCustomCommands,
  getLevel, updateLevel, getLeaderboard,
  addReminder, removeReminder,
  addInvite, updateInvite, getInvites, getInviteLeaderboard,
  addTempban, removeTempban, getTempbans,
  addLog, getLogs,
  getStarboard, addStarboard,
  addEmbed, removeEmbed, getEmbeds, getEmbed,
  getGuildStats,
  getEconomy, updateEconomy, getEconomyLeaderboard,
  getInventory, updateInventory,
  getProfile, updateProfile,
  getMarriage, addMarriage, removeMarriage,
  getReputation, addReputation, hasGivenRep,
  getNotes, addNote, removeNote, getNote,
};
