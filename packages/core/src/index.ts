export type AtlasAutonomyStage = "surface" | "recommend" | "draft" | "execute";

export type ConnectorName =
  | "gmail"
  | "calendar"
  | "contacts"
  | "drive"
  | "notion"
  | "hubspot";

export interface NormalizedEvent {
  id: string;
  userId: string;
  connector: ConnectorName;
  sourceId: string;
  kind: string;
  occurredAt: string;
  actorIds: string[];
  subject?: string;
  text?: string;
  metadata: Record<string, unknown>;
}

export interface AtlasIdentity {
  id: string;
  displayName: string;
  emails: string[];
  phones: string[];
  companies: string[];
  aliases: string[];
}

export interface RelationshipProfile {
  identityId: string;
  relationshipType: string;
  warmth: number;
  formality: number;
  languages: string[];
  cadenceDays?: number;
  lastMeaningfulContact?: string;
  openLoops: string[];
  humanTouchPreferred: boolean;
}

export interface ActionProposal {
  id: string;
  userId: string;
  taskType: string;
  targetId?: string;
  summary: string;
  confidence: number;
  reversible: boolean;
  consequence: "low" | "medium" | "high";
  requestedStage: AtlasAutonomyStage;
  evidenceEventIds: string[];
}

export interface ConnectorAdapter {
  name: ConnectorName;
  authorizeUrl(state: string): Promise<string>;
  sync(cursor?: string): Promise<{ events: NormalizedEvent[]; nextCursor?: string }>;
  read(resourceId: string): Promise<unknown>;
  act?(action: ActionProposal): Promise<{ success: boolean; externalId?: string }>;
}
