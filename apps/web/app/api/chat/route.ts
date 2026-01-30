import { NextResponse } from "next/server";

const getServerBaseUrl = () => {
  const raw = process.env.SPOONOS_SERVER_API ?? "http://localhost:8000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `http://${raw}`;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const baseUrl = getServerBaseUrl();
  const body = await request.json();

  const response = await fetch(`${baseUrl}/v1/agent/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stream_mode: "sse",
      ...body,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: text || "Chat request failed" },
      { status: response.status },
    );
  }

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
