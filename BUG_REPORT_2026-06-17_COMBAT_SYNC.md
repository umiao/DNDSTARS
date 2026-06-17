# Combat / Sync Bug Report - 2026-06-17

Commit baseline: `1c369a4 Stabilize dice and combat UI state`

Build status: `npm run build` passes.

## P0 - Combat State Is Multi-Writer

Evidence:
- `src/pages/MapsPage.tsx:770` `publishCombatState()` has no DM-only guard.
- `src/pages/MapsPage.tsx:1116` publishes combat state from any client when local combat state changes.
- `src/pages/MapsPage.tsx:917` every client polls shared combat state every second.

Impact:
- DM and player can both write `combat`.
- A player-side stale `round / initiativeIndex / enemyApByToken` can overwrite DM state.
- This explains turn skips, stuck rounds, and AP reverting after a client refresh.

Fix direction:
- Make DM the only writer of `combat`.
- Player actions should be requests to DM, not local `advanceInitiative()` calls.
- Add monotonic `seq` or `snapshotId` and discard older snapshots.

## P0 - Player Can Locally Advance Turn

Evidence:
- `src/pages/MapsPage.tsx:4692` `handlePlayerEndTurn()` directly calls `advanceInitiative()` when it is the player's turn.
- `src/pages/MapsPage.tsx:4702` clears local UI and advances initiative locally.
- There is no current `pendingPlayerAction` / `combat-action-player-to-dm` request path in `MapsPage.tsx`.

Impact:
- Player port can move initiative forward before DM confirms.
- DM and player can briefly disagree on whose turn it is.
- If both sides publish state, the later write wins.

Fix direction:
- Reintroduce player action request flow:
  1. Player sends `end-turn` request.
  2. DM validates current turn and advances.
  3. DM broadcasts authoritative snapshot.
  4. Player ACKs snapshot and unlocks UI.

## P0 - Characters / Maps Are Multi-Writer During Combat

Evidence:
- `src/lib/sharedApi.ts:44` allows player port writes to `characters`, `maps`, `dodge`, `dice`, `dice-events`, and `combat-log`.
- `src/store/characters.ts:648` saves characters after local updates; on player port it merges then saves.
- `src/store/maps.ts:60` saves maps after local token updates; on player port it merges then saves.
- `src/App.tsx:21` polls maps and characters every 2 seconds.

Impact:
- HP/AP/token changes can be computed locally on player, then written back over DM state.
- DM damage can be reverted by a later player-side save.
- This matches symptoms like "player side not losing HP" and "DM sees player-side wrong HP".

Fix direction:
- During combat, DM should be the only writer for HP/AP/token combat fields.
- Player-side character creation/import should use a separate non-combat request path.
- Use authoritative snapshots for combat state and version every snapshot.

## P0 - Shared Dodge Has No Timeout / Expiry

Evidence:
- `src/pages/MapsPage.tsx:4252` stores `pendingSharedDodgeRef` with no timeout.
- `src/pages/MapsPage.tsx:1178` DM waits for `state.status === 'answered'`.
- `src/pages/MapsPage.tsx:1208` player prompt has no `expiresAt` countdown.

Impact:
- If the player does not answer, disconnects, or the shared write is missed, enemy turn never completes.
- Old dodge state can leave the player prompt or DM pending state stuck.

Fix direction:
- Add `expiresAt` to `SharedDodgeState`.
- DM owns a 15s timeout; on timeout mark `done`, treat as no dodge, continue damage.
- UI countdown should read the same `expiresAt`.

## P1 - Dodge AP Is Spent On Player Side

Evidence:
- `src/pages/MapsPage.tsx:4303` `handleSharedDodgeChoice()` calls `spendAP()` locally on the player client.
- `src/pages/MapsPage.tsx:4358` then writes `dodgeApSpent` to shared state.
- `src/pages/MapsPage.tsx:1184` DM trusts `dodgeApSpent` and passes it into `finishEnemyAttack()`.

Impact:
- AP authority is split: player spends AP, DM computes damage.
- If character sync races, player AP can be lost, restored, or double-reconciled incorrectly.

Fix direction:
- Player should only answer and roll.
- DM should validate AP, spend AP, resolve dodge, and publish the final character snapshot.

## P1 - Dice Has Three Parallel Sync Paths

Evidence:
- `src/pages/MapsPage.tsx:700` and `src/pages/MapsPage.tsx:733` still publish old `dice-stream` start events.
- `src/pages/MapsPage.tsx:711` and `src/pages/MapsPage.tsx:744` publish the newer `dice-roll-request` result-broadcast events.
- `src/pages/MapsPage.tsx:750` also writes result overlays through `dice` / `dice-events`.
- `src/pages/MapsPage.tsx:931` still subscribes to old frame stream.
- Current overlay usage no longer passes frame callbacks, so old stream receives start without useful frame completion.

Impact:
- Same logical roll can create multiple UI artifacts: physical roll, result overlay, stale stream preview.
- Old stream state can stay around or be cleared on unrelated timing.
- This is a likely source of "one side sees dice, the other does not" and duplicate/ghost dice.

Fix direction:
- Delete old `dice-stream` path entirely.
- Keep one path: precomputed values via `dice-roll-request`.
- Tie combat log/result overlay to the same `requestId`.

## P1 - Second Enemy Action Cannot Move

Evidence:
- `src/pages/MapsPage.tsx:4432` second enemy AP is only used if `nextResult.attacked && !nextResult.newPosition`.
- If second plan says "move closer", that branch is ignored and the turn advances.

Impact:
- Enemies with remaining AP may stop instead of using the second AP to move.
- This conflicts with the intended "melee enemy uses two AP to move twice if far away" behavior.

Fix direction:
- Handle second-action move plans the same way as first action:
  spend AP, resolve opportunity attacks, update token position, broadcast snapshot.

## P1 - AP Reset Is Fragile And Split Across Layers

Evidence:
- `src/store/characters.ts:797` `beginTurn()` logs AP but does not restore AP.
- `src/pages/MapsPage.tsx:858` `resetRoundApForActiveMap()` restores AP at round start and writes `characters`.
- `src/pages/MapsPage.tsx:887` round-start reset effect runs on any client, not DM-only.

Impact:
- The rule "AP resets at the start of each round" is implemented in the page, not the authoritative combat model.
- If the player-side round-start effect runs before/after DM sync, AP can show as `0/2`.

Fix direction:
- Make round-start AP reset part of DM authoritative `nextRound()`.
- Player ports should never run AP reset writes.
- Keep `beginTurn()` free of AP reset if the round-start rule is intentional, but rename/log it clearly.

## P2 - Shared Log / Dice History Can Drop Entries

Evidence:
- `src/pages/MapsPage.tsx:617` loads `combat-log`, prepends locally, then saves.
- `src/pages/MapsPage.tsx:646` loads `dice-events`, mutates locally, then saves.

Impact:
- Concurrent entries from DM and player can overwrite each other.
- Logs can appear different across ports.

Fix direction:
- Use append-only event endpoints with server-side ordering.
- Or include a monotonic event id and merge by id on the server.

## P2 - New Reaction Pipeline Is Not Integrated

Evidence:
- `src/lib/combatResolutionPipeline.ts` and `src/lib/combatReactionHooks.ts` define staged hooks.
- `rg` shows no call site in `MapsPage.tsx` or attack resolution paths.

Impact:
- The framework for "ally attacked", "ally damaged", replacement dodge, mitigation, counterattack, etc. exists but does not affect combat.
- Future features may appear implemented but never trigger.

Fix direction:
- Wrap single-target attack, AOE damage, enemy attack, and dodge into the pipeline.
- Apply queued mutations only on the DM side.
- Broadcast one authoritative result snapshot per pipeline action.

## Recommended Fix Order

1. Make DM the only combat writer: `combat`, combat fields in `characters`, combat fields in `maps`.
2. Restore player action request / DM ACK flow for end turn, attacks, feature activation, and dodge.
3. Add shared dodge timeout and UI countdown.
4. Remove old `dice-stream`; keep only `dice-roll-request`.
5. Move AP reset into DM `nextRound()` only.
6. Integrate `combatResolutionPipeline` after state authority is stable.
