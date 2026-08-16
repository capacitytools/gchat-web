export type ChatRow = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
};

export type MessageProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

export type MessageRow = {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles?: MessageProfile | null;
};