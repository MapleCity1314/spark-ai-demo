import { Suspense } from "react";
import { ChatShell } from "@/components/chat/chat-shell";

const ChatRsc = async () => <ChatShell />;

const Loading = () => (
  <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">
    Loading chat...
  </div>
);

export default function ChatPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatRsc />
    </Suspense>
  );
}
