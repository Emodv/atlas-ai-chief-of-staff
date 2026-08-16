# ChatGPT-native Atlas

## Principle

**ChatGPT is the brain and primary interface. Atlas is the personal context + trust + execution layer.**

Atlas should not force users into another chat product. The target experience is that the user talks to ChatGPT, while Atlas quietly supplies the personalized context and safe tool actions underneath.

## What Atlas adds to ChatGPT

- durable personal memory across connected sources,
- a Digital Twin of tone, language, decisions, and operating habits,
- a contact-specific Relationship Graph,
- open-loop and commitment tracking,
- evidence/freshness awareness,
- permission-aware actions,
- correction learning,
- Green / Yellow / Red trust gating,
- minimal chief-of-staff reporting.

## Activation experience

Desired UX inside ChatGPT:

```text
Enable Atlas

Gmail          ✅ Connected
Calendar       ✅ Connected
Contacts       ✅ Connected
Drive          ⚠️ Read-only — fix access
Notion         ✅ Connected
HubSpot        ❌ Not connected

Learning mode  ● Running
```

Atlas then reports only meaningful progress:

```text
Learning complete ✅
Twin             ✅
Relationships    ✅
Open loops       ✅
Shadow mode      ✅
```

Detailed diagnostics are available only on request.

## Technical delivery

The GitHub repository is the implementation source. A production ChatGPT-native Atlas should expose an authenticated server/tool surface that ChatGPT can invoke. The preferred direction is a remote MCP / ChatGPT app integration because the protocol cleanly separates ChatGPT reasoning from Atlas-owned context and actions.

Atlas tools should be narrow and auditable:

- `atlas.connection_health`
- `atlas.learn_user`
- `atlas.get_context`
- `atlas.get_relationship`
- `atlas.get_open_loops`
- `atlas.propose_action`
- `atlas.execute_safe_action`
- `atlas.record_correction`
- `atlas.status`

The server owns OAuth tokens and connector permissions. Secret values never enter normal conversation text.

## ChatGPT conversation history

Treat ChatGPT-native memory/history as an optional input only where platform permissions and APIs explicitly make it available. Atlas must not assume it can crawl arbitrary past ChatGPT conversations merely because a user pasted the repository URL.

Gmail, Calendar, Contacts, Drive, Notion, HubSpot, and other explicit connectors remain the dependable training corpus.

## Language behavior

Language is relationship/context specific, not a global setting.

Examples:

- Persian-speaking relationship + Persian thread → reply naturally in Persian.
- English business thread → reply in English.
- bilingual relationship with historical code-switching → follow the established pattern.

Digital Twin inference should use both user-level and contact-level evidence.

## Default interaction contract

Atlas is a chief of staff, not a narrator.

**Default:**

```text
Email        ✅ Done
Calendar     ✅ Done
Follow-ups   ✅ 3 handled
Client X     ⚠️ Review
Contract Y   🔴 Needs you
```

**On demand:** the user can ask `why`, `show details`, or open an info control.

## Trust buckets

- 🟢 Handled — safe to execute.
- 🟡 Review — prepared/recommended, user should look.
- 🔴 Needs you — stop and escalate.

Internal confidence may be numeric for evaluation. User-facing trust is categorical and understandable.
