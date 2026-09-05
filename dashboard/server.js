const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
  getGuildSettings, updateGuildSetting, updateGuildSettings, persistGuildSettings,
  getWarnings, clearWarnings, addWarning,
  getCustomCommands, addCustomCommand, removeCustomCommand,
  getReactionRoles, addReactionRole, removeReactionRole,
  getLeaderboard, getInviteLeaderboard,
  getLogs, getGuildStats,
  getEmbeds, addEmbed, removeEmbed, getEmbed,
  getInvites,
  getEconomy, updateEconomy, getEconomyLeaderboard,
  getInventory,
} = require('../utils/database');

class FileSessionStore extends session.Store {
  constructor(directory) {
    super();
    this.directory = directory;
    fs.mkdirSync(directory, { recursive: true });
  }

  fileFor(sessionId) {
    const name = crypto.createHash('sha256').update(sessionId).digest('hex');
    return path.join(this.directory, `${name}.json`);
  }

  get(sessionId, callback) {
    fs.readFile(this.fileFor(sessionId), 'utf8', (error, raw) => {
      if (error?.code === 'ENOENT') return callback(null, null);
      if (error) return callback(error);
      try {
        const data = JSON.parse(raw);
        const expiresAt = data.cookie?.expires && new Date(data.cookie.expires).getTime();
        if (expiresAt && expiresAt <= Date.now()) {
          return this.destroy(sessionId, () => callback(null, null));
        }
        return callback(null, data);
      } catch (parseError) {
        return callback(parseError);
      }
    });
  }
  set(sessionId, data, callback = () => {}) {
    fs.writeFile(this.fileFor(sessionId), JSON.stringify(data), 'utf8', callback);
  }

  destroy(sessionId, callback = () => {}) {
    fs.unlink(this.fileFor(sessionId), error => callback(error?.code === 'ENOENT' ? null : error));
  }

  touch(sessionId, data, callback = () => {}) {
    this.set(sessionId, data, callback);
  }
}

function startDashboard(client) {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.set('trust proxy', 1);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_URL || (process.env.RENDER ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : '');
  const publicUrl = renderUrl || process.env.PUBLIC_URL || '';
  const isProduction = process.env.RENDER || process.env.NODE_ENV === 'production';
  // A secure cookie is only valid over HTTPS. NODE_ENV=production is also
  // commonly used when running the dashboard locally, where forcing it causes
  // Passport to lose the session and repeatedly request Discord authorization.
  const usesSecureCookies = publicUrl.startsWith('https://');

  app.use(session({
    secret: client.config.sessionSecret || 'discord-bot-secret',
    store: new FileSessionStore(path.join(__dirname, '..', 'data', 'sessions')),
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: usesSecureCookies,
      sameSite: usesSecureCookies ? 'none' : 'lax',
      httpOnly: true,
      path: '/',
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // Detect if running on Render or localhost
  // Auto-detect callback URL
  let callbackURL = client.config.callbackURL;
  if (isProduction && publicUrl) {
    callbackURL = publicUrl + '/auth/callback';
  }
  if (!callbackURL || !callbackURL.startsWith('http')) {
    callbackURL = 'http://localhost:' + client.config.port + '/auth/callback';
  }

  console.log(`🔗 OAuth Callback URL: ${callbackURL}`);
  console.log(`🌐 Public URL: ${publicUrl || 'http://localhost:' + client.config.port}`);

  passport.use(new DiscordStrategy({
    clientID: client.config.clientId,
    clientSecret: client.config.clientSecret,
    callbackURL: callbackURL,
    scope: ['identify', 'guilds'],
  }, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));

  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/login');
  }

  async function hasPermission(req, res, next) {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.redirect('/dashboard');
    const userGuild = req.user.guilds.find(g => g.id === req.params.guildId);
    if (!userGuild) return res.redirect('/dashboard');
    const perms = parseInt(userGuild.permissions);
    if ((perms & 0x20) !== 0x20 && (perms & 0x8) !== 0x8) return res.redirect('/dashboard');
    req.guild = guild;
    req.guildSettings = await getGuildSettings(guild.id);
    next();
  }

  // ============ AUTH ============
  app.get('/auth/login', passport.authenticate('discord'));
  app.get('/auth/callback', (req, res, next) => {
    passport.authenticate('discord', (err, user, info) => {
      if (err) {
        console.error('Auth ERROR:', err);
        return res.redirect('/auth/error?msg=' + encodeURIComponent(err.message || err.toString() || 'Authentication failed'));
      }
      if (!user) {
        console.error('Auth NO USER:', info);
        return res.redirect('/auth/error?msg=' + encodeURIComponent(info?.message || info?.toString() || 'Login cancelled. Please authorize the app.'));
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Session ERROR:', err);
          return res.redirect('/auth/error?msg=' + encodeURIComponent('Session creation failed: ' + err.message));
        }
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  });
  app.get('/auth/error', (req, res) => {
    res.render('auth-error', { message: req.query.msg || 'Authentication failed', bot: client, publicUrl });
  });
  app.get('/auth/logout', (req, res) => { req.logout(() => res.redirect('/')); });

  // ============ HOME ============
  app.get('/', (req, res) => res.render('home', { user: req.user, bot: client, publicUrl }));

  // ============ DASHBOARD ============
  app.get('/dashboard', isAuthenticated, (req, res) => {
    // Show ALL guilds the user has Manage Server in
    const allGuilds = req.user.guilds || [];
    const botGuilds = client.guilds.cache;

    const guildsWithAccess = allGuilds.filter(g => {
      const perms = parseInt(g.permissions);
      const hasManageServer = (perms & 0x20) === 0x20 || (perms & 0x8) === 0x8;
      return hasManageServer;
    }).map(g => ({
      ...g,
      botInServer: botGuilds.has(g.id),
    }));

    res.render('dashboard', { user: req.user, guilds: guildsWithAccess, bot: client });
  });

  // ============ SETTINGS ============
  app.get('/dashboard/:guildId', isAuthenticated, hasPermission, async (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).sort((a, b) => a.position - b.position).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id && !r.managed).sort((a, b) => b.position - a.position).map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
    const stats = await getGuildStats(g.id);
    res.render('server', { user: req.user, guild: g, settings, channels, roles, stats, currentPage: 'settings' });
  });

  app.post('/dashboard/:guildId/update', isAuthenticated, hasPermission, async (req, res) => {
    const s = req.body;
    const updates = {};
    for (const [key, value] of Object.entries(s)) {
      if (key.endsWith('[]')) {
        updates[key.slice(0, -2)] = Array.isArray(value) ? value : [value];
      } else if (value === 'on') {
        updates[key] = true;
      } else if (value === 'off') {
        updates[key] = false;
      } else {
        updates[key] = value;
      }
    }
    await updateGuildSettings(req.guild.id, updates);
    res.redirect(`/dashboard/${req.guild.id}?saved=true`);
  });

  // Save settings to Supabase (manual save button)
  app.post('/api/guilds/:guildId/supabase-save', isAuthenticated, hasPermission, async (req, res) => {
    try {
      const settings = await getGuildSettings(req.params.guildId);
      await persistGuildSettings(req.params.guildId, settings);
      res.json({ success: true, message: 'Settings synced to Supabase' });
    } catch (e) {
      console.error('[SUPABASE SAVE] Error:', e.message);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ============ WELCOME ============
  app.get('/dashboard/:guildId/welcome', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }));
    res.render('welcome', { user: req.user, guild: g, settings, channels, roles, currentPage: 'welcome', query: req.query });
  });

  app.post('/dashboard/:guildId/welcome', isAuthenticated, hasPermission, async (req, res) => {
    const s = req.body;
    const isValidImage = (url) => url && /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
    try {
      await updateGuildSettings(req.guild.id, {
        welcomeEnabled: s.welcomeEnabled === 'on',
        welcomeChannel: s.welcomeChannel || null,
        welcomeMessage: s.welcomeMessage || 'Welcome {user} to {server}!',
        welcomeEmbed: s.welcomeEmbed === 'on',
        welcomeColor: s.welcomeColor || '#00ff00',
        welcomeImage: isValidImage(s.welcomeImage) ? s.welcomeImage : '',
        goodbyeEnabled: s.goodbyeEnabled === 'on',
        goodbyeChannel: s.goodbyeChannel || null,
        goodbyeMessage: s.goodbyeMessage || 'Goodbye {user}!',
        goodbyeEmbed: s.goodbyeEmbed === 'on',
        goodbyeColor: s.goodbyeColor || '#ff0000',
        goodbyeImage: isValidImage(s.goodbyeImage) ? s.goodbyeImage : '',
        boostMessage: s.boostMessage || '',
        boostChannel: s.boostChannel || null,
        welcomeRoles: s.welcomeRoles ? (Array.isArray(s.welcomeRoles) ? s.welcomeRoles : [s.welcomeRoles]) : [],
      });
    } catch (err) {
      console.error('[DASHBOARD] Welcome save error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/welcome?saved=true`);
  });

  // ============ MODERATION ============
  app.get('/dashboard/:guildId/moderation', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }));
    res.render('moderation', { user: req.user, guild: g, settings, channels, roles, currentPage: 'moderation', query: req.query });
  });

  app.post('/dashboard/:guildId/moderation', isAuthenticated, hasPermission, async (req, res) => {
    const s = req.body;
    try {
      await updateGuildSettings(req.guild.id, {
        modLogEnabled: s.modLogEnabled === 'on',
        modLogChannel: s.modLogChannel || null,
        autoMod: s.autoMod === 'on',
        antiSpam: s.antiSpam === 'on',
        antiLink: s.antiLink === 'on',
        antiRaid: s.antiRaid === 'on',
        mutedRole: s.mutedRole || null,
        floodLimit: parseInt(s.floodLimit) || 5,
        floodTimeframe: parseInt(s.floodTimeframe) || 5,
      });
    } catch (err) {
      console.error('[DASHBOARD] Moderation save error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/moderation?saved=true`);
  });

  // ============ LOGGING ============
  app.get('/dashboard/:guildId/logging', isAuthenticated, hasPermission, async (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const logs = await getLogs(g.id, null, 50);
    res.render('logging', { user: req.user, guild: g, settings, channels, logs, currentPage: 'logging', query: req.query });
  });

  app.post('/dashboard/:guildId/logging', isAuthenticated, hasPermission, async (req, res) => {
    const s = req.body;
    try {
      await updateGuildSettings(req.guild.id, {
        logChannel: s.logChannel || null,
        logMessages: s.logMessages === 'on',
        logJoins: s.logJoins === 'on',
        logBans: s.logBans === 'on',
        logEdits: s.logEdits === 'on',
        voiceChannelLog: s.voiceChannelLog === 'on',
      });
    } catch (err) {
      console.error('[DASHBOARD] Logging save error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/logging?saved=true`);
  });

  app.post('/dashboard/:guildId/test-message/logging', isAuthenticated, hasPermission, async (req, res) => {
    const settings = await getGuildSettings(req.guild.id);
    const channel = req.guild.channels.cache.get(settings.logChannel) || await req.guild.channels.fetch(settings.logChannel).catch(() => null);
    if (!settings.logChannel) {
      return res.redirect(`/dashboard/${req.guild.id}/logging?error=${encodeURIComponent('Set a Log Channel first in the settings above.')}`);
    }
    if (!channel || !channel.isTextBased() || typeof channel.send !== 'function') {
      return res.redirect(`/dashboard/${req.guild.id}/logging?error=${encodeURIComponent('Log channel not found or not a text channel. Please re-select the channel in settings.')}`);
    }
    try {
      const { EmbedBuilder } = require('discord.js');
      await channel.send({ embeds: [new EmbedBuilder()
        .setColor('#3b82f6')
        .setTitle('Logging Test')
        .setDescription('🧪 The bot can send messages to this log channel.')
        .setFooter({ text: 'Dashboard test message' })
        .setTimestamp()] });
      return res.redirect(`/dashboard/${req.guild.id}/logging?sent=${encodeURIComponent('Logging test message sent successfully.')}`);
    } catch (error) {
      console.error('[DASHBOARD] Logging test failed:', error);
      return res.redirect(`/dashboard/${req.guild.id}/logging?error=${encodeURIComponent('The bot could not send to this log channel. Check its permissions.')}`);
    }
  });

  // ============ ROLES ============
  app.get('/dashboard/:guildId/roles', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const roles = g.roles.cache.filter(r => r.id !== g.id && !r.managed).sort((a, b) => b.position - a.position).map(r => ({
      id: r.id, name: r.name, color: r.hexColor, members: r.members.size, permissions: r.permissions.bitfield
    }));
    res.render('roles', { user: req.user, guild: g, settings, roles, currentPage: 'roles' });
  });

  app.post('/dashboard/:guildId/roles/autorole', isAuthenticated, hasPermission, async (req, res) => {
    try {
      await updateGuildSettings(req.guild.id, {
        autoroleEnabled: req.body.autoroleEnabled === 'on',
        autoroleId: req.body.autoroleId || null,
      });
    } catch (err) {
      console.error('[DASHBOARD] Autorole save error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/roles?saved=true`);
  });

  // ============ COMMANDS ============
  app.get('/dashboard/:guildId/commands', isAuthenticated, hasPermission, async (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const customCmds = await getCustomCommands(g.id);
    res.render('commands', { user: req.user, guild: g, settings, customCommands: customCmds, currentPage: 'commands' });
  });

  app.post('/dashboard/:guildId/commands/add', isAuthenticated, hasPermission, async (req, res) => {
    try {
      await addCustomCommand(req.guild.id, req.body.name, req.body.response, req.user.id);
    } catch (err) {
      console.error('[DASHBOARD] Add command error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/commands?saved=true`);
  });

  app.post('/dashboard/:guildId/commands/remove', isAuthenticated, hasPermission, async (req, res) => {
    try {
      await removeCustomCommand(req.guild.id, req.body.name);
    } catch (err) {
      console.error('[DASHBOARD] Remove command error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/commands?saved=true`);
  });

  // ============ EMBEDS ============
  app.get('/dashboard/:guildId/embeds', isAuthenticated, hasPermission, async (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const embeds = await getEmbeds(g.id);
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.render('embeds', { user: req.user, guild: g, settings, embeds, channels, currentPage: 'embeds', query: req.query });
  });

  app.post('/dashboard/:guildId/embeds/add', isAuthenticated, hasPermission, async (req, res) => {
    const { name, title, description, color, footer } = req.body;
    try {
      await addEmbed(req.guild.id, name, { title, description, color, footer }, req.user.id);
    } catch (err) {
      console.error('[DASHBOARD] Add embed error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/embeds?saved=true`);
  });

  app.post('/dashboard/:guildId/embeds/send', isAuthenticated, hasPermission, async (req, res) => {
    const { channel, title, description, color, thumbnail, image, footer, author } = req.body;
    const ch = req.guild.channels.cache.get(channel);
    const redirect = (key, message) => res.redirect(`/dashboard/${req.guild.id}/embeds?${key}=${encodeURIComponent(message)}`);

    if (!ch || !ch.isTextBased() || typeof ch.send !== 'function') {
      return redirect('error', 'Select a valid text channel.');
    }
    if (!title?.trim() && !description?.trim() && !footer?.trim() && !author?.trim()) {
      return redirect('error', 'Add a title, description, author, or footer before sending.');
    }
    for (const [label, url] of [['thumbnail', thumbnail], ['image', image]]) {
      if (url?.trim() && !/^https?:\/\/\S+$/i.test(url.trim())) {
        return redirect('error', `The ${label} URL must start with http:// or https://.`);
      }
    }

    try {
      const embed = new (require('discord.js').EmbedBuilder)()
        .setColor(color || '#5865f2');
      if (title?.trim()) embed.setTitle(title.trim());
      if (description?.trim()) embed.setDescription(description.trim());
      if (thumbnail?.trim()) embed.setThumbnail(thumbnail.trim());
      if (image?.trim()) embed.setImage(image.trim());
      if (footer?.trim()) embed.setFooter({ text: footer.trim() });
      if (author?.trim()) embed.setAuthor({ name: author.trim() });
      await ch.send({ embeds: [embed] });
      return redirect('sent', 'Embed sent successfully.');
    } catch (error) {
      console.error('[DASHBOARD] Embed send failed:', error);
      return redirect('error', error.code === 50013
        ? 'The bot needs Send Messages and Embed Links permission in that channel.'
        : 'Discord could not send this embed. Check the channel permissions and embed fields.');
    }
  });

  app.post('/dashboard/:guildId/embeds/remove', isAuthenticated, hasPermission, async (req, res) => {
    try {
      await removeEmbed(req.guild.id, req.body.name);
    } catch (err) {
      console.error('[DASHBOARD] Remove embed error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/embeds?saved=true`);
  });

  // ============ INVITES ============
  app.get('/dashboard/:guildId/invites', isAuthenticated, hasPermission, async (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const invites = await getInvites(g.id);
    const leaderboard = getInviteLeaderboard(g.id);
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.render('invites', { user: req.user, guild: g, settings, invites, leaderboard, channels, currentPage: 'invites' });
  });

  app.post('/dashboard/:guildId/invites', isAuthenticated, hasPermission, async (req, res) => {
    try {
      await updateGuildSettings(req.guild.id, {
        inviteTracker: req.body.inviteTracker === 'on',
        inviteLogChannel: req.body.inviteLogChannel || null,
      });
    } catch (err) {
      console.error('[DASHBOARD] Invites save error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/invites?saved=true`);
  });

  // ============ LEVELS ============
  app.get('/dashboard/:guildId/levels', isAuthenticated, hasPermission, async (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const leaderboard = await getLeaderboard(g.id);
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.render('levels', { user: req.user, guild: g, settings, leaderboard, channels, currentPage: 'levels', query: req.query });
  });

  app.post('/dashboard/:guildId/levels', isAuthenticated, hasPermission, async (req, res) => {
    try {
      await updateGuildSettings(req.guild.id, {
        levelSystem: req.body.levelSystem === 'on',
        levelChannel: req.body.levelChannel || null,
        levelUpMessage: req.body.levelUpMessage || '🎉 {user} leveled up to **Level {level}**!',
      });
    } catch (err) {
      console.error('[DASHBOARD] Levels save error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/levels?saved=true`);
  });

  // ============ MESSAGE TESTS ============
  app.post('/dashboard/:guildId/test-message/:type', isAuthenticated, hasPermission, async (req, res) => {
    const settings = await getGuildSettings(req.guild.id);
    const { EmbedBuilder } = require('discord.js');
    const type = req.params.type;
    let channelId;
    let payload;

    if (type === 'welcome') {
      channelId = settings.welcomeChannel;
      if (!channelId) return res.redirect(`/dashboard/${req.guild.id}/welcome?error=${encodeURIComponent('Set a Welcome Channel first in the settings above.')}`);
      const message = (settings.welcomeMessage || 'Welcome {user} to {server}!')
        .replace('{user}', `<@${req.user.id}>`)
        .replace('{server}', req.guild.name)
        .replace('{memberCount}', req.guild.memberCount);
      if (settings.welcomeEmbed) {
        const embed = new EmbedBuilder()
          .setColor(settings.welcomeColor || '#00ff00')
          .setDescription(message)
          .setFooter({ text: 'Welcome message test' });
        if (settings.welcomeImage && /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(settings.welcomeImage)) {
          embed.setImage(settings.welcomeImage);
        }
        payload = { embeds: [embed] };
      } else {
        payload = { content: `🧪 **Welcome message test**\n${message}` };
      }
    } else if (type === 'level') {
      channelId = settings.levelChannel;
      if (!channelId) return res.redirect(`/dashboard/${req.guild.id}/levels?error=${encodeURIComponent('Set a Level-Up Channel first in the settings above.')}`);
      const message = (settings.levelUpMessage || '🎉 {user} leveled up to **Level {level}**!')
        .replace('{user}', `<@${req.user.id}>`)
        .replace('{level}', '1');
      payload = { content: `🧪 **Level-up message test**\n${message}` };
    } else if (type === 'moderation') {
      channelId = settings.scamLogChannel || settings.logChannel;
      if (!channelId) return res.redirect(`/dashboard/${req.guild.id}/moderation?error=${encodeURIComponent('Set a Log Channel or Scam Log Channel first in the settings above.')}`);
      payload = { embeds: [new EmbedBuilder().setColor('#f59e0b').setTitle('Auto-Moderation Test').setDescription('🧪 Your moderation alert channel is working correctly.').setFooter({ text: 'Dashboard test message' }).setTimestamp()] };
    } else {
      return res.status(400).send('Unknown test message type.');
    }

    const channel = req.guild.channels.cache.get(channelId) || await req.guild.channels.fetch(channelId).catch(() => null);
    const page = type === 'level' ? 'levels' : type === 'welcome' ? 'welcome' : 'moderation';
    if (!channelId) {
      return res.redirect(`/dashboard/${req.guild.id}/${page}?error=${encodeURIComponent('No channel configured. Please select a channel in settings first.')}`);
    }
    if (!channel || !channel.isTextBased() || typeof channel.send !== 'function') {
      return res.redirect(`/dashboard/${req.guild.id}/${page}?error=${encodeURIComponent('Channel not found or not a text channel. Please re-select the channel in settings.')}`);
    }
    try {
      await channel.send(payload);
      return res.redirect(`/dashboard/${req.guild.id}/${page}?sent=${encodeURIComponent('Test message sent successfully.')}`);
    } catch (error) {
      console.error('[DASHBOARD] Test message failed:', error);
      return res.redirect(`/dashboard/${req.guild.id}/${page}?error=${encodeURIComponent('The bot could not send the test message. Check Send Messages and Embed Links permissions.')}`);
    }
  });

  // ============ STARBORD ============
  app.get('/dashboard/:guildId/starboard', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.render('starboard', { user: req.user, guild: g, settings, channels, currentPage: 'starboard' });
  });

  app.post('/dashboard/:guildId/starboard', isAuthenticated, hasPermission, async (req, res) => {
    try {
      await updateGuildSettings(req.guild.id, {
        starboardEnabled: req.body.starboardEnabled === 'on',
        starboardChannel: req.body.starboardChannel || null,
        starboardThreshold: parseInt(req.body.starboardThreshold) || 3,
      });
    } catch (err) {
      console.error('[DASHBOARD] Starboard save error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/starboard?saved=true`);
  });

  // ============ REACTION ROLES ============
  app.get('/dashboard/:guildId/reactionroles', isAuthenticated, hasPermission, async (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const rr = await getReactionRoles(g.id);
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }));
    res.render('reactionroles', { user: req.user, guild: g, settings, reactionRoles: rr, channels, roles, currentPage: 'reactionroles' });
  });

  // ============ COMMAND LIST ============
  app.get('/commandlist', (req, res) => {
    res.render('commandlist', { user: req.user || null, bot: client });
  });

  // ============ ANTI-SCAM ============
  app.get('/dashboard/:guildId/antiscam', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }));
    res.render('antiscam', { user: req.user, guild: g, settings, channels, roles, currentPage: 'antiscam' });
  });

  app.post('/dashboard/:guildId/antiscam', isAuthenticated, hasPermission, async (req, res) => {
    const s = req.body;
    try {
      await updateGuildSettings(req.guild.id, {
        antiScam: s.antiScam === 'on',
        scamLogChannel: s.scamLogChannel || null,
        scamAction: s.scamAction || 'delete',
        accountAgeGate: s.accountAgeGate === 'on',
        minAccountAge: parseInt(s.minAccountAge) || 7,
        newMemberRestriction: s.newMemberRestriction === 'on',
        duplicateDetection: s.duplicateDetection === 'on',
        raidProtection: s.raidProtection === 'on',
        raidThreshold: parseInt(s.raidThreshold) || 10,
        raidTimeframe: parseInt(s.raidTimeframe) || 60,
        verificationEnabled: s.verificationEnabled === 'on',
        verificationChannel: s.verificationChannel || null,
        verificationRole: s.verificationRole || null,
      });
    } catch (err) {
      console.error('[DASHBOARD] Anti-scam save error:', err.message);
    }
    res.redirect(`/dashboard/${req.guild.id}/antiscam?saved=true`);
  });

  // ============ TICKETS ============
  app.get('/dashboard/:guildId/tickets', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const categories = g.channels.cache.filter(c => c.type === 4).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }));

    const ticketCache = require('../commands/moderation/ticket').ticketCache;
    const activeTickets = [];
    ticketCache.forEach((data, channelId) => {
      if (data.guildId === g.id) {
        const ch = g.channels.cache.get(channelId);
        const member = g.members.cache.get(data.userId);
        activeTickets.push({
          channelId,
          channelName: ch ? ch.name : 'deleted',
          userId: data.userId,
          userName: member ? member.user.username : 'Unknown',
          createdAt: new Date(data.createdAt).toLocaleString(),
        });
      }
    });

    res.render('tickets', { user: req.user, guild: g, settings, channels, categories, roles, activeTickets, currentPage: 'tickets' });
  });

  app.post('/api/guilds/:guildId/tickets/panel', isAuthenticated, hasPermission, async (req, res) => {
    try {
      const settings = await getGuildSettings(req.params.guildId);
      if (!settings.ticketCategory) return res.json({ success: false, error: 'Ticket category not configured' });

      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      const ch = req.guild.channels.cache.get(req.body.channelId);
      if (!ch) return res.json({ success: false, error: 'Channel not found' });

      const embed = new EmbedBuilder()
        .setColor(settings.ticketPanelColor || '#8b5cf6')
        .setTitle(settings.ticketPanelTitle || 'Support Tickets')
        .setDescription(settings.ticketPanelDescription || 'Need help? Click the button below to create a support ticket.')
        .setFooter({ text: 'Ticket System' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('Create Ticket')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Primary),
      );

      await ch.send({ embeds: [embed], components: [row] });
      res.json({ success: true });
    } catch (e) {
      console.error('Ticket panel error:', e);
      res.json({ success: false, error: e.message });
    }
  });

  app.post('/api/guilds/:guildId/tickets/:channelId/close', isAuthenticated, hasPermission, async (req, res) => {
    try {
      const ch = req.guild.channels.cache.get(req.params.channelId);
      if (!ch) return res.json({ success: false, error: 'Channel not found' });

      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle('Ticket Closed')
        .setDescription(`Closed by dashboard\nTicket will be deleted in 10 seconds.`)
        .setTimestamp();

      await ch.send({ embeds: [embed] });
      setTimeout(() => ch.delete().catch(() => {}), 10000);
      res.json({ success: true });
    } catch (e) {
      console.error('Ticket close error:', e);
      res.json({ success: false, error: e.message });
    }
  });

  // ============ GIVEAWAYS ============
  app.get('/dashboard/:guildId/giveaways', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));

    const giveawaysMap = require('../commands/moderation/giveaway').giveaways;
    const activeGiveaways = [];
    giveawaysMap.forEach((data) => {
      if (data.guildId === g.id) {
        const ch = g.channels.cache.get(data.channelId);
        activeGiveaways.push({
          prize: data.prize,
          channelName: ch ? ch.name : 'deleted',
          winners: data.winners,
          endsAt: data.ended ? 'Ended' : new Date(data.endAt).toLocaleString(),
          entries: data.entries ? data.entries.size : 0,
          ended: data.ended,
          messageId: data.messageId,
        });
      }
    });

    res.render('giveaways', { user: req.user, guild: g, settings, channels, activeGiveaways, currentPage: 'giveaways' });
  });

  app.post('/api/guilds/:guildId/giveaways/start', isAuthenticated, hasPermission, async (req, res) => {
    try {
      const { channelId, prize, duration, winners } = req.body;
      if (!channelId || !prize || !duration) return res.json({ success: false, error: 'Missing required fields' });

      const ch = req.guild.channels.cache.get(channelId);
      if (!ch) return res.json({ success: false, error: 'Channel not found' });

      const numWinners = parseInt(winners) || 1;

      let ms = 0;
      const match = duration.match(/^(\d+)(m|h|d)$/);
      if (!match) return res.json({ success: false, error: 'Invalid duration format. Use 10m, 2h, or 1d' });

      const num = parseInt(match[1]);
      const unit = match[2];
      if (unit === 'm') ms = num * 60 * 1000;
      if (unit === 'h') ms = num * 60 * 60 * 1000;
      if (unit === 'd') ms = num * 24 * 60 * 60 * 1000;

      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle('GIVEAWAY')
        .setDescription(`**Prize:** ${prize}\n**Winners:** ${numWinners}\n**Ends:** <t:${Math.floor((Date.now() + ms) / 1000)}:R>\n\nReact with 🎉 to enter!`)
        .setFooter({ text: `Started by ${req.user.username}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_enter')
          .setLabel('Enter')
          .setEmoji('🎉')
          .setStyle(ButtonStyle.Primary),
      );

      const msg = await ch.send({ embeds: [embed], components: [row] });
      await msg.react('🎉');

      const giveawaysMap = require('../commands/moderation/giveaway').giveaways;
      const { endGiveaway } = require('../commands/moderation/giveaway');
      giveawaysMap.set(msg.id, {
        guildId: req.guild.id,
        channelId: ch.id,
        messageId: msg.id,
        prize,
        winners: numWinners,
        endAt: Date.now() + ms,
        hostId: req.user.id,
        ended: false,
        entries: new Set(),
      });

      setTimeout(() => endGiveaway(msg.id, client), ms);
      res.json({ success: true });
    } catch (e) {
      console.error('Giveaway start error:', e);
      res.json({ success: false, error: e.message });
    }
  });

  // ============ BOT SERVERS ============
  app.get('/dashboard/servers', isAuthenticated, (req, res) => {
    const botGuilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      memberCount: g.memberCount,
      owner: g.ownerId,
      createdAt: g.createdTimestamp,
      boostLevel: g.premiumTier || 0,
      boosts: g.premiumSubscriptionCount || 0,
      channels: g.channels.cache.size,
      roles: g.roles.cache.size,
      inviteUrl: `https://discord.com/oauth2/authorize?client_id=${client.config.clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${g.id}`,
    })).sort((a, b) => b.memberCount - a.memberCount);

    const totalMembers = botGuilds.reduce((a, g) => a + g.memberCount, 0);

    res.render('servers', { user: req.user, guilds: botGuilds, totalMembers, bot: client });
  });

  // ============ API ============
  app.get('/api/stats', (req, res) => {
    res.json({
      guilds: client.guilds.cache.size,
      users: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
      channels: client.channels.cache.size,
      commands: client.commands.size,
    });
  });

  app.get('/api/bot/health', (req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: 'online',
      uptime: client.uptime,
      ping: client.ws.ping,
      memory: { heap: mem.heapUsed, total: mem.total },
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      commands: client.commands.size,
      nodeVersion: process.version,
      discordjs: require('discord.js').version,
    });
  });

  app.get('/api/guilds/:guildId/settings', isAuthenticated, async (req, res) => {
    const userGuild = req.user.guilds?.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) {
      return res.status(403).json({ error: 'No permission' });
    }
    res.json(await getGuildSettings(req.params.guildId));
  });
  app.get('/api/guilds/:guildId/stats', isAuthenticated, async (req, res) => {
    const userGuild = req.user.guilds?.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) {
      return res.status(403).json({ error: 'No permission' });
    }
    res.json(await getGuildStats(req.params.guildId));
  });

  app.get('/api/guilds/:guildId/logs', isAuthenticated, async (req, res) => {
    const userGuild = req.user.guilds?.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) {
      return res.status(403).json({ error: 'No permission' });
    }
    const limit = parseInt(req.query.limit) || 50;
    res.json(await getLogs(req.params.guildId, null, limit));
  });

  app.get('/api/guilds/:guildId/leaderboard', isAuthenticated, async (req, res) => {
    const userGuild = req.user.guilds?.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) {
      return res.status(403).json({ error: 'No permission' });
    }
    res.json(await getLeaderboard(req.params.guildId));
  });

  app.get('/api/guilds/:guildId/warnings', isAuthenticated, async (req, res) => {
    const userGuild = req.user.guilds?.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) {
      return res.status(403).json({ error: 'No permission' });
    }
    const targetId = req.query.userId;
    if (targetId) {
      res.json(await getWarnings(req.params.guildId, targetId));
    } else {
      res.json(await getWarnings(req.params.guildId, null));
    }
  });

  // ============ ECONOMY API ============
  app.get('/api/guilds/:guildId/economy', isAuthenticated, async (req, res) => {
    const userGuild = req.user.guilds?.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) {
      return res.status(403).json({ error: 'No permission' });
    }
    const entries = await getEconomyLeaderboard(req.params.guildId);
    res.json(entries.map(e => ({ userId: e.userId || e.user_id, wallet: e.wallet, bank: e.bank, total: (e.wallet || 0) + (e.bank || 0) })));
  });

  app.get('/api/guilds/:guildId/economy/:userId', isAuthenticated, async (req, res) => {
    const userGuild = req.user.guilds?.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) {
      return res.status(403).json({ error: 'No permission' });
    }
    const entry = await getEconomy(req.params.guildId, req.params.userId);
    res.json(entry);
  });

  // ============ BOT FEATURES API ============
  app.get('/api/features', (req, res) => {
    res.json({
      moderation: ['ban', 'kick', 'mute', 'unmute', 'warn', 'warnings', 'purge', 'tempban', 'softban', 'unban', 'massban', 'nuke', 'prune', 'nick', 'slowmode', 'lock', 'unlock', 'serverlock', 'antiscam', 'raid', 'verification', 'ticket', 'giveaway'],
      economy: ['balance', 'daily', 'work', 'shop', 'buy', 'inventory', 'pay', 'coinflip', 'leaderboard', 'deposit', 'withdraw', 'rob', 'slots', 'beg', 'give', 'economyboard'],
      social: ['profile', 'rep', 'marry'],
      advanced: ['translate', 'remindme', 'notes', 'stats', 'serverlist', 'whois'],
      image: ['meme', 'cat', 'dog', 'waifu', 'drink', 'howgay', 'rate', 'simprate'],
      utility: ['ping', 'help', 'avatar', 'userinfo', 'serverinfo', 'poll', 'remind', 'msg', 'afk', 'base64', 'snipe', 'editsnipe', 'weather', 'channelinfo', 'boosters', 'level', 'members'],
      fun: ['8ball', 'roll', 'decide', 'say', 'reverse', 'choose', 'ascii', 'wouldyourather', 'trivia', 'joke', 'quote', 'hug', 'slap', 'clap', 'roast', 'rps', 'hack', 'guy'],
      setup: ['setup', 'setwelcome', 'setgoodbye', 'setlog', 'setprefix', 'setautorole', 'automod'],
      custom: ['addcommand', 'removecommand', 'listcommands', 'reactionrole'],
      info: [],
      totalCommands: client.commands.size,
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.redirect('/auth/error?msg=' + encodeURIComponent(err.message || 'Server error'));
  });

  const port = client.config.port || 3000;
  const server = app.listen(port, () => {
    console.log(`\n🌐 Dashboard: ${publicUrl || 'http://localhost:' + port}`);
    console.log(`🤖 Bot: ${client.user ? 'Connected' : 'Connecting...'}\n`);
  });
  server.on('error', (err) => {
    console.error('[DASHBOARD] Server error:', err.message);
  });
}

module.exports = { startDashboard };
