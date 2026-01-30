"use server";

import { NextResponse } from "next/server";

const getServerBaseUrl = () => {
  const raw = process.env.SPOONOS_SERVER_API ?? "http://localhost:8000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `http://${raw}`;
};

export async function POST(request: Request) {
  const baseUrl = getServerBaseUrl();
  const body = await request.json();
  const response = await fetch(`${baseUrl}/v1/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Profile create failed" },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
