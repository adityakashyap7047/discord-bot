const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Nuke a channel (clone and delete to purge all messages)')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to nuke').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 30,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('ManageChannels')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Channels permission.')] });
      }

      let channel;
      if (message.isChatInputCommand) {
        channel = message.options.getChannel('channel');
      } else {
        if (!args[0]) return message.reply({ embeds: [errorEmbed('Error', 'Mention a channel to nuke.\nUsage: `nuke #channel`')] });
        const channelId = args[0].replace(/<#|>/g, '');
        channel = message.guild.channels.cache.get(channelId);
        if (!channel) return message.reply({ embeds: [errorEmbed('Error', 'Channel not found.')] });
      }

      if (channel.type !== 0) {
        return message.reply({ embeds: [errorEmbed('Error', 'Can only nuke text channels.')] });
      }

      if (!channel.manageable) {
        return message.reply({ embeds: [errorEmbed('Error', 'Cannot nuke this channel (insufficient permissions).')] });
      }

      const confirmEmbed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle('☢️ NUKE CONFIRMATION')
        .setDescription(`Are you sure you want to nuke ${channel}?\n\n**This will:**\n- Delete ALL messages in the channel\n- Clone the channel with the same name and permissions\n- This action is **irreversible**!`)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`nuke_confirm_${channel.id}`)
          .setLabel('NUKE')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('☢️'),
        new ButtonBuilder()
          .setCustomId('nuke_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary),
      );

      const msg = await message.reply({ embeds: [confirmEmbed], components: [row] });

      const collector = msg.createMessageComponentCollector({ time: 15000 });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: 'Only the command author can confirm.', ephemeral: true });
        }

        if (interaction.customId === 'nuke_cancel') {
          collector.stop('cancelled');
          return interaction.update({ content: 'Nuke cancelled.', embeds: [], components: [] });
        }

        if (interaction.customId.startsWith('nuke_confirm_')) {
          collector.stop('confirmed');
          await interaction.update({ content: '☢️ Nuking channel...', embeds: [], components: [] });

          try {
            const cloned = await channel.clone({
              name: channel.name,
              reason: `Nuked by ${message.author.tag}`,
            });

            await channel.delete(`Nuked by ${message.author.tag}`);

            const nukeEmbed = new EmbedBuilder()
              .setColor(0xFF4500)
              .setTitle('☢️ Channel Nuked!')
              .setDescription(`Channel has been nuked by ${message.author}.`)
              .setImage('https://media.giphy.com/media/nXxOjZrbnbRxS/giphy.gif')
              .setTimestamp();

            cloned.send({ embeds: [nukeEmbed] }).catch(() => {});
          } catch (e) {
            console.error('[NUKE ERROR]', e);
            interaction.followUp({ content: 'Failed to nuke the channel: ' + e.message }).catch(() => {});
          }
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'confirmed' || reason === 'cancelled') return;
        msg.edit({ content: 'Nuke timed out. Cancelled.', embeds: [], components: [] }).catch(() => {});
      });
    } catch (e) {
      console.error('[NUKE ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed to nuke channel.')] }).catch(() => {});
    }
  },
};
