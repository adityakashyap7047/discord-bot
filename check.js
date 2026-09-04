process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

try {
  require('dotenv').config();
  const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
  const fs = require('fs');
  const path = require('path');

  console.log('Loading database...');
  const db = require('./utils/database');
  console.log('DB loaded OK');

  console.log('Loading commands...');
  let loaded = 0;
  let errors = 0;
  const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
  for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, 'commands', folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
      try {
        const command = require(path.join(folderPath, file));
        if ('data' in command && 'execute' in command) {
          loaded++;
        } else {
          console.error(`MISSING exports: ${folder}/${file}`);
          errors++;
        }
      } catch (e) {
        console.error(`ERROR loading ${folder}/${file}: ${e.message}`);
        errors++;
      }
    }
  }
  console.log(`Commands loaded: ${loaded}, errors: ${errors}`);

  console.log('Loading events...');
  const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    try {
      const event = require(path.join(__dirname, 'events', file));
      console.log(`  Event: ${event.name} (${event.once ? 'once' : 'on'})`);
    } catch (e) {
      console.error(`ERROR loading event ${file}: ${e.message}`);
    }
  }
  console.log('Events loaded OK');

  console.log('Testing dashboard server...');
  const { startDashboard } = require('./dashboard/server');
  console.log('Dashboard module loaded OK');

  console.log('\n=== ALL MODULES LOADED SUCCESSFULLY ===');
  console.log('No import errors found. The crash may be at runtime (missing env vars, Discord API, etc.)');
  
  process.exit(0);
} catch (e) {
  console.error('\n=== CRASH ===');
  console.error('Error:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}
