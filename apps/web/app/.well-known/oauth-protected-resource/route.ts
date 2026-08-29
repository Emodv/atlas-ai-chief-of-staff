import { NextResponse } from "next/server";

const authServer = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
  : "https://lvkrvqpoajzpcqnlvqaj.supabase.co/auth/v1";

const metadata = {
  resource: "https://atlas.moda/api/chatgpt/mcp",
  authorization_servers: [authServer],
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, mcp-protocol-version",
  "cache-control": "public, max-age=3600",
};

export async function GET() {
  return NextResponse.json(metadata, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
