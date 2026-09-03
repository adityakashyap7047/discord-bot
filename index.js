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
  console.log(`✅ Logged in as ${client.user.tag}`);

  const statuses = [
    { name: 'with absolute power | /help', type: 3 },
    { name: 'God Mode | 𝕲𝖚𝖞 𝖜𝖎𝖙𝖍 𝖆𝖑𝖑 𝖕𝖔𝖜𝖊𝖗𝖘', type: 3 },
    { name: 'with the server rules ⚡', type: 3 },
    { name: `in ${client.guilds.cache.size} servers`, type: 3 },
    { name: `${client.users.cache.size.toLocaleString()} users`, type: 3 },
    { name: '!help | Dashboard', type: 3 },
  ];

  let i = 0;
  setInterval(() => {
    const status = statuses[i % statuses.length];
    client.user.setActivity(status.name, { type: status.type });
    i++;
  }, 10000);

  setInterval(() => {
    if (client.spamCache) client.spamCache.clear();
  }, 300000);
});

client.login(client.config.token).catch((err) => {
  console.error('[FATAL] Failed to login:', err);
  process.exit(1);
});
