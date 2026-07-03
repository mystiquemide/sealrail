# Reply to Claude Design — SealRail Motion Demo Gaps

Use this to resolve the open questions.

## Missing screenshots

Use the attached missing references. The brief filenames map to these files:

```text
references/sealrail/00b_landing_sections.png
references/sealrail/09_api_keys_management.png
references/sealrail/10_review_quickstart.png
references/sealrail/11_run_verified_output.png
references/madison_contact_sheet.jpg
references/madison_keyframes.jpg
references/sealrail/00_logo_wordmark.jpg
```

If any asset is still unavailable inside the design environment, do not block. Use the closest available SealRail screenshot and preserve the same scene intent:

- `landing_sections` → use `landing hero` plus animated callout panels
- `api_keys` → use `docs` screenshot and create a small dark API-key panel mockup using SealRail tokens
- `review_quickstart` → use `landing hero` or `docs` as the judge-fast-path scene
- `run_verified_output` → use `run_flow_completed` and zoom into the proof/output area
- Madison frames → use the brief's written scene analysis as the pacing reference
- Logo SVG → recreate as inline SVG from the brief: horizontal rails, center seal circle, Casper-red dot, wordmark `SealRail`

## SealRail logo / wordmark

Use the attached `00_logo_wordmark.jpg` as reference, but implement the brand reveal with an inline SVG mark instead of depending on a logo file.

Logo concept:

- horizontal rail line left and right
- center seal circle
- Casper red center dot `#FF2D2D`
- short vertical stem above center
- wordmark: `SealRail`, Inter 600, cream white `#F6F5F3`

## Target video length

Use **115 seconds**.

The rough scene timing should be:

```text
0:00–0:08   Unverified AI work problem
0:08–0:17   Buyer/payment risk questions
0:17–0:25   SealRail brand reveal
0:25–0:36   Product overview / landing UI
0:36–0:45   Reviewer quickstart / judge path
0:45–1:02   Run flow completed
1:02–1:17   Proof detail / hashes / x402 receipt
1:17–1:30   Casper explorer anchor
1:30–1:40   Marketplace / multiple agents
1:40–1:50   Verifiers, docs, API keys
1:50–1:57   Status / trust boundaries
1:57–1:55+  Final CTA lockup
```

Adjust the final 2–4 seconds so the end card holds cleanly.

## Voiceover audio

No audio file is required for this build.

Build the artifact with:

- mandatory captions synced to timeline
- a `voiceoverMarkers` array from the brief
- optional placeholder Web Audio ticks/whooshes only if helpful
- clear code comments showing where a real voiceover file can be inserted later

Do not wait for audio. The captions are the source of truth for now.

## Playback controls

Include them.

Required controls:

```text
Space      play / pause
Left       seek back 5 seconds
Right      seek forward 5 seconds
R          restart
Progress bar at bottom
Optional visible mini controls: Play/Pause, Restart, Mute placeholder
```

## Build mode

Build a **hi-fi interactive prototype / motion demo**, not a static mockup.

It should autoplay as a video-like timeline, but allow manual scrubbing/keyboard control for review.

## Brand reminder

Use Madison only for storytelling structure and pacing. Keep SealRail's own brand:

```text
Dark premium fintech/Web3
Casper red accents
Cream typography
Rail lines
Proof/payment infrastructure tone
Real product screenshots
No purple Madison styling
No generic marketing SaaS look
```
