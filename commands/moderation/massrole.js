const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massrole')
    .setDescription('Add or remove a role from all members')
    .addRoleOption(opt => opt.setName('role').setDescription('Role to add/remove').setRequired(true))
    .addStringOption(opt => opt.setName('action').setDescription('Action').setRequired(true)
      .addChoices({ name: 'Add Role', value: 'add' }, { name: 'Remove Role', value: 'remove' }))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  cooldown: 30,
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('ManageRoles')) {
        return message.reply({ embeds: [errorEmbed('No Permission', 'You need Manage Roles permission.')] });
      }
      const isSlash = message.isChatInputCommand;
      const role = isSlash ? message.options.getRole('role') : message.mentions.roles.first();
      const action = isSlash ? message.options.getString('action') : (args[1] || 'add');
      if (!role) return message.reply({ embeds: [errorEmbed('Error', 'Mention a role.')] });
      if (role.position >= message.guild.members.me.roles.highest.position) {
        return message.reply({ embeds: [errorEmbed('Error', 'Cannot modify a role higher than my highest role.')] });
      }

      await message.reply({ embeds: [infoEmbed('Processing', `Starting mass ${action === 'add' ? 'adding' : 'removing'} role ${role}. This may take a while...`)] });

      const members = await message.guild.members.fetch();
      let success = 0, failed = 0;

      for (const [, member] of members) {
        if (member.user.bot) continue;
        try {
          if (action === 'add' && !member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            success++;
          } else if (action === 'remove' && member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            success++;
          }
        } catch (e) { failed++; }
      }

      message.edit({ embeds: [successEmbed('Mass Role Complete', `**${success}** members ${action === 'add' ? 'received' : 'had'} the ${role} role.\n${failed ? `**${failed}** failed.` : ''}`)] });
    } catch (e) {
      console.error('[MASSROLE ERROR]', e);
      message.reply({ embeds: [errorEmbed('Error', e.message || 'Failed.')] }).catch(() => {});
    }
  },
};

function infoEmbed(title, desc) {
  return new (require('discord.js').EmbedBuilder)().setColor(0x3b82f6).setTitle(title).setDescription(desc);
}
