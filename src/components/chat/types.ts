import type { User } from '@supabase/supabase-js';

export type EntityId = string | number;

export type AppUser = User;

export type UserRole = 'creator' | 'mod' | 'member';

export type Channel = {
  id: EntityId;
  name: string;
  description: string | null;
  created_by?: string;
};

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  status?: string;
  email?: string;
};

export type MessageReaction = {
  emoji: string;
  count: number;
  user_reacted: boolean;
};

export type Message = {
  id: EntityId;
  channel_id: EntityId;
  user_id: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  profiles?: Profile | null;
  reactions?: MessageReaction[];
};

export type PresenceUser = {
  id: string;
  username: string;
  online_at?: string;
  role?: UserRole;
  is_muted?: boolean;
};

export type TypingUser = {
  id: string;
  username: string;
};

export type ChannelMember = {
  channel_id: EntityId;
  user_id: string;
  role: UserRole;
  is_muted: boolean;
  muted_until: string | null;
};

export type Friend = {
  id: string;
  profile: Profile;
  status: 'online' | 'offline' | 'idle';
};

export type AppNotification = {
  id: string;
  type: 'message' | 'friend_request' | 'mention' | 'system';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  channel_id?: EntityId;
};
