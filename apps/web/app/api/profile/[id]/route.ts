import { NextResponse } from "next/server";

const getServerBaseUrl = () => {
  const raw = process.env.SPOONOS_SERVER_API ?? "http://localhost:8000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `http://${raw}`;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  const baseUrl = getServerBaseUrl();
  const response = await fetch(`${baseUrl}/v1/profiles/${context.params.id}`);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Profile fetch failed" },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
