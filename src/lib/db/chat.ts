import { getSupabase } from "@/lib/supabase";

export interface DbChatMessage {
  id: string;
  audit_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatCredits {
  messages_used: number;
  messages_limit: number;
}

/**
 * Get or create chat credits for the current month.
 */
export async function getChatCredits(
  userId: string,
  monthlyLimit: number
): Promise<ChatCredits> {
  const sb = getSupabase();
  if (!sb) return { messages_used: 0, messages_limit: monthlyLimit };

  const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // Upsert to avoid race condition when two concurrent requests try to create
  // the first record for a new month. ignoreDuplicates prevents overwriting.
  const { data, error } = await sb
    .from("chat_credits")
    .upsert(
      {
        user_id: userId,
        month,
        messages_used: 0,
        messages_limit: monthlyLimit,
      },
      { onConflict: "user_id, month", ignoreDuplicates: true }
    )
    .select("messages_used, messages_limit")
    .single();

  if (error || !data) {
    // If upsert returned nothing (row already existed), fetch the existing row
    const { data: existing } = await sb
      .from("chat_credits")
      .select("messages_used, messages_limit")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    if (existing) {
      return {
        messages_used: existing.messages_used,
        messages_limit: existing.messages_limit,
      };
    }
    console.error("getChatCredits error:", error);
    return { messages_used: 0, messages_limit: monthlyLimit };
  }

  return {
    messages_used: data.messages_used,
    messages_limit: data.messages_limit,
  };
}

/**
 * Increment the chat message count for the current month.
 */
export async function incrementChatCredits(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const month = new Date().toISOString().slice(0, 7);

  const { error } = await sb.rpc("increment_chat_credits", {
    p_user_id: userId,
    p_month: month,
  });

  if (error) {
    // Fallback: manual increment
    const { data } = await sb
      .from("chat_credits")
      .select("messages_used")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    if (data) {
      await sb
        .from("chat_credits")
        .update({ messages_used: data.messages_used + 1 })
        .eq("user_id", userId)
        .eq("month", month);
    }
  }
}

/**
 * Get chat history for an audit.
 */
export async function getChatHistory(
  auditId: string,
  userId: string
): Promise<DbChatMessage[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("chat_messages")
    .select("*")
    .eq("audit_id", auditId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getChatHistory error:", error);
    return [];
  }

  return (data || []) as DbChatMessage[];
}

/**
 * Save a chat message.
 */
export async function saveChatMessage(params: {
  auditId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb.from("chat_messages").insert({
    audit_id: params.auditId,
    user_id: params.userId,
    role: params.role,
    content: params.content,
  });

  if (error) {
    console.error("saveChatMessage error:", error);
  }
}
