require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

// These folders are excluded from slash registration (still work with ! prefix)
// Discord has a 100 slash command limit
const skipFolders = ['fun'];

for (const folder of commandFolders) {
  if (skipFolders.includes(folder)) {
    console.log(`⏩ Skipping folder "${folder}" (prefix-only commands)`);
    continue;
  }
  const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder)).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', folder, file));
    if (command.data && typeof command.execute === 'function') {
      commands.push(command.data.toJSON());
    }
  }
}

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  throw new Error('DISCORD_TOKEN and CLIENT_ID must be set before deploying commands.');
}

if (commands.length > 100) {
  throw new Error(`Cannot register ${commands.length} global slash commands; Discord allows at most 100.`);
}

console.log(`📦 Found ${commands.length} commands:`);
const categories = {};
for (const folder of commandFolders) {
  if (skipFolders.includes(folder)) continue;
  const names = fs.readdirSync(path.join(__dirname, 'commands', folder))
    .filter(file => file.endsWith('.js'))
    .map(file => require(path.join(__dirname, 'commands', folder, file)).data?.name)
    .filter(Boolean);
  if (names.length) categories[folder] = names;
}

for (const [cat, cmds] of Object.entries(categories)) {
  console.log(`  ${cat}: ${cmds.join(', ')}`);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Registering ${commands.length} slash commands...`);
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log(`✅ Successfully registered ${data.length} slash commands.`);
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
})();
