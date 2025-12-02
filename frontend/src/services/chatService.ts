export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatHistoryStorage {
  messages: ChatMessage[];
  lastUpdated: string;
}

export interface SendMessageResponse {
  response: string;
  function_calls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }>;
  metadata?: Record<string, unknown>;
}

class ChatService {
  private static readonly STORAGE_KEY_PREFIX = "transferhub_chat_history_";
  private static readonly MAX_MESSAGES = 50;

  /**
   * Get chat history from localStorage
   */
  static getChatHistory(userId: string): ChatMessage[] {
    try {
      const key = this.STORAGE_KEY_PREFIX + userId;
      const data = localStorage.getItem(key);

      if (!data) {
        return [];
      }

      const parsed: ChatHistoryStorage = JSON.parse(data);
      return parsed.messages || [];
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [];
    }
  }

  /**
   * Save chat history to localStorage
   */
  static saveChatHistory(userId: string, messages: ChatMessage[]): void {
    try {
      const key = this.STORAGE_KEY_PREFIX + userId;

      // Keep only the last MAX_MESSAGES
      const trimmed = messages.slice(-this.MAX_MESSAGES);

      const storage: ChatHistoryStorage = {
        messages: trimmed,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(key, JSON.stringify(storage));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }

  /**
   * Add a message to chat history
   */
  static addMessage(
    userId: string,
    role: "user" | "assistant",
    content: string
  ): ChatMessage {
    const message: ChatMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    const history = this.getChatHistory(userId);
    history.push(message);
    this.saveChatHistory(userId, history);

    return message;
  }

  /**
   * Send message to AI agent
   */
  static async sendMessage(message: string): Promise<SendMessageResponse> {
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem("transferhub_user_data");
      const user = userStr ? JSON.parse(userStr) : null;

      // Get auth token
      const token = localStorage.getItem("transferhub_auth_token");

      if (!user || !token) {
        throw new Error("User not authenticated");
      }

      // Get recent conversation history (last 10 messages for context)
      const history = this.getRecentMessages(user.id, 10);
      const conversationHistory = history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call FastAPI directly (bypass Laravel proxy for better performance)
      const response = await fetch("http://127.0.0.1:8001/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          user_token: `Bearer ${token}`,
          user_context: {
            user_id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            plan: "Free", // TODO: Get from user object when available
          },
          conversation_history: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error: unknown) {
      console.error("Error sending message:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to send message. Please try again.");
    }
  }

  /**
   * Clear chat history for a user
   */
  static clearChatHistory(userId: string): void {
    try {
      const key = this.STORAGE_KEY_PREFIX + userId;
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  }

  /**
   * Get the last N messages
   */
  static getRecentMessages(userId: string, count: number): ChatMessage[] {
    const history = this.getChatHistory(userId);
    return history.slice(-count);
  }

  /**
   * Format timestamp for display
   */
  static formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Check if chat history exists
   */
  static hasChatHistory(userId: string): boolean {
    const history = this.getChatHistory(userId);
    return history.length > 0;
  }
}

export default ChatService;
