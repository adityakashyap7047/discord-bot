const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'bot.json');

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function loadDB() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = { guild_settings: {}, warnings: [], reaction_roles: [], custom_commands: [], level_system: [], starboard: [], reminders: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getGuildSettings(guildId) {
  const db = loadDB();
  if (!db.guild_settings[guildId]) {
    db.guild_settings[guildId] = {
      guildId,
      welcomeChannel: null,
      welcomeMessage: 'Welcome {user} to {server}!',
      goodbyeChannel: null,
      goodbyeMessage: 'Goodbye {user}!',
      goodbyeEnabled: false,
      welcomeEnabled: false,
      modLogChannel: null,
      autoRole: null,
      autoMod: false,
      antiSpam: false,
      antiLink: false,
      mutedRole: null,
      prefix: '!',
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

function addWarning(guildId, userId, moderatorId, reason) {
  const db = loadDB();
  db.warnings.push({ guildId, userId, moderatorId, reason, timestamp: new Date().toISOString() });
  saveDB(db);
}

function getWarnings(guildId, userId) {
  const db = loadDB();
  return db.warnings.filter(w => w.guildId === guildId && w.userId === userId);
}

function addReactionRole(guildId, channelId, messageId, emoji, roleId) {
  const db = loadDB();
  db.reaction_roles.push({ guildId, channelId, messageId, emoji, roleId });
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

function getStarboard(guildId, messageId) {
  const db = loadDB();
  return db.starboard.find(s => s.guildId === guildId && s.messageId === messageId);
}

function addStarboard(guildId, messageId, starboardMessageId, stars) {
  const db = loadDB();
  db.starboard.push({ guildId, messageId, starboardMessageId, stars });
  saveDB(db);
}

module.exports = {
  loadDB, saveDB, getGuildSettings, updateGuildSetting,
  addWarning, getWarnings,
  addReactionRole, getReactionRole,
  addCustomCommand, removeCustomCommand, getCustomCommand, getCustomCommands,
  getLevel, updateLevel,
  addReminder, removeReminder,
  getStarboard, addStarboard,
};
