const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, addInvite, updateInvite, addLog } = require('../utils/database');
const { getAccountAgeDays, isSuspiciousUsername, isHighRiskAccount } = require('../utils/accountChecks');
const { checkRaid } = require('../utils/raidProtection');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, client) {
    const settings = await getGuildSettings(member.guild.id);

    // Raid Protection
    const raidResult = await checkRaid(member, settings, client);
    if (raidResult.triggered) {
      if (raidResult.inLockdown) return;
    }

    // Account Age Gate
    if (settings.accountAgeGate) {
      const accountAge = getAccountAgeDays(member.user);
      const minAge = settings.minAccountAge || 7;
      if (accountAge < minAge) {
        try {
          await member.kick(`Account age gate: Account is only ${accountAge} days old (min: ${minAge})`).catch(() => {});
          const logEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Account Age Gate')
            .setDescription(`${member.user.tag} was kicked for being a new account (${accountAge} days old)`)
            .addFields(
              { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
              { name: 'Account Age', value: `${accountAge} days`, inline: true },
              { name: 'Min Required', value: `${minAge} days`, inline: true },
            )
            .setTimestamp();
          logAction(member.guild, settings, logEmbed, client);
          return;
        } catch (e) {}
      }
    }

    // Suspicious Username Detection
    if (settings.suspiciousUsernameDetection) {
      if (isSuspiciousUsername(member.user.username)) {
        const logEmbed = new EmbedBuilder()
          .setColor('#ffff00')
          .setTitle('Suspicious Username Detected')
          .setDescription(`${member.user.tag} has a suspicious username pattern`)
          .addFields(
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Username', value: member.user.username, inline: true },
          )
          .setTimestamp();
        logAction(member.guild, settings, logEmbed, client);
      }
    }

    // High Risk Account Alert
    const riskCheck = isHighRiskAccount(member);
    if (riskCheck.isHighRisk && settings.scamAlertsChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#ff8800')
        .setTitle('High Risk Account Joined')
        .setDescription(`${member.user.tag} flagged as high risk`)
        .addFields(
          { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
          { name: 'Account Age', value: `${riskCheck.accountAge} days`, inline: true },
          { name: 'Risk Factors', value: riskCheck.reasons.join('\n') || 'None', inline: false },
        )
        .setTimestamp();
      const alertCh = member.guild.channels.cache.get(settings.scamAlertsChannel);
      if (alertCh) alertCh.send({ embeds: [logEmbed] }).catch(() => {});
    }

    // Auto Timeout for New Members
    if (settings.newMemberTimeout) {
      try {
        const duration = settings.newMemberTimeoutDuration || 60000;
        await member.timeout(duration, 'Auto-timeout for new members').catch(() => {});
      } catch (e) {}
    }

    // Auto Role
    if (settings.autoroleEnabled && settings.autoroleId) {
      try {
        const role = member.guild.roles.cache.get(settings.autoroleId);
        if (role) await member.roles.add(role).catch(() => {});
      } catch (e) {}
    }

    // Welcome Message
    if (settings.welcomeEnabled && settings.welcomeChannel) {
      const channel = member.guild.channels.cache.get(settings.welcomeChannel);
      if (channel) {
        let inviterText = '';
        if (settings.inviteTracker) {
          try {
            const invites = await member.guild.invites.fetch();
            const usedInvite = invites.find(i => i.uses > (client._inviteCache?.[i.code]?.uses || 0));
            if (usedInvite) {
              inviterText = `\nInvited by: <@${usedInvite.inviter.id}> (${usedInvite.uses} total invites)`;
              addInvite(member.guild.id, usedInvite.code, usedInvite.inviter.id, usedInvite.uses);
            }
          } catch (e) {}
        }

        if (settings.welcomeEmbed) {
          const msg = (settings.welcomeMessage || 'Welcome {user} to {server}!').replace('{user}', `<@${member.id}>`).replace('{server}', member.guild.name).replace('{memberCount}', member.guild.memberCount);
          const embed = new EmbedBuilder()
            .setColor(settings.welcomeColor || '#00ff00')
            .setDescription(msg + inviterText)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
          if (settings.welcomeImage && /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(settings.welcomeImage)) {
            embed.setImage(settings.welcomeImage);
          }
          embed.setFooter({ text: `Member #${member.guild.memberCount}` });
          channel.send({ embeds: [embed] }).catch(() => {});
        } else {
          const msg = (settings.welcomeMessage || 'Welcome {user} to {server}!')
            .replace('{user}', `<@${member.id}>`)
            .replace('{server}', member.guild.name)
            .replace('{memberCount}', member.guild.memberCount) + inviterText;
          channel.send(msg).catch(() => {});
        }
      }
    }

    // Welcome Roles
    if (settings.welcomeRoles && settings.welcomeRoles.length > 0) {
      for (const roleId of settings.welcomeRoles) {
        try {
          const role = member.guild.roles.cache.get(roleId);
          if (role) await member.roles.add(role).catch(() => {});
        } catch (e) {}
      }
    }

    // Verification System
    if (settings.verificationEnabled && settings.verificationChannel && settings.verificationRole) {
      const verChannel = member.guild.channels.cache.get(settings.verificationChannel);
      if (verChannel) {
        const verEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Verification Required')
          .setDescription(settings.verificationMessage || 'Welcome! Please react with ✅ to verify.')
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        try {
          const msg = await verChannel.send({ embeds: [verEmbed] });
          await msg.react('✅');
          client.verificationCache = client.verificationCache || new Map();
          client.verificationCache.set(msg.id, {
            guildId: member.guild.id,
            userId: member.id,
            roleId: settings.verificationRole,
          });
        } catch (e) {}
      }
    }

    // Log join
    if (settings.logChannel && settings.logJoins) {
      const logCh = member.guild.channels.cache.get(settings.logChannel);
      if (logCh) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('Member Joined')
          .addFields(
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Members', value: String(member.guild.memberCount), inline: true },
            { name: 'Account Age', value: `${getAccountAgeDays(member.user)} days`, inline: true },
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        logCh.send({ embeds: [embed] }).catch(() => {});
        addLog(member.guild.id, 'member_join', null, member.id, 'Member joined the server');
      }
    }
  },
};

function logAction(guild, settings, embed, client) {
  const channelId = settings.scamAlertsChannel || settings.logChannel;
  if (channelId) {
    const logCh = guild.channels.cache.get(channelId);
    if (logCh) logCh.send({ embeds: [embed] }).catch(() => {});
  }
}
