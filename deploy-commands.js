require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder)).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', folder, file));
    if ('data' in command) {
      commands.push(command.data.toJSON());
    }
  }
}

console.log(`📦 Found ${commands.length} commands:`);
const categories = {};
for (const cmd of commands) {
  const folder = Object.keys(commandFolders).find(f => {
    const files = fs.readdirSync(path.join(__dirname, 'commands', commandFolders[f]));
    return files.includes(cmd.name + '.js');
  }) || 'unknown';
  if (!categories[commandFolders[folder] || 'unknown']) categories[commandFolders[folder] || 'unknown'] = [];
  categories[commandFolders[folder] || 'unknown'].push(cmd.name);
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
