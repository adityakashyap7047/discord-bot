require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./utils/database');
const { startDashboard } = require('./dashboard/server');

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.db = db;
client.config = {
  prefix: process.env.BOT_PREFIX || '!',
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  sessionSecret: process.env.SESSION_SECRET,
  port: process.env.PORT || 3000,
};

const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder)).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', folder, file));
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  }
}

const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file));
  const handler = (...args) => {
    const result = event.execute(...args, client);
    if (result && typeof result.catch === 'function') {
      result.catch((err) => {
        console.error(`[EVENT ERROR] ${event.name}:`, err);
      });
    }
  };
  if (event.once) {
    client.once(event.name, handler);
  } else {
    client.on(event.name, handler);
  }
}

client.on('error', (err) => {
  console.error('[CLIENT ERROR]', err);
});

client.on('warn', (info) => {
  console.warn('[CLIENT WARN]', info);
});

client.on('disconnect', () => {
  console.warn('[CLIENT] Disconnected from gateway');
});

client.on('shardError', (err, shardId) => {
  console.error(`[SHARD ${shardId}] Error:`, err);
});

client.on('shardDisconnect', (event, shardId) => {
  console.warn(`[SHARD ${shardId}] Disconnected (code: ${event.code})`);
});

db.loadDB();
startDashboard(client);

client.once('ready', () => {
  console.log(`✅ VARUNASTRA | Logged in as ${client.user.tag} | ${client.commands.size} commands loaded`);

  const statuses = [
    { name: '⚡ with divine power | /help', type: 3 },
    { name: '🛡️ protecting servers', type: 3 },
    { name: `${client.commands.size} commands loaded`, type: 3 },
    { name: `in ${client.guilds.cache.size} servers`, type: 3 },
    { name: `${client.users.cache.size.toLocaleString()} users | /botinfo`, type: 3 },
    { name: '💰 economy | gambling | trading', type: 3 },
    { name: '🚫 anti-scam active', type: 3 },
    { name: '🎮 fun | trivia | jokes', type: 3 },
    { name: '⚙️ dashboard: /dashboard', type: 3 },
    { name: '🚀 VARUNASTRA — Divine Weapon', type: 3 },
  ];

  let i = 0;
  setInterval(() => {
    const status = statuses[i % statuses.length];
    client.user.setActivity(status.name, { type: status.type });
    i++;
  }, 8000);

  setInterval(() => {
    if (client.spamCache) client.spamCache.clear();
  }, 300000);

  const publicUrl = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_URL || (process.env.RENDER ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : '');
  if (publicUrl) {
    const http = require('http');
    setInterval(() => {
      http.get(publicUrl, (res) => {
        console.log(`[KEEP-ALIVE] Pinged ${publicUrl} - Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('[KEEP-ALIVE] Ping failed:', err.message);
      });
    }, 10 * 60 * 1000);
    console.log(`[KEEP-ALIVE] Pinger active for ${publicUrl}`);
  }
});

client.login(client.config.token).catch((err) => {
  console.error('[FATAL] Failed to login:', err);
  process.exit(1);
});
