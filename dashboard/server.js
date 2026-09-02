const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const { getGuildSettings, updateGuildSetting } = require('../utils/database');

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
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  passport.use(new DiscordStrategy({
    clientID: client.config.clientId,
    clientSecret: client.config.clientSecret,
    callbackURL: client.config.callbackURL,
    scope: ['identify', 'guilds', 'guilds.manage'],
  }, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));

  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/login');
  }

  app.get('/auth/login', passport.authenticate('discord'));
  app.get('/auth/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
  app.get('/auth/logout', (req, res) => { req.logout(() => res.redirect('/')); });

  app.get('/', (req, res) => {
    res.render('home', { user: req.user, bot: client });
  });

  app.get('/dashboard', isAuthenticated, (req, res) => {
    const mutualGuilds = req.user.guilds.filter(g => {
      return client.guilds.cache.has(g.id) && (parseInt(g.permissions) & 0x20) === 0x20;
    });
    res.render('dashboard', { user: req.user, guilds: mutualGuilds });
  });

  app.get('/dashboard/:guildId', isAuthenticated, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.redirect('/dashboard');
    const userGuild = req.user.guilds.find(g => g.id === req.params.guildId);
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20) return res.redirect('/dashboard');
    const settings = getGuildSettings(guild.id);
    const channels = guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
    const roles = guild.roles.cache.filter(r => r.id !== guild.id).map(r => ({ id: r.id, name: r.name }));
    res.render('server', { user: req.user, guild, settings, channels, roles });
  });

  app.post('/dashboard/:guildId/update', isAuthenticated, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.redirect('/dashboard');
    const s = req.body;

    if (s.prefix !== undefined) updateGuildSetting(guild.id, 'prefix', s.prefix || '!');
    if (s.welcomeChannel !== undefined) updateGuildSetting(guild.id, 'welcomeChannel', s.welcomeChannel || null);
    if (s.welcomeMessage !== undefined) updateGuildSetting(guild.id, 'welcomeMessage', s.welcomeMessage);
    if (s.welcomeEnabled !== undefined) updateGuildSetting(guild.id, 'welcomeEnabled', s.welcomeEnabled === 'on');
    if (s.goodbyeChannel !== undefined) updateGuildSetting(guild.id, 'goodbyeChannel', s.goodbyeChannel || null);
    if (s.goodbyeMessage !== undefined) updateGuildSetting(guild.id, 'goodbyeMessage', s.goodbyeMessage);
    if (s.goodbyeEnabled !== undefined) updateGuildSetting(guild.id, 'goodbyeEnabled', s.goodbyeEnabled === 'on');
    if (s.modLogChannel !== undefined) updateGuildSetting(guild.id, 'modLogChannel', s.modLogChannel || null);
    if (s.autoRole !== undefined) updateGuildSetting(guild.id, 'autoRole', s.autoRole || null);
    if (s.autoMod !== undefined) updateGuildSetting(guild.id, 'autoMod', s.autoMod === 'on');
    if (s.antiSpam !== undefined) updateGuildSetting(guild.id, 'antiSpam', s.antiSpam === 'on');
    if (s.antiLink !== undefined) updateGuildSetting(guild.id, 'antiLink', s.antiLink === 'on');

    res.redirect(`/dashboard/${guild.id}`);
  });

  app.get('/api/guilds/:guildId/settings', (req, res) => {
    const settings = getGuildSettings(req.params.guildId);
    res.json(settings);
  });

  app.get('/api/stats', (req, res) => {
    res.json({
      guilds: client.guilds.cache.size,
      users: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
      channels: client.channels.cache.size,
      commands: client.commands.size,
    });
  });

  const port = client.config.port || 3000;
  app.listen(port, () => {
    console.log(`🌐 Dashboard running on port ${port}`);
  });
}

module.exports = { startDashboard };
