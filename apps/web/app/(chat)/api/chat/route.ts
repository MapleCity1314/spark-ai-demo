
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (_request: NextRequest): Promise<Response> => {
  void _request;
  return new Response(null, { status: 204 });
};
