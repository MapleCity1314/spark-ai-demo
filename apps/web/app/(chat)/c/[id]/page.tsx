import { Suspense } from "react";
import type { UIMessage } from "ai";
import { headers } from "next/headers";
import { ChatShell } from "@/components/chat/chat-shell";

export const dynamic = "force-dynamic";

const Loading = () => (
  <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">
    Loading chat...
  </div>
);

const getBaseUrl = () => {
  const envBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  const requestHeaders = headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  return host ? `${protocol}://${host}` : "http://localhost:3000";
};

const getChatById = async (id: string): Promise<UIMessage[]> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/chat/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as
      | { messages?: UIMessage[] }
      | UIMessage[];

    if (Array.isArray(data)) {
      return data;
    }

    return data.messages ?? [];
  } catch {
    return [];
  }
};

const ChatRsc = async ({ id }: { id: string }) => {
  const initialMessages = await getChatById(id);
  return <ChatShell initialMessages={initialMessages} />;
};

export default function ChatDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={<Loading />}>
      <ChatRsc id={params.id} />
    </Suspense>
  );
}
