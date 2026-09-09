export const ATLAS_GOOGLE_LOGIN_SCOPES = ["openid", "email", "profile"] as const;

// Progressive authorization: onboarding asks only for the Google data Atlas
// actually uses to deliver the first scan. Contacts/Drive/Docs/Sheets should
// be requested later, at the moment a feature needs them, rather than adding
// unnecessary consent friction and privacy surface to first activation.
export const ATLAS_GOOGLE_WORKSPACE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

export const ATLAS_GOOGLE_READONLY_SCOPES = ATLAS_GOOGLE_WORKSPACE_SCOPES;

export const ATLAS_GOOGLE_LOGIN_SCOPE_STRING = ATLAS_GOOGLE_LOGIN_SCOPES.join(" ");
export const ATLAS_GOOGLE_READONLY_SCOPE_STRING = ATLAS_GOOGLE_WORKSPACE_SCOPES.join(" ");
