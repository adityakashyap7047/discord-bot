const { Events } = require('discord.js');
const { getGuildSettings, addInvite, updateInvite } = require('../utils/database');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, client) {
    const settings = getGuildSettings(member.guild.id);

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
          const { EmbedBuilder } = require('discord.js');
          const msg = (settings.welcomeMessage || 'Welcome {user} to {server}!').replace('{user}', `<@${member.id}>`).replace('{server}', member.guild.name).replace('{memberCount}', member.guild.memberCount);
          const embed = new EmbedBuilder()
            .setColor(settings.welcomeColor || '#00ff00')
            .setDescription(msg + inviterText)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
          if (settings.welcomeImage) embed.setImage(settings.welcomeImage);
          embed.setFooter({ text: `Member #${member.guild.memberCount}` });
          channel.send({ embeds: [embed] });
        } else {
          const msg = (settings.welcomeMessage || 'Welcome {user} to {server}!')
            .replace('{user}', `<@${member.id}>`)
            .replace('{server}', member.guild.name)
            .replace('{memberCount}', member.guild.memberCount) + inviterText;
          channel.send(msg);
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

    // Log join
    if (settings.logChannel && settings.logJoins) {
      const { EmbedBuilder } = require('discord.js');
      const logCh = member.guild.channels.cache.get(settings.logChannel);
      if (logCh) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('Member Joined')
          .addFields(
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Members', value: String(member.guild.memberCount), inline: true },
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        logCh.send({ embeds: [embed] });
      }
    }
  },
};
