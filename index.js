require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./utils/database');
const { startDashboard } = require('./dashboard/server');

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
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

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
});

client.login(client.config.token);
