export const ATLAS_GOOGLE_LOGIN_SCOPES = ["openid", "email", "profile"] as const;

export const ATLAS_GOOGLE_WORKSPACE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/contacts.readonly",
] as const;

export const ATLAS_GOOGLE_READONLY_SCOPES = ATLAS_GOOGLE_WORKSPACE_SCOPES;

export const ATLAS_GOOGLE_LOGIN_SCOPE_STRING = ATLAS_GOOGLE_LOGIN_SCOPES.join(" ");
export const ATLAS_GOOGLE_READONLY_SCOPE_STRING = ATLAS_GOOGLE_WORKSPACE_SCOPES.join(" ");
