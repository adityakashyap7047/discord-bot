const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Ready! Logged in as ${client.user.tag}`);
    console.log(`📡 Serving ${client.guilds.cache.size} guilds`);

    const statuses = [
      { name: 'with absolute power | /help', type: ActivityType.Watching },
      { name: 'Varunastra | Divine Weapon', type: ActivityType.Watching },
      { name: 'with the server rules ⚡', type: ActivityType.Watching },
      { name: `in ${client.guilds.cache.size} servers`, type: ActivityType.Watching },
      { name: `${client.users.cache.size.toLocaleString()} users`, type: ActivityType.Watching },
      { name: '!help | Dashboard', type: ActivityType.Watching },
    ];

    client.user.setActivity(statuses[0].name, { type: statuses[0].type });

    let i = 0;
    setInterval(() => {
      i++;
      const status = statuses[i % statuses.length];
      client.user.setActivity(status.name, { type: status.type });
    }, 10000);
  },
};
