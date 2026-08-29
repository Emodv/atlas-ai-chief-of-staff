import { NextResponse } from "next/server";
import { decideOAuthAuthorization } from "../../../../lib/atlas-oauth-server";

export async function POST(request: Request) {
  const form = await request.formData();
  const authorizationId = String(form.get("authorization_id") ?? "");
  const decision = String(form.get("decision") ?? "");
  if (!authorizationId || !["approve", "deny"].includes(decision)) {
    return NextResponse.json({ error: "invalid-authorization-decision" }, { status: 400 });
  }

  const result = await decideOAuthAuthorization(authorizationId, decision as "approve" | "deny");
  if (!result.ok) {
    if (result.status === 401) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", `/oauth/consent?authorization_id=${authorizationId}`);
      return NextResponse.redirect(login, 303);
    }
    return NextResponse.json({ error: result.error ?? "oauth-decision-failed" }, { status: result.status || 400 });
  }

  const redirectUrl = result.data?.redirect_url;
  if (!redirectUrl) return NextResponse.json({ error: "oauth-redirect-missing" }, { status: 500 });
  return NextResponse.redirect(redirectUrl, 303);
}
