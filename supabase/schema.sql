-- ============================================
-- VARUNASTRA BOT - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- User profiles (cross-server identity)
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  bio TEXT DEFAULT '',
  banner TEXT DEFAULT '',
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Economy (per-guild, per-user)
CREATE TABLE IF NOT EXISTS economy (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  wallet BIGINT DEFAULT 0,
  bank BIGINT DEFAULT 0,
  last_daily BIGINT DEFAULT 0,
  last_work BIGINT DEFAULT 0,
  last_rob BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);

-- Inventory (per-guild, per-user)
CREATE TABLE IF NOT EXISTS inventories (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  items JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);

-- Marriages
CREATE TABLE IF NOT EXISTS marriages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user1 TEXT NOT NULL,
  user2 TEXT NOT NULL,
  married_at TIMESTAMPTZ DEFAULT now()
);

-- Reputation
CREATE TABLE IF NOT EXISTS reputation (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, from_user_id)
);

-- Notes (per-user)
CREATE TABLE IF NOT EXISTS notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Level system (per-guild, per-user)
CREATE TABLE IF NOT EXISTS levels (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  xp INT DEFAULT 0,
  level INT DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);

-- Warnings
CREATE TABLE IF NOT EXISTS warnings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS mod_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL,
  type TEXT NOT NULL,
  moderator_id TEXT,
  target_id TEXT,
  reason TEXT DEFAULT '',
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom commands (per-guild)
CREATE TABLE IF NOT EXISTS custom_commands (
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  response TEXT DEFAULT '',
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (guild_id, name)
);

-- Reaction roles
CREATE TABLE IF NOT EXISTS reaction_roles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  role_id TEXT NOT NULL
);

-- Starboard
CREATE TABLE IF NOT EXISTS starboard (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  starboard_message_id TEXT,
  stars INT DEFAULT 0
);

-- Embeds (per-guild)
CREATE TABLE IF NOT EXISTS embeds (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  embed_data JSONB DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (guild_id, name)
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  reminder TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL
);

-- Invites tracking
CREATE TABLE IF NOT EXISTS invites (
  guild_id TEXT NOT NULL,
  code TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  uses INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (guild_id, code)
);

-- Tempbans
CREATE TABLE IF NOT EXISTS tempbans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  reason TEXT DEFAULT ''
);

-- ============================================
-- INDEXES for fast queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_economy_guild ON economy(guild_id);
CREATE INDEX IF NOT EXISTS idx_economy_user ON economy(user_id);
CREATE INDEX IF NOT EXISTS idx_levels_guild ON levels(guild_id);
CREATE INDEX IF NOT EXISTS idx_warnings_guild ON warnings(guild_id);
CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_guild ON mod_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_rep_user ON reputation(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_tempbans_guild ON tempbans(guild_id);
