# InterDead poll progress — version 1

A visitor-controlled JSON projection carries completed poll identifiers between InterDeadIT and the InterDead browser host. Its authority is limited to local completion marks. Account identity, remote EFBD scores, narrative knowledge, access conditions, achievements and the C++ state retain their own contracts.

## Public projection

```json
{
  "format": "interdead.poll-progress",
  "version": 1,
  "completedPolls": ["1-efbd-poll", "2-efbd-poll"]
}
```

The current catalog contains the two stable website `gameId` values. Locales share these identifiers. The host exposes `hasCompletedPoll(id)` and `completePoll(id)` for channel and artifact consumers. Future authored cards use the same IDs; this change adds no narrative scene or new C++ rule.

Import is an idempotent union of known completion flags. Existing answers remain local, and an imported completion has no invented answer or axis value. Repeated submission is refused before a second point can be added. Unsupported versions, duplicate JSON keys, duplicate/unknown poll IDs and invalid input are rejected before mutation. Additional foreign fields have no effect on this projection.

## Player-data wrapper

InterDead's **Download player data** operation produces `format: "interdead.player-data"`, `version: 1`, an exact native save string in `save`, and the above projection in `interdead_poll_progress`. The website reads only the projection. The game passes the original native bytes to its existing restore boundary and merges completion flags only after successful restore. Legacy native saves keep their exact byte stream and validation path. **Download save** continues to export the original native format for native tools and existing consumers.

The native save limit remains 16 MiB. A wrapper may occupy up to 34 MiB because JSON string escaping can expand its native payload. UTF-8 and the outer document are checked before import; duplicate keys inside the native save remain visible to Core. A website-only file updates poll flags without invoking native restore or changing the current game session.

## Browser storage and consent

`interdead.poll-profile.v1` stores the local completion set, locally chosen axes and the first-run offer flag. The website uses this adapter when authorization is disabled. Connected identity and EFBD services keep their existing behavior when authorization is enabled; this file grants no connected session.

A first visit to the game offers import before explicit Start. Settings provide import and download later. Temporary or quota-limited storage keeps an in-tab projection with a visible download reminder. Corrupt stored bytes are retained until an explicit clear. The website's clear action affects this local key and its own origin.

Origin-local storage is independent across the website, standalone game, itch frame and WordPress host. File exchange is the explicit cross-origin boundary. Imports merge completion markers; browser storage alone provides no account synchronization or authenticity guarantee.

## Source and verification

The canonical implementation is [tools/shared/poll-progress.mjs](../../tools/shared/poll-progress.mjs). Consumer copies reside in InterDeadIT's `themes/InterDead/assets/js/application/profile/` and InterDead's `web/progress/`. Coordinated changes preserve identical source bytes and the same wire cases. The [schema](poll-progress-v1.schema.json) describes the portable projection and wrapper.

Production-module tests cover persistence, replay refusal, unsupported data, corruption, temporary storage, exact native bytes and two-way transfer. The website also builds real Hugo profile pages in four locales and exercises the production DOM controller. Native and browser/WASM acceptance remain separate, named evidence.
