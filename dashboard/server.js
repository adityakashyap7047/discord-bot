const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const {
  getGuildSettings, updateGuildSetting, updateGuildSettings,
  getWarnings, clearWarnings, addWarning,
  getCustomCommands, addCustomCommand, removeCustomCommand,
  getReactionRoles, addReactionRole, removeReactionRole,
  getLeaderboard, getInviteLeaderboard,
  getLogs, getGuildStats,
  getEmbeds, addEmbed, removeEmbed, getEmbed,
  getInvites,
} = require('../utils/database');

function startDashboard(client) {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(session({
    secret: client.config.sessionSecret || 'discord-bot-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // Detect if running on Render or localhost
  const isProduction = process.env.RENDER || process.env.NODE_ENV === 'production';
  const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_URL || (process.env.RENDER ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : '');
  const publicUrl = renderUrl || process.env.PUBLIC_URL || '';

  // Auto-detect callback URL
  let callbackURL = client.config.callbackURL;
  if (isProduction && publicUrl) {
    callbackURL = publicUrl + '/auth/callback';
  }
  if (!callbackURL.startsWith('http')) {
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

  function hasPermission(req, res, next) {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.redirect('/dashboard');
    const userGuild = req.user.guilds.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) return res.redirect('/dashboard');
    req.guild = guild;
    req.guildSettings = getGuildSettings(guild.id);
    next();
  }

  // ============ AUTH ============
  app.get('/auth/login', passport.authenticate('discord', { prompt: 'consent' }));
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
      const hasManageServer = (parseInt(g.permissions) & 0x20) === 0x20;
      return hasManageServer;
    }).map(g => ({
      ...g,
      botInServer: botGuilds.has(g.id),
    }));

    res.render('dashboard', { user: req.user, guilds: guildsWithAccess, bot: client });
  });

  // ============ SETTINGS ============
  app.get('/dashboard/:guildId', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).sort((a, b) => a.position - b.position).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id && !r.managed).sort((a, b) => b.position - a.position).map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
    const stats = getGuildStats(g.id);
    res.render('server', { user: req.user, guild: g, settings, channels, roles, stats, currentPage: 'settings' });
  });

  app.post('/dashboard/:guildId/update', isAuthenticated, hasPermission, (req, res) => {
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
    updateGuildSettings(req.guild.id, updates);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true });
    }
    res.redirect(`/dashboard/${req.guild.id}?saved=true`);
  });

  // ============ WELCOME ============
  app.get('/dashboard/:guildId/welcome', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }));
    res.render('welcome', { user: req.user, guild: g, settings, channels, roles, currentPage: 'welcome' });
  });

  app.post('/dashboard/:guildId/welcome', isAuthenticated, hasPermission, (req, res) => {
    const s = req.body;
    updateGuildSettings(req.guild.id, {
      welcomeEnabled: s.welcomeEnabled === 'on',
      welcomeChannel: s.welcomeChannel || null,
      welcomeMessage: s.welcomeMessage || 'Welcome {user} to {server}!',
      welcomeEmbed: s.welcomeEmbed === 'on',
      welcomeColor: s.welcomeColor || '#00ff00',
      welcomeImage: s.welcomeImage || '',
      goodbyeEnabled: s.goodbyeEnabled === 'on',
      goodbyeChannel: s.goodbyeChannel || null,
      goodbyeMessage: s.goodbyeMessage || 'Goodbye {user}!',
      goodbyeEmbed: s.goodbyeEmbed === 'on',
      goodbyeColor: s.goodbyeColor || '#ff0000',
      goodbyeImage: s.goodbyeImage || '',
      boostMessage: s.boostMessage || '',
      boostChannel: s.boostChannel || null,
      welcomeRoles: s.welcomeRoles ? (Array.isArray(s.welcomeRoles) ? s.welcomeRoles : [s.welcomeRoles]) : [],
    });
    res.redirect(`/dashboard/${req.guild.id}/welcome?saved=true`);
  });

  // ============ MODERATION ============
  app.get('/dashboard/:guildId/moderation', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }));
    res.render('moderation', { user: req.user, guild: g, settings, channels, roles, currentPage: 'moderation' });
  });

  app.post('/dashboard/:guildId/moderation', isAuthenticated, hasPermission, (req, res) => {
    const s = req.body;
    updateGuildSettings(req.guild.id, {
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
    res.redirect(`/dashboard/${req.guild.id}/moderation?saved=true`);
  });

  // ============ LOGGING ============
  app.get('/dashboard/:guildId/logging', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const logs = getLogs(g.id, null, 50);
    res.render('logging', { user: req.user, guild: g, settings, channels, logs, currentPage: 'logging' });
  });

  app.post('/dashboard/:guildId/logging', isAuthenticated, hasPermission, (req, res) => {
    const s = req.body;
    updateGuildSettings(req.guild.id, {
      logChannel: s.logChannel || null,
      logMessages: s.logMessages === 'on',
      logJoins: s.logJoins === 'on',
      logBans: s.logBans === 'on',
      logEdits: s.logEdits === 'on',
      voiceChannelLog: s.voiceChannelLog === 'on',
    });
    res.redirect(`/dashboard/${req.guild.id}/logging?saved=true`);
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

  app.post('/dashboard/:guildId/roles/autorole', isAuthenticated, hasPermission, (req, res) => {
    updateGuildSettings(req.guild.id, {
      autoroleEnabled: req.body.autoroleEnabled === 'on',
      autoroleId: req.body.autoroleId || null,
    });
    res.redirect(`/dashboard/${req.guild.id}/roles?saved=true`);
  });

  // ============ COMMANDS ============
  app.get('/dashboard/:guildId/commands', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const customCmds = getCustomCommands(g.id);
    res.render('commands', { user: req.user, guild: g, settings, customCommands: customCmds, currentPage: 'commands' });
  });

  app.post('/dashboard/:guildId/commands/add', isAuthenticated, hasPermission, (req, res) => {
    addCustomCommand(req.guild.id, req.body.name, req.body.response, req.user.id);
    res.redirect(`/dashboard/${req.guild.id}/commands?saved=true`);
  });

  app.post('/dashboard/:guildId/commands/remove', isAuthenticated, hasPermission, (req, res) => {
    removeCustomCommand(req.guild.id, req.body.name);
    res.redirect(`/dashboard/${req.guild.id}/commands?saved=true`);
  });

  // ============ EMBEDS ============
  app.get('/dashboard/:guildId/embeds', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const embeds = getEmbeds(g.id);
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.render('embeds', { user: req.user, guild: g, settings, embeds, channels, currentPage: 'embeds' });
  });

  app.post('/dashboard/:guildId/embeds/add', isAuthenticated, hasPermission, (req, res) => {
    const { name, title, description, color, footer } = req.body;
    addEmbed(req.guild.id, name, { title, description, color, footer }, req.user.id);
    res.redirect(`/dashboard/${req.guild.id}/embeds?saved=true`);
  });

  app.post('/dashboard/:guildId/embeds/send', isAuthenticated, hasPermission, (req, res) => {
    const { channel, title, description, color, thumbnail, image, footer, author } = req.body;
    const ch = req.guild.channels.cache.get(channel);
    if (ch) {
      const embed = new (require('discord.js').EmbedBuilder)()
        .setTitle(title || '').setDescription(description || '').setColor(color || '#5865f2');
      if (thumbnail) embed.setThumbnail(thumbnail);
      if (image) embed.setImage(image);
      if (footer) embed.setFooter({ text: footer });
      if (author) embed.setAuthor({ name: author });
      ch.send({ embeds: [embed] });
    }
    res.redirect(`/dashboard/${req.guild.id}/embeds?sent=true`);
  });

  app.post('/dashboard/:guildId/embeds/remove', isAuthenticated, hasPermission, (req, res) => {
    removeEmbed(req.guild.id, req.body.name);
    res.redirect(`/dashboard/${req.guild.id}/embeds?saved=true`);
  });

  // ============ INVITES ============
  app.get('/dashboard/:guildId/invites', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const invites = getInvites(g.id);
    const leaderboard = getInviteLeaderboard(g.id);
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.render('invites', { user: req.user, guild: g, settings, invites, leaderboard, channels, currentPage: 'invites' });
  });

  app.post('/dashboard/:guildId/invites', isAuthenticated, hasPermission, (req, res) => {
    updateGuildSettings(req.guild.id, {
      inviteTracker: req.body.inviteTracker === 'on',
      inviteLogChannel: req.body.inviteLogChannel || null,
    });
    res.redirect(`/dashboard/${req.guild.id}/invites?saved=true`);
  });

  // ============ LEVELS ============
  app.get('/dashboard/:guildId/levels', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const leaderboard = getLeaderboard(g.id);
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.render('levels', { user: req.user, guild: g, settings, leaderboard, channels, currentPage: 'levels' });
  });

  app.post('/dashboard/:guildId/levels', isAuthenticated, hasPermission, (req, res) => {
    updateGuildSettings(req.guild.id, {
      levelSystem: req.body.levelSystem === 'on',
      levelChannel: req.body.levelChannel || null,
      levelUpMessage: req.body.levelUpMessage || '🎉 {user} leveled up to **Level {level}**!',
    });
    res.redirect(`/dashboard/${req.guild.id}/levels?saved=true`);
  });

  // ============ STARBORD ============
  app.get('/dashboard/:guildId/starboard', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    res.render('starboard', { user: req.user, guild: g, settings, channels, currentPage: 'starboard' });
  });

  app.post('/dashboard/:guildId/starboard', isAuthenticated, hasPermission, (req, res) => {
    updateGuildSettings(req.guild.id, {
      starboardEnabled: req.body.starboardEnabled === 'on',
      starboardChannel: req.body.starboardChannel || null,
      starboardThreshold: parseInt(req.body.starboardThreshold) || 3,
    });
    res.redirect(`/dashboard/${req.guild.id}/starboard?saved=true`);
  });

  // ============ REACTION ROLES ============
  app.get('/dashboard/:guildId/reactionroles', isAuthenticated, hasPermission, (req, res) => {
    const g = req.guild;
    const settings = req.guildSettings;
    const rr = getReactionRoles(g.id);
    const channels = g.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const roles = g.roles.cache.filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }));
    res.render('reactionroles', { user: req.user, guild: g, settings, reactionRoles: rr, channels, roles, currentPage: 'reactionroles' });
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

  app.get('/api/guilds/:guildId/settings', (req, res) => res.json(getGuildSettings(req.params.guildId)));
  app.get('/api/guilds/:guildId/stats', (req, res) => res.json(getGuildStats(req.params.guildId)));

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.redirect('/auth/error?msg=' + encodeURIComponent(err.message || 'Server error'));
  });

  const port = client.config.port || 3000;
  app.listen(port, () => {
    console.log(`\n🌐 Dashboard: ${publicUrl || 'http://localhost:' + port}`);
    console.log(`🤖 Bot: ${client.user ? 'Connected' : 'Connecting...'}\n`);
  });
}

module.exports = { startDashboard };
