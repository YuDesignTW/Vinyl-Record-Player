# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product decisions
- Preserve the Vinylacy-inspired monochrome stage, capsule navigation and Liquid Glass panels.
- Navigation: 唱片庫 / 外觀 / 音樂 / 聆聽.
- Music uses the reference Color page's enlarged, tilted vinyl composition; appearance uses extracted vinyl and sleeve composition.
- Independently editable centered labels on both faces. Single and double-disc sleeves with two openings for the latter.
- Hide visible panel scrollbars while preserving scrolling. Songs reorder by drag and keyboard.
- Persist archived records including audio files and artwork locally in IndexedDB; allow selecting records from the library.
- Coordinate interruptible scene scale/orientation and panel transitions; avoid full-app renders during drag/animation.

- Library landing uses the supplied stacked-sleeves reference: scrollable perspective jackets at left; selection updates the central stage with a restrained entrance and exposes half the disc. Keep right-panel contents intact and collapse only on initial app load. Use real saved covers, never fabricated library entries.

- Keep the library stage geometry fixed when the right panel expands; preserve panel state across tab and record switches. Mobile collection and selected record form one centered column. Library hides the stage footer and browsing hint; playback rotates the exposed disc. Both scenes remain mounted for exit/entrance transitions.

- Central library sleeve is clickable: retract disc fully, flip sleeve, reveal reverse artwork and label, then slide disc halfway out; do not interrupt playback. Shelf name/LP spines must attach edge-to-edge as a perpendicular thickness face.

- Library panel omits saved-status sentence, local-storage explanation, and collection/count heading. Edits auto-save after 450 ms idle; no manual save action. New Record remains in the library heading. Player uses a compact title/progress area and one row of transport/volume controls.

- Left THE COLLECTION/count header includes an arrow toggle to collapse or expand the sleeve list, retaining the header and scroll position without shifting the central stage.

- Shelf sleeves are larger and fully opaque on hover/focus; lift forward on the Z axis with higher stacking order rather than fading.

- Double sleeve is a hinged gatefold with four independent artwork fields: front, back, insideLeft, insideRight. Retract discs before closing; selecting the sleeve subtab opens the gatefold. Preserve old front/back artwork without duplicating it onto inner pages.
- Appearance subtab framing: label is a front-facing close-up with no sleeve; sleeve shows opening gatefold; vinyl is enlarged and tilted. Support common vinyl colors, transparent finish, custom base/accent colors and solid/marble/splatter/split patterns, persisting all settings and reflecting them in library artwork.

- Every entry into Appearance replays its presentation transition while retaining the selected subtab and saved design. Label moves into close-up; vinyl turns into tilted framing; double sleeves restart closed and open if the chosen view is open. Playback remains uninterrupted; reduced motion skips the entrance.

- Listening is a fixed-angle vinyl with a metallic tonearm/stylus, lowering on playback and lifting on pause. No stage footer/caption. Existing audio player morphs into a minimal lower-right dock without remounting or interrupting audio; respect reduced motion and mobile safe layout.

- Listening refinement: flat overhead disc, minimal thin arm/pivot/cartridge. Seek bar sits below the disc. Right queue includes A/B (and C/D) selectors above a separator; larger play control and separate skip buttons below, retaining the established monochrome style.

- Appearance stage has no bottom title/RPM/caption. Label view must frame the whole record without cropping; fit its scale to both viewport dimensions rather than using the earlier extreme close-up.

- Desktop record scene spans the full viewport and centers independently of the overlaid right console. Remove bottom canvas insets that visually crop the record. Mobile retains stacked scene/panel flow.

- Brand name is hdame (lowercase, no trailing period), replacing slowly in visible UI, page metadata and generated label/sleeve artwork. Keep the existing IndexedDB database key to preserve saved collections.

- Music fixed viewing angle: top edge tilts backward (X rotation -0.70 radians), with no side yaw or diagonal roll. Retain the enlarged scale. This replaces the earlier tall/narrow side-tilted reference.

- Tonearm placement follows image copy 2.png: upper-right pivot, slim shaft descending along the record’s right side, angled cartridge contacting the lower-right outer grooves; parked vertically outside the disc when paused.

- Tonearm length correction: retain 80% of the long reference arm (reduce by 20%), not reduce by 80%. Keep its playback tip on lower-right grooves and parked arm outside the disc.

- Appearance → Label: multiply the previous viewport-fit scale (95% of the limiting viewport dimension, cap 1.78) by 1.5. The user explicitly requested this closer framing; allow the enlarged disc to extend beyond the viewport.

- Appearance supports Cmd/Ctrl+V image paste onto the selected label side or sleeve face, using upload format/size limits; ordinary text paste remains native.

- Music accepts YouTube video URLs as saved tracks, using the official iframe player with a visible viewport of at least 200 × 200 px. Place it inside the control panel above the seek bar. Share playback/seek/volume/skip controls with local audio. Do not fade or hide the embedded player.

- Music import is one shared card with Music Files / YouTube selectors. The YouTube player is above the seek bar inside the panel; collapsing pauses YouTube, and playing a YouTube track expands the panel. Preserve the iframe while toggling the panel.

- YouTube window is the bare embedded player: no surrounding glass card, border, padding, custom caption, or shadow.

- YouTube presence transitions expand/collapse over 320 ms with a short fade. Pause departing video immediately, retain it for the exit transition, and honor reduced motion. In Listening, place the YouTube seek bar below the record on the stage, sharing the same placement as local audio. Keep video above the album heading and song list, with playback controls below the list; use CSS ordering to preserve the iframe.

- YouTube visual reference image.png: round only the two upper corners (12px); keep lower corners square, without an external border, caption, or shadow.

- Listening album heading has a track-list collapse toggle after the song count. Collapse songs and side selectors together toward the bottom. Move the album heading down to the fixed transport; retain video and playback without interruption.

- Control panels omit introductory slogans and secondary instructional copy. Keep functional labels, format lists, counts, and concise empty/loading/error states.

- Auto-save serializes writes and flushes edits before switching records. Show only pending/error status and retry on failure. Library rows offer a delete action with a named confirmation; cancel queued saves for deleted records, stop active playback, and select another record or an empty draft.

- In Listening, collapsing the queue moves the YouTube video and album heading down together above the fixed transport; the video must not stay isolated at the top.

- Enlarged Label canvas spans the dynamic viewport, including mobile: clip at screen edges rather than at the shorter scene placeholder. Retain the enlarged scale and overlay controls.

- Omit the repeated library/appearance/music/listening title from the right panel header; keep navigation labels and panel actions/status.

- Right-panel input hover/focus rings render inside field bounds to avoid clipping in scroll containers; keep a visible keyboard focus indicator.

- The user cancelled the Interactive skating game on 2026-11-04. Remove its navigation, dedicated page, controls, animation code and generated assets. Keep only the existing record-library, appearance, music and listening experience; do not reintroduce the game unless explicitly requested.
- Library motion revision (2026-11-04): the user disliked the elaborate video-inspired movement and explicitly requested simpler animation. Replace the cross-stage flight, arc, depth rotation, scale overshoot and delayed choreography with a 12 px local fade/slide and a gentle disc reveal, about 400 ms total. Keep shelf items visible and stationary during selection; clicking the current record should not replay the entrance. Preserve manual sleeve flipping, playback and cancellation on selection/navigation/resize/reduced motion. This supersedes the earlier three-second video motion direction.

- Local persistence (2026-11-05): user wants collections retained across refreshes and restarts, without a Chrome extension. Vite development mode saves records, embedded audio and artwork atomically under `.local-data/records/`; migrate missing browser records and never overwrite existing disk records with stale browser copies. Show saved time after successful writes. Keep static/Sites builds on IndexedDB and keep local files out of published assets/version control.

- YouTube local origin (2026-11-05): use http://localhost:4173 as the player entry. Two saved music videos returned UNPLAYABLE from YouTube for the 127.0.0.1 origin, while localhost returned OK. Redirect loopback IP pages only after listRecords successfully imports browser-only records to disk; never spoof an unrelated origin or bypass actual embed restrictions.

- Library loading (2026-11-05): show a full-viewport monochrome loading screen with a small CSS rotating vinyl, hdame wordmark and 「正在載入唱片庫…」 while restoring collections. Tie visibility to the real loading state, fade out in 220 ms without an artificial wait, block editing until ready, and respect reduced motion.

- YouTube background mode (2026-11-05): user requests a topbar button that places the selected YouTube video behind the record scene with a 55% black overlay. Preserve the same iframe/transport and playback position when toggling via a stable portal target. Use dark UI for contrast, keep visible background playback when collapsing the panel, return to inline mode on autoplay blocking, and exit when switching to local audio.

- Brand and language update (2026-11-05): brand is now hMusic, with a 3 px logo/wordmark gap. Move the YouTube backdrop toggle immediately to the right of the listening queue collapse arrow. Top-right language selector offers English (default), 日本語 and 繁體中文, persisting the explicit choice. Translate interface text, status, controls and accessibility labels without translating user-authored record/track/label content or remounting playback. Keep the IndexedDB database and disk collection paths unchanged.

- Playback UI refinement (2026-11-05): replace the language dropdown with one compact text button cycling EN → JP → CN on click, preserving the language preference. Each newly selected YouTube video starts in full-viewport background mode; users may return it to the inline player. Use maximize/minimize icons beside the queue collapse arrow with matching muted color, 15 px size and 1.6 stroke width, including the active state.
