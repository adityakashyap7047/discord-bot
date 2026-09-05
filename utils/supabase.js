const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;
let available = false;

function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[SUPABASE] Missing SUPABASE_URL or SUPABASE_ANON_KEY — user data stays in JSON');
    return false;
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  available = true;
  console.log('[SUPABASE] Connected ✓');
  return true;
}

function isAvailable() { return available; }
function getClient() { return supabase; }

// ============ GUILD SETTINGS ============
async function getGuildSettingsSupabase(guildId) {
  if (!available) return null;
  const { data, error } = await supabase.from('guild_settings').select('*').eq('guild_id', guildId).maybeSingle();
  if (error) throw error;
  return data ? data.settings : null;
}

async function upsertGuildSettings(guildId, settings) {
  if (!available) return;
  const { error } = await supabase.from('guild_settings').upsert(
    { guild_id: guildId, settings, updated_at: new Date().toISOString() },
    { onConflict: 'guild_id' }
  );
  if (error) throw error;
}

// ============ CUSTOM COMMAND LOOKUP ============
async function getCustomCommand(guildId, name) {
  if (!available) return null;
  const { data } = await supabase.from('custom_commands').select('*').eq('guild_id', guildId).eq('name', name).maybeSingle();
  if (!data) return null;
  // Normalize column names to match local DB format
  return { guildId: data.guild_id, name: data.name, response: data.response, createdBy: data.created_by };
}

// ============ PROFILES ============
async function getProfile(userId) {
  if (!available) return null;
  const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  return { userId: data.user_id, ...data };
}

async function upsertProfile(userId, updates) {
  if (!available) return;
  await supabase.from('profiles').upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}

// ============ ECONOMY ============
async function getEconomy(guildId, userId) {
  if (!available) return null;
  const { data } = await supabase.from('economy').select('*').eq('guild_id', guildId).eq('user_id', userId).maybeSingle();
  if (!data) return null;
  return { guildId: data.guild_id, userId: data.user_id, wallet: data.wallet, bank: data.bank, lastDaily: data.last_daily, lastWork: data.last_work, lastRob: data.last_rob, lastBeg: data.last_beg };
}

async function upsertEconomy(guildId, userId, updates) {
  if (!available) return;
  await supabase.from('economy').upsert({ guild_id: guildId, user_id: userId, ...updates }, { onConflict: 'guild_id,user_id' });
}

async function getEconomyLeaderboard(guildId) {
  if (!available) return [];
  const { data } = await supabase.from('economy').select('*').eq('guild_id', guildId).order('wallet', { ascending: false }).order('bank', { ascending: false }).limit(10);
  if (!data) return [];
  return data.map(e => ({ guildId: e.guild_id, userId: e.user_id, wallet: e.wallet, bank: e.bank }));
}

// ============ INVENTORY ============
async function getInventory(guildId, userId) {
  if (!available) return null;
  const { data } = await supabase.from('inventories').select('*').eq('guild_id', guildId).eq('user_id', userId).maybeSingle();
  if (!data) return null;
  return { guildId: data.guild_id, userId: data.user_id, items: data.items };
}

async function upsertInventory(guildId, userId, items) {
  if (!available) return;
  await supabase.from('inventories').upsert({ guild_id: guildId, user_id: userId, items }, { onConflict: 'guild_id,user_id' });
}

// ============ MARRIAGES ============
async function getMarriage(userId) {
  if (!available) return null;
  const { data } = await supabase.from('marriages').select('*').or(`user1.eq.${userId},user2.eq.${userId}`).maybeSingle();
  if (!data) return null;
  return { user1: data.user1, user2: data.user2 };
}

async function addMarriage(user1, user2) {
  if (!available) return;
  await supabase.from('marriages').insert({ user1, user2 });
}

async function removeMarriage(userId) {
  if (!available) return;
  await supabase.from('marriages').delete().or(`user1.eq.${userId},user2.eq.${userId}`);
}

// ============ REPUTATION ============
async function getReputation(userId) {
  if (!available) return [];
  const { data } = await supabase.from('reputation').select('*').eq('user_id', userId);
  if (!data) return [];
  return data.map(r => ({ userId: r.user_id, fromUserId: r.from_user_id }));
}

async function addReputation(userId, fromUserId) {
  if (!available) return;
  await supabase.from('reputation').insert({ user_id: userId, from_user_id: fromUserId });
}

async function hasGivenRep(userId, targetId) {
  if (!available) return false;
  const { count } = await supabase.from('reputation').select('*', { count: 'exact', head: true }).eq('user_id', targetId).eq('from_user_id', userId);
  return count > 0;
}

// ============ NOTES ============
async function getNotes(userId) {
  if (!available) return [];
  const { data } = await supabase.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(n => ({ userId: n.user_id, title: n.title, content: n.content, createdAt: n.created_at }));
}

async function addNote(userId, title, content) {
  if (!available) return;
  await supabase.from('notes').insert({ user_id: userId, title, content });
}

async function removeNote(userId, title) {
  if (!available) return;
  await supabase.from('notes').delete().eq('user_id', userId).ilike('title', title);
}

async function getNote(userId, title) {
  if (!available) return null;
  const { data } = await supabase.from('notes').select('*').eq('user_id', userId).ilike('title', title).maybeSingle();
  return data;
}

// ============ LEVELS ============
async function getLevel(guildId, userId) {
  if (!available) return null;
  const { data } = await supabase.from('levels').select('*').eq('guild_id', guildId).eq('user_id', userId).maybeSingle();
  return data;
}

async function upsertLevel(guildId, userId, xp, level) {
  if (!available) return;
  await supabase.from('levels').upsert({ guild_id: guildId, user_id: userId, xp, level }, { onConflict: 'guild_id,user_id' });
}

async function getLeaderboard(guildId) {
  if (!available) return [];
  const { data } = await supabase.from('levels').select('*').eq('guild_id', guildId).order('level', { ascending: false }).order('xp', { ascending: false }).limit(20);
  if (!data) return [];
  return data.map(l => ({ guildId: l.guild_id, userId: l.user_id, xp: l.xp, level: l.level }));
}

// ============ WARNINGS ============
async function addWarning(guildId, userId, moderatorId, reason) {
  if (!available) return;
  await supabase.from('warnings').insert({ guild_id: guildId, user_id: userId, moderator_id: moderatorId, reason });
}

async function getWarnings(guildId, userId) {
  if (!available) return [];
  let query = supabase.from('warnings').select('*').eq('guild_id', guildId);
  if (userId) query = query.eq('user_id', userId);
  query = query.order('created_at', { ascending: false });
  const { data } = await query;
  if (!data) return [];
  return data.map(w => ({ guildId: w.guild_id, userId: w.user_id, moderatorId: w.moderator_id, reason: w.reason, timestamp: w.created_at }));
}

async function clearWarnings(guildId, userId) {
  if (!available) return;
  await supabase.from('warnings').delete().eq('guild_id', guildId).eq('user_id', userId);
}

// ============ MOD LOGS ============
async function addLog(guildId, type, moderatorId, targetId, reason, details) {
  if (!available) return;
  await supabase.from('mod_logs').insert({ guild_id: guildId, type, moderator_id: moderatorId, target_id: targetId, reason, details: details || '' });
}

async function getLogs(guildId, type, limit = 50) {
  if (!available) return [];
  let query = supabase.from('mod_logs').select('*').eq('guild_id', guildId).order('created_at', { ascending: false }).limit(limit);
  if (type) query = query.eq('type', type);
  const { data } = await query;
  if (!data) return [];
  return data.map(l => ({ guildId: l.guild_id, type: l.type, moderatorId: l.moderator_id, targetId: l.target_id, reason: l.reason, details: l.details, timestamp: l.created_at }));
}

// ============ CUSTOM COMMANDS ============
async function addCustomCommand(guildId, name, response, createdBy) {
  if (!available) return;
  await supabase.from('custom_commands').upsert({ guild_id: guildId, name, response, created_by: createdBy, updated_at: new Date().toISOString() }, { onConflict: 'guild_id,name' });
}

async function removeCustomCommand(guildId, name) {
  if (!available) return;
  await supabase.from('custom_commands').delete().eq('guild_id', guildId).eq('name', name);
}

async function getCustomCommands(guildId) {
  if (!available) return [];
  const { data } = await supabase.from('custom_commands').select('*').eq('guild_id', guildId);
  if (!data) return [];
  return data.map(c => ({ guildId: c.guild_id, name: c.name, response: c.response, createdBy: c.created_by }));
}

// ============ REACTION ROLES ============
async function addReactionRole(guildId, channelId, messageId, emoji, roleId) {
  if (!available) return;
  await supabase.from('reaction_roles').insert({ guild_id: guildId, channel_id: channelId, message_id: messageId, emoji, role_id: roleId });
}

async function removeReactionRole(guildId, messageId, emoji) {
  if (!available) return;
  await supabase.from('reaction_roles').delete().eq('guild_id', guildId).eq('message_id', messageId).eq('emoji', emoji);
}

async function getReactionRoles(guildId) {
  if (!available) return [];
  const { data } = await supabase.from('reaction_roles').select('*').eq('guild_id', guildId);
  if (!data) return [];
  return data.map(r => ({ guildId: r.guild_id, channelId: r.channel_id, messageId: r.message_id, emoji: r.emoji, roleId: r.role_id }));
}

async function getReactionRole(guildId, messageId, emoji) {
  if (!available) return null;
  const { data } = await supabase.from('reaction_roles').select('*').eq('guild_id', guildId).eq('message_id', messageId).eq('emoji', emoji).maybeSingle();
  if (!data) return null;
  return { guildId: data.guild_id, channelId: data.channel_id, messageId: data.message_id, emoji: data.emoji, roleId: data.role_id };
}

// ============ STARBOARD ============
async function getStarboard(guildId, messageId) {
  if (!available) return null;
  const { data } = await supabase.from('starboard').select('*').eq('guild_id', guildId).eq('message_id', messageId).maybeSingle();
  if (!data) return null;
  return { guildId: data.guild_id, messageId: data.message_id, starboardMessageId: data.starboard_message_id, stars: data.stars };
}

async function addStarboard(guildId, messageId, starboardMessageId, stars) {
  if (!available) return;
  await supabase.from('starboard').insert({ guild_id: guildId, message_id: messageId, starboard_message_id: starboardMessageId, stars });
}

// ============ EMBEDS ============
async function addEmbed(guildId, name, embedData, createdBy) {
  if (!available) return;
  await supabase.from('embeds').upsert({ guild_id: guildId, name, embed_data: embedData, created_by: createdBy, updated_at: new Date().toISOString() }, { onConflict: 'guild_id,name' });
}

async function removeEmbed(guildId, name) {
  if (!available) return;
  await supabase.from('embeds').delete().eq('guild_id', guildId).eq('name', name);
}

async function getEmbeds(guildId) {
  if (!available) return [];
  const { data } = await supabase.from('embeds').select('*').eq('guild_id', guildId);
  if (!data) return [];
  return data.map(e => ({ guildId: e.guild_id, name: e.name, embedData: e.embed_data, createdBy: e.created_by }));
}

async function getEmbed(guildId, name) {
  if (!available) return null;
  const { data } = await supabase.from('embeds').select('*').eq('guild_id', guildId).eq('name', name).maybeSingle();
  if (!data) return null;
  return { guildId: data.guild_id, name: data.name, embedData: data.embed_data, createdBy: data.created_by };
}

// ============ REMINDERS ============
async function addReminder(userId, channelId, reminder, remindAt) {
  if (!available) return;
  await supabase.from('reminders').insert({ user_id: userId, channel_id: channelId, reminder, remind_at: new Date(remindAt).toISOString() });
}

async function removeReminder(userId, reminder) {
  if (!available) return;
  await supabase.from('reminders').delete().eq('user_id', userId).eq('reminder', reminder);
}

// ============ INVITES ============
async function addInvite(guildId, code, inviterId, uses) {
  if (!available) return;
  await supabase.from('invites').upsert({ guild_id: guildId, code, inviter_id: inviterId, uses }, { onConflict: 'guild_id,code' });
}

async function updateInvite(guildId, code, uses) {
  if (!available) return;
  await supabase.from('invites').update({ uses }).eq('guild_id', guildId).eq('code', code);
}

async function getInvites(guildId) {
  if (!available) return {};
  const { data } = await supabase.from('invites').select('*').eq('guild_id', guildId);
  if (!data) return {};
  const result = {};
  for (const inv of data) {
    if (!result[inv.code]) result[inv.code] = { inviterId: inv.inviter_id, uses: inv.uses, created: inv.created_at };
  }
  return result;
}

// ============ TEMPBANS ============
async function addTempban(guildId, userId, expiresAt, reason) {
  if (!available) return;
  await supabase.from('tempbans').insert({ guild_id: guildId, user_id: userId, expires_at: new Date(expiresAt).toISOString(), reason: reason || '' });
}

async function removeTempban(guildId, userId) {
  if (!available) return;
  await supabase.from('tempbans').delete().eq('guild_id', guildId).eq('user_id', userId);
}

async function getTempbans(guildId) {
  if (!available) return [];
  const { data } = await supabase.from('tempbans').select('*').eq('guild_id', guildId);
  if (!data) return [];
  return data.map(t => ({ guildId: t.guild_id, userId: t.user_id, expiresAt: t.expires_at }));
}

// ============ GUILD STATS ============
async function getGuildStats(guildId) {
  if (!available) return { warnings: 0, customCommands: 0, reactionRoles: 0, levels: 0, logs: 0, embeds: 0 };
  const [warnings, customCommands, reactionRoles, levels, logs, embeds] = await Promise.all([
    supabase.from('warnings').select('*', { count: 'exact', head: true }).eq('guild_id', guildId),
    supabase.from('custom_commands').select('*', { count: 'exact', head: true }).eq('guild_id', guildId),
    supabase.from('reaction_roles').select('*', { count: 'exact', head: true }).eq('guild_id', guildId),
    supabase.from('levels').select('*', { count: 'exact', head: true }).eq('guild_id', guildId),
    supabase.from('mod_logs').select('*', { count: 'exact', head: true }).eq('guild_id', guildId),
    supabase.from('embeds').select('*', { count: 'exact', head: true }).eq('guild_id', guildId),
  ]);
  return {
    warnings: warnings.count || 0,
    customCommands: customCommands.count || 0,
    reactionRoles: reactionRoles.count || 0,
    levels: levels.count || 0,
    logs: logs.count || 0,
    embeds: embeds.count || 0,
  };
}

module.exports = {
  initSupabase,
  isAvailable,
  getClient,

  getGuildSettingsSupabase, upsertGuildSettings,
  getProfile, upsertProfile,
  getEconomy, upsertEconomy, getEconomyLeaderboard,
  getInventory, upsertInventory,
  getMarriage, addMarriage, removeMarriage,
  getReputation, addReputation, hasGivenRep,
  getNotes, addNote, removeNote, getNote,
  getLevel, upsertLevel, getLeaderboard,
  addWarning, getWarnings, clearWarnings,
  addLog, getLogs,
  addCustomCommand, removeCustomCommand, getCustomCommands, getCustomCommand,
  addReactionRole, removeReactionRole, getReactionRoles, getReactionRole,
  getStarboard, addStarboard,
  addEmbed, removeEmbed, getEmbeds, getEmbed,
  addReminder, removeReminder,
  addInvite, updateInvite, getInvites,
  addTempban, removeTempban, getTempbans,
  getGuildStats,
};
