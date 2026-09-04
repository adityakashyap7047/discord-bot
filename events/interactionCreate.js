const { Events, Collection, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

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

      const args = (interaction.options.data || []).map(opt => {
        if (opt.user) return `<@${opt.user.id}>`;
        if (opt.channel) return `<#${opt.channel.id}>`;
        if (opt.role) return `<@&${opt.role.id}>`;
        if (opt.value !== undefined) return String(opt.value);
        return '';
      }).filter(Boolean);

      const source = Object.create(interaction);
      source.author = interaction.user;
      source.mentions = {
        users: {
          first: () => interaction.options.getUser('user') || interaction.options.data.find(o => o.type === 6)?.user || null,
        },
      };

      try {
        await command.execute(source, args, client);
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
