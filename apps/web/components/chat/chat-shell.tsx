"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { Chat } from "./chat";

interface ChatShellProps {
  initialMessages?: UIMessage[];
  initialMessage?: UIMessage;
}

export function ChatShell({
  initialMessages,
  initialMessage,
}: ChatShellProps) {
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  return (
    <Chat
      initialMessage={initialMessage}
      initialMessages={initialMessages}
      onWebSearchToggle={() => setWebSearchEnabled((prev) => !prev)}
      webSearchEnabled={webSearchEnabled}
    />
  );
}
