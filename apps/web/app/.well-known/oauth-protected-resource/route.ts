import { metadataCorsOptionsRequestHandler, protectedResourceHandler } from "mcp-handler";

const authServer = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
  : "https://lvkrvqpoajzpcqnlvqaj.supabase.co/auth/v1";

const handler = protectedResourceHandler({ authServerUrls: [authServer] });
const options = metadataCorsOptionsRequestHandler();

export { handler as GET, options as OPTIONS };
