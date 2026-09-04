const { Events, Collection, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

const NATIVE_SLASH_COMMANDS = new Set(['antiscam', 'raid', 'verification']);

function flattenOptions(options, result = []) {
  for (const option of options || []) {
    if (option.options) flattenOptions(option.options, result);
    else result.push(option);
  }
  return result;
}

function createMessageLikeInteraction(interaction, commandName) {
  const users = new Collection();
  const channels = new Collection();
  const roles = new Collection();
  const members = new Collection();
  const args = [];

  for (const option of flattenOptions(interaction.options.data)) {
    const user = interaction.options.getUser(option.name, false);
    const channel = interaction.options.getChannel(option.name, false);
    const role = interaction.options.getRole(option.name, false);

    if (user) {
      users.set(user.id, user);
      const member = interaction.options.getMember(option.name);
      if (member) members.set(user.id, member);
      args.push(`<@${user.id}>`);
    } else if (channel) {
      channels.set(channel.id, channel);
      args.push(`<#${channel.id}>`);
    } else if (role) {
      roles.set(role.id, role);
      args.push(`<@&${role.id}>`);
    } else if (option.value !== undefined) {
      args.push(String(option.value));
    }
  }

  const message = {
    author: interaction.user,
    member: interaction.member,
    guild: interaction.guild,
    channel: interaction.channel,
    createdTimestamp: interaction.createdTimestamp,
    content: `!${commandName}${args.length ? ` ${args.join(' ')}` : ''}`,
    mentions: { users, channels, roles, members },
    // Prefix implementations use this to remove their invoking message. There is
    // no user message to remove for a slash command, so this is intentionally a no-op.
    delete: async () => null,
    reply: async (payload) => {
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
      }
      await interaction.reply(payload);
      return interaction.fetchReply();
    },
  };

  return { message, args };
}

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (!client.cooldowns.has(command.data.name)) {
        client.cooldowns.set(command.data.name, new Collection());
      }
      const now = Date.now();
      const timestamps = client.cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;
      if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)}s before using \`/${command.data.name}\` again.`, ephemeral: true }).catch(() => {});
        }
      }
      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        // A few configuration commands are written as native interaction
        // handlers. The rest are message-style commands; give those a small,
        // compatible message facade instead of passing a partially cloned
        // Interaction object with the wrong argument positions.
        if (NATIVE_SLASH_COMMANDS.has(command.data.name)) {
          await command.execute(interaction, client);
        } else {
          const { message, args } = createMessageLikeInteraction(interaction, command.data.name);
          await command.execute(message, args, client);
        }
      } catch (error) {
        console.error(`[SLASH COMMAND ERROR] ${command.data.name}:`, error);
        const reply = { content: 'There was an error executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
      return;
    }

    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('nitro_prank_')) {
      try {
        const file = new AttachmentBuilder(path.join(__dirname, '..', 'd05cde43af751fc4445a9f4456d74e93.jpg'));
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Here is your Nitro!')
          .setDescription(`${interaction.user} You really thought you were getting free Nitro? **LOL**`)
          .setImage('attachment://d05cde43af751fc4445a9f4456d74e93.jpg')
          .setFooter({ text: 'Gottem!' });
        await interaction.reply({ embeds: [embed], files: [file] }).catch(() => {});
      } catch (e) {
        console.error('[INTERACTION ERROR] nitro_prank:', e);
      }
    }

    if (interaction.customId === 'giveaway_enter') {
      try {
        const { giveaways } = require('../commands/moderation/giveaway');
        const giveaway = giveaways.get(interaction.message.id);

        if (!giveaway || giveaway.ended) {
          return interaction.reply({ content: 'This giveaway has ended.', ephemeral: true }).catch(() => {});
        }

        if (giveaway.entries.has(interaction.user.id)) {
          giveaway.entries.delete(interaction.user.id);
          return interaction.reply({ content: 'You left the giveaway.', ephemeral: true }).catch(() => {});
        }

        giveaway.entries.add(interaction.user.id);
        return interaction.reply({ content: `You entered the giveaway! (${giveaway.entries.size} entries)`, ephemeral: true }).catch(() => {});
      } catch (e) {
        console.error('[INTERACTION ERROR] giveaway_enter:', e);
      }
    }

    if (interaction.customId.startsWith('ticket_')) {
      try {
        const { handleTicket } = require('../commands/moderation/ticket');
        await handleTicket(interaction, client);
      } catch (e) {
        console.error('[INTERACTION ERROR] ticket:', e);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
        }
      }
    }
  },
};
