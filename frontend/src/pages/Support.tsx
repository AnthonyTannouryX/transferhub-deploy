import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Trash2,
  Loader2,
  Wallet,
  CreditCard,
  TrendingUp,
  Users,
  SendHorizontal,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import ChatService, { ChatMessage } from "@/services/chatService";
import { toast } from "@/hooks/use-toast";

export default function Support() {
  const { user } = useAuth();

  // Determine navigation role based on user type
  const getNavigationRole = (): "user" | "agent" | "admin" => {
    if (!user) return "user";
    if (user.user_type === "admin") return "admin";
    if (user.user_type === "agent") return "agent";
    return "user";
  };

  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    if (user?.id) {
      const history = ChatService.getChatHistory(user.id);
      setChatHistory(history);
    }
  }, [user?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || chatMessage.trim();
    if (!textToSend || !user?.id || isSending) return;

    setChatMessage("");
    setIsSending(true);

    try {
      // Add user message to history
      const userMsg = ChatService.addMessage(user.id, "user", textToSend);
      setChatHistory((prev) => [...prev, userMsg]);

      // Show typing indicator
      setIsTyping(true);

      // Send message to AI agent
      const response = await ChatService.sendMessage(textToSend);

      // Hide typing indicator
      setIsTyping(false);

      // Add assistant response to history
      const assistantMsg = ChatService.addMessage(
        user.id,
        "assistant",
        response.response
      );
      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (error) {
      setIsTyping(false);
      console.error("Error sending message:", error);

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again.",
        variant: "destructive",
      });

      // Add error message to chat
      const errorMsg = ChatService.addMessage(
        user.id,
        "assistant",
        "I apologize, but I'm having trouble connecting right now. Please try again in a moment."
      );
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    if (user?.id) {
      ChatService.clearChatHistory(user.id);
      setChatHistory([]);
      toast({
        title: "Chat cleared",
        description: "Your chat history has been cleared.",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick action buttons
  const quickActions = [
    {
      icon: Wallet,
      label: "Check Balance",
      message: "What's my current wallet balance?",
      color: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600",
    },
    {
      icon: SendHorizontal,
      label: "Send Money",
      message: "I want to send money to someone",
      color: "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600",
    },
    {
      icon: Users,
      label: "My Beneficiaries",
      message: "Show me my beneficiaries",
      color: "bg-pink-500/10 hover:bg-pink-500/20 text-pink-600",
    },
    {
      icon: TrendingUp,
      label: "Transfer History",
      message: "Show me my recent transfers",
      color: "bg-green-500/10 hover:bg-green-500/20 text-green-600",
    },
    {
      icon: CreditCard,
      label: "Subscription Plans",
      message: "Tell me about the subscription plans",
      color: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation role={getNavigationRole()} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary" />
              AI Support Assistant
            </h1>
            <p className="text-muted-foreground">
              Get instant help with your wallet, transfers, and subscriptions
            </p>
          </div>
          {chatHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-auto py-3 ${action.color}`}
                    onClick={() => handleSendMessage(action.message)}
                    disabled={isSending}
                  >
                    <action.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium text-left">
                      {action.label}
                    </span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  What I Can Help With
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Check your USD wallet balance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Top up your wallet via Stripe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Send money to beneficiaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Manage your beneficiaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>View transfer history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Calculate transfer fees & rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Compare subscription plans</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* User Info Card */}
            {user && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Your Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plan:</span>
                    <p className="font-medium">Free</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium text-xs break-all">
                      {user.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-2 border-border/50 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">TransferHub AI</h3>
                      <p className="text-xs text-muted-foreground font-normal">
                        Online 
                      </p>
                    </div>
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col h-[650px]">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-muted/20 to-background">
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                          <Bot className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-3 max-w-md">
                          <h3 className="text-xl font-bold">
                            Welcome to AI Support! 👋
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            I'm your intelligent assistant powered by GPT-4. I can help you with:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-left">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              <Wallet className="w-4 h-4 text-blue-600" />
                              <span>Check Balance</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              <SendHorizontal className="w-4 h-4 text-indigo-600" />
                              <span>Send Money</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              <Users className="w-4 h-4 text-pink-600" />
                              <span>Beneficiaries</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span>History</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              <CreditCard className="w-4 h-4 text-purple-600" />
                              <span>Plans</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground pt-2">
                            Use the quick actions on the left or type your question below.
                          </p>
                        </div>
                      </div>
                    ) : (
                      chatHistory.map((msg, index) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                          } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                              msg.role === "user"
                                ? "bg-primary/10 text-primary"
                                : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <UserIcon className="w-5 h-5" />
                            ) : (
                              <Bot className="w-5 h-5" />
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`flex flex-col max-w-[75%] ${
                              msg.role === "user" ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : "bg-card border border-border/50 rounded-tl-sm"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1.5 px-2">
                              {ChatService.formatTime(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    {isTyping && (
                      <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                              style={{ animationDelay: "0.15s" }}
                            />
                            <div
                              className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                              style={{ animationDelay: "0.3s" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t bg-background p-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Ask me anything about your account, transfers, or plans..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSending}
                        className="flex-1 h-12 px-4 rounded-full border-2 focus-visible:ring-primary/20"
                      />
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={!chatMessage.trim() || isSending}
                        className="h-12 w-12 rounded-full p-0 shadow-lg hover:shadow-xl transition-all"
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-3 px-2">
                      <p className="text-xs text-muted-foreground">
                        💡 AI responses are typically instant
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chatHistory.length > 0 && `${chatHistory.length} messages`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
