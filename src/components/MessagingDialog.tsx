import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  read: boolean;
}

interface MessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  otherPartyName: string;
}

export const MessagingDialog = ({ open, onOpenChange, bookingId, otherPartyName }: MessagingDialogProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && bookingId) {
      fetchMessages();
    }
  }, [open, bookingId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/api/bookings/${bookingId}/messages`);
      setMessages(data || []);
    } catch (error) {
      toast.error("Failed to load messages");
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/api/bookings/${bookingId}/messages`, {
        message_text: newMessage.trim(),
      });
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with {otherPartyName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
          <div className="space-y-3 p-2">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((message) => {
                const isMe = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p>{message.message_text}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {format(new Date(message.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            className="resize-none h-10 min-h-0 py-2"
            rows={1}
          />
          <Button size="sm" onClick={handleSend} disabled={isSubmitting || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};