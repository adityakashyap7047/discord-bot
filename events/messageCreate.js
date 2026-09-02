const { Events, Collection } = require('discord.js');
const { getGuildSettings, getCustomCommand, getLevel, updateLevel } = require('../utils/database');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const settings = getGuildSettings(message.guild.id);
    const prefix = settings.prefix || client.config.prefix;

    // Auto-moderation
    if (settings.autoMod) {
      const badWords = ['slur', 'nword', 'retard'];
      const lowerContent = message.content.toLowerCase();
      if (badWords.some(w => lowerContent.includes(w))) {
        await message.delete().catch(() => {});
        return message.channel.send('🚫 Message deleted: Contains banned words.').then(m => setTimeout(() => m.delete(), 5000));
      }
    }

    if (settings.antiSpam) {
      if (!client.spamCache) client.spamCache = new Map();
      const userSpam = client.spamCache.get(message.author.id) || [];
      userSpam.push(Date.now());
      const filtered = userSpam.filter(t => Date.now() - t < (settings.floodTimeframe || 5) * 1000);
      client.spamCache.set(message.author.id, filtered);
      if (filtered.length > (settings.floodLimit || 5)) {
        await message.delete().catch(() => {});
        return message.channel.send('🚫 Anti-spam: Slow down!').then(m => setTimeout(() => m.delete(), 3000));
      }
    }

    if (settings.antiLink) {
      if (/https?:\/\/[^\s]+/.test(message.content) && !message.member.permissions.has('ManageMessages')) {
        await message.delete().catch(() => {});
        return message.channel.send('🚫 Links are not allowed here.').then(m => setTimeout(() => m.delete(), 3000));
      }
    }

    // Level system
    if (settings.levelSystem && !message.content.startsWith(prefix)) {
      const xpGain = Math.floor(Math.random() * 15) + 5;
      let levelData = getLevel(message.guild.id, message.author.id);
      if (!levelData) {
        updateLevel(message.guild.id, message.author.id, xpGain, 1);
        levelData = { xp: xpGain, level: 1 };
      } else {
        const newXp = levelData.xp + xpGain;
        const xpNeeded = levelData.level * 100;
        if (newXp >= xpNeeded) {
          updateLevel(message.guild.id, message.author.id, 0, levelData.level + 1);
          const msg = (settings.levelUpMessage || '🎉 {user} leveled up to **Level {level}**!')
            .replace('{user}', `<@${message.author.id}>`)
            .replace('{level}', levelData.level + 1);
          if (settings.levelChannel) {
            const ch = message.guild.channels.cache.get(settings.levelChannel);
            if (ch) ch.send(msg);
          } else {
            message.channel.send(msg);
          }
        } else {
          updateLevel(message.guild.id, message.author.id, newXp, levelData.level);
        }
      }
      return;
    }

    if (!message.content.startsWith(prefix)) return;

    // Custom commands
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const customCmd = getCustomCommand(message.guild.id, commandName);
    if (customCmd) {
      return message.channel.send(customCmd.response.replace('{user}', `<@${message.author.id}>`));
    }

    const command = client.commands.get(commandName);
    if (!command) return;

    // Cooldowns
    if (!client.cooldowns.has(command.data.name)) {
      client.cooldowns.set(command.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.data.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`Please wait ${timeLeft.toFixed(1)}s before using \`${command.data.name}\` again.`);
      }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(error);
      message.reply('There was an error executing that command!');
    }
  },
};
