# Atlas Economic Operating System

Atlas is designed to optimize economic value per unit of human attention, not activity volume.

## Core loop

Observe → Understand → Score → Claim → Execute → Verify → Learn

## Economic graph

Atlas models connected data as a graph of:

- Person
- Company
- Asset
- Income Stream
- Opportunity
- Action
- Outcome
- Relationship

Typical edges include `works_at`, `owns`, `enables`, `influences`, `creates`, `triggers`, `produces`, and `realizes`.

## Two independent ranking systems

### Priority score

The existing 0–100 opportunity score remains useful for urgency and operating priority:

- value: 25%
- probability: 20%
- speed: 15%
- urgency: 15%
- leverage: 15%
- effort efficiency: 10%

### Economic value

Economic decisions also use explicit money metrics:

`Expected Economic Value = Estimated Value × Close Probability`

`Attention Efficiency = Expected Economic Value ÷ Human Hours`

This prevents a high-urgency but low-value task from outranking a materially better opportunity without visibility.

## Outcome attribution

Every meaningful opportunity should converge on verified outcome events such as:

- revenue
- commission
- compensation
- cost savings
- asset value creation
- costs

The target closed loop is:

Signal → Opportunity → Action → Reply/Meeting/Proposal → Won/Lost → Invoice/Outcome → Realized Value → Learning

## Continuous worker

`services/worker` owns orchestration. Provider-specific connectors remain separate.

The worker must:

1. Observe only new/changed data from checkpoints.
2. Persist source observations.
3. Generate and economically rank candidate opportunities.
4. Claim opportunities idempotently so two agents do not execute the same work.
5. Respect Atlas trust/autonomy gates.
6. Verify external effects before marking work handled.
7. Record realized outcomes and feed them back into future scoring.

## Contact intelligence

The large Drive contact dataset is treated as an identity asset, not a mass-mail list.

The Atlas-native contact layer separates:

- contacts
- company/domain enrichment
- segments
- segment membership
- buying signals
- suppression state
- economic scoring

Initial high-priority segments include temporary marketing coverage, Canadian SMB founders/CEOs, AI/search visibility gaps, business funding candidates, and nonprofit Ad Grant candidates.

## Safety

No confidence score overrides blocked consequential categories. Money movement, trades, purchases, contracts, legal/medical/security actions, destructive changes, material pricing commitments, guarantees, refunds, or employment acceptance require explicit human authority.
