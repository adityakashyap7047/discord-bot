const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notes')
    .setDescription('Manage your personal notes')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a new note')
        .addStringOption(opt => opt.setName('title').setDescription('Note title').setRequired(true))
        .addStringOption(opt => opt.setName('content').setDescription('Note content').setRequired(true)),
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all your notes'),
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a note by title')
        .addStringOption(opt => opt.setName('title').setDescription('Title of note to delete').setRequired(true)),
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View a specific note')
        .addStringOption(opt => opt.setName('title').setDescription('Title of note to view').setRequired(true)),
    ),
  cooldown: 3,
  async execute(message, args, client) {
    const db = client.db;
    const sub = args[0];

    if (!sub || !['add', 'list', 'delete', 'view'].includes(sub)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Subcommands: `add`, `list`, `delete`, `view`')] });
    }

    const notes = db.get('notes') || {};
    const userNotes = notes[message.author.id] || [];

    if (sub === 'add') {
      const title = args[1];
      const content = args.slice(2).join(' ');
      if (!title || !content) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Usage: `notes add MyTitle Some content here`')] });
      }

      if (userNotes.find(n => n.title.toLowerCase() === title.toLowerCase())) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription(`A note with title "**${title}**" already exists!`)] });
      }

      if (userNotes.length >= 25) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('You can have a maximum of 25 notes!')] });
      }

      userNotes.push({ title, content, createdAt: Date.now() });
      notes[message.author.id] = userNotes;
      db.set('notes', notes);

      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('📝 Note Added!')
        .addFields(
          { name: 'Title', value: title, inline: true },
          { name: 'Content', value: content.substring(0, 1024), inline: false },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } else if (sub === 'list') {
      if (userNotes.length === 0) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xf59e0b).setTitle('📝 Notes').setDescription('You have no notes yet! Use `notes add <title> <content>` to create one.')] });
      }

      const noteList = userNotes.map((n, i) => `**${i + 1}.** ${n.title} — ${n.content.substring(0, 50)}${n.content.length > 50 ? '...' : ''}`).join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(`📝 Your Notes (${userNotes.length}/25)`)
        .setDescription(noteList)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } else if (sub === 'delete') {
      const title = args[1];
      if (!title) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Usage: `notes delete <title>`')] });
      }

      const idx = userNotes.findIndex(n => n.title.toLowerCase() === title.toLowerCase());
      if (idx === -1) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription(`No note found with title "**${title}**".`)] });
      }

      userNotes.splice(idx, 1);
      notes[message.author.id] = userNotes;
      db.set('notes', notes);

      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('🗑️ Note Deleted!')
        .setDescription(`Deleted note "**${title}**".`)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } else if (sub === 'view') {
      const title = args[1];
      if (!title) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription('Usage: `notes view <title>`')] });
      }

      const note = userNotes.find(n => n.title.toLowerCase() === title.toLowerCase());
      if (!note) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('❌ Error').setDescription(`No note found with title "**${title}**".`)] });
      }

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(`📝 ${note.title}`)
        .setDescription(note.content)
        .setFooter({ text: `Created` })
        .setTimestamp(note.createdAt);

      message.reply({ embeds: [embed] });
    }
  },
};
