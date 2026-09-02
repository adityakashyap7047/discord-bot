const { EmbedBuilder } = require('discord.js');
const { getGuildSettings: dbGetGuildSettings, updateGuildSetting: dbUpdateGuildSetting } = require('./database');

function getGuildSettings(clientOrDb, guildId) {
  return dbGetGuildSettings(guildId);
}

function updateGuildSetting(clientOrDb, guildId, key, value) {
  return dbUpdateGuildSetting(guildId, key, value);
}

function createEmbed(color, title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  fields.forEach(f => embed.addFields(f));
  return embed;
}

function successEmbed(title, desc) {
  return createEmbed(0x00ff00, `✅ ${title}`, desc);
}

function errorEmbed(title, desc) {
  return createEmbed(0xff0000, `❌ ${title}`, desc);
}

function warnEmbed(title, desc) {
  return createEmbed(0xffff00, `⚠️ ${title}`, desc);
}

function infoEmbed(title, desc) {
  return createEmbed(0x0099ff, `ℹ️ ${title}`, desc);
}

module.exports = { getGuildSettings, updateGuildSetting, createEmbed, successEmbed, errorEmbed, warnEmbed, infoEmbed };
