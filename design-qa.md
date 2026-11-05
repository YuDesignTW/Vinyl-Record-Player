# Simplified library motion — 2026-11-04

final result: blocked

Current visual direction: the user requested a simpler, quieter animation after rejecting the prior video-inspired sequence.

| Before | After | Why |
| --- | --- | --- |
| Cross-stage arc, depth rotation and scale overshoot | Local 12 px slide/fade over 260 ms | Keep the selection calm and readable |
| Full extraction with angular wobble and overshoot | Straight disc reveal from 32% to 51%, 320 ms after an 80 ms delay | Finish the whole entrance in 400 ms |
| Late moving caption | Short opacity-only fade | Avoid an additional competing movement |
| Shelf copy disappears and reappears | Shelf remains visible; current-record clicks do not replay | Keep browsing stable |

Validation: `npm run build` and all 11 existing tests passed. The local preview serves the updated module (HTTP 200). No new tests were added for animation timing. Updated lifecycle tests retain rapid-selection cancellation, navigation/resize settling, reduced motion, playback and sleeve-side preservation, and verify that reselecting the current record does not replay the entrance.

Browser-rendered verification remains blocked by the previously documented unavailable browser connection and sandbox launch restriction. The changed timing, responsive composition and visual feel have not been inspected in a real browser; no visual pass is claimed.

---

# Previous iteration (superseded)

# Library motion update — 2026-11-04

final result: blocked

Implementation and automated checks are complete; browser-rendered motion/visual comparison remains unavailable.

## Source and scope

- Source: first three seconds of `../AQMyII_YIJeBgkoon1ewzOSJZHVWGIWaqPDgMV37736CsnPUx8qLebfpHiBwKeD8DB9-QuRTKxKGHlsL_eBSRL1RESRbYsnkccI1Uys.mp4` (720 × 1280, 30 fps).
- Opened `/tmp/hdame-library-reference/first-three-seconds.png` (18 samples at 6 fps) and `/tmp/hdame-library-reference/detail-timeline.png` (30 samples at 10 fps, cropped around the photographed laptop display).
- Approximate source sequence: 0–0.7 s collection object moves into focus; 0.8–1.3 s disc turns and grows; 1.3–2.2 s it lifts, shrinks and seats into the player; 2.2–2.6 s headphones and supporting text arrive. Later movement includes the filming camera changing angle and is not reproduced as interface behavior.
- Transfer the continuity and staged timing to the existing vinyl library; do not clone the reference's CD-player layout/assets or replace the collection interface.

## Motion changes

| Before | After | Why |
| --- | --- | --- |
| Fixed .42 scale and .25 opacity at the start | Read the clicked sleeve's size/position/tilt and keep the object opaque | Preserve the identity of the selected object |
| Straight move with one easing curve | A sampled continuous arc, depth rotation and restrained settling | Give the sleeve a readable turn and landing |
| Disc opens at 230 ms while the sleeve is still travelling | 860 ms travel; extraction begins at 700 ms and finishes at 1240 ms | Let the sleeve become readable before opening |
| Caption appears immediately | Caption enters at 910 ms over 260 ms | Follow the physical action with supporting information |
| Broad subtree animation cancellation | Track only owned WAAPI animations; restore the source on cancellation | Preserve record spin and prevent hidden sleeves after rapid selection |

## Automated validation

- Final `npm run build` and all 11 tests passed after the sleeve-side preservation and hover-specificity fixes.
- The existing local preview at `http://localhost:5173/` serves the updated library module (HTTP 200). This is availability evidence, not browser visual verification.
- Existing application checks cover storage, imports, artwork, local playback, YouTube and Space controls.
- Added focused tests for rapid selection cancellation, restoring source sleeves, resize/exit cleanup, reduced-motion flipping and preserving the displayed sleeve side across navigation.
- The tests use controlled Web Animations API objects in JSDOM. They verify lifecycle and state, not visual trajectory, browser compositing or frame rate.

## Browser blocker and acceptance gaps

- Chrome and the in-app browser both reported unavailable through the connected browser control.
- The default Playwright browser version was not installed. An available Chromium executable was tried inside the normal sandbox and failed at macOS MachPortRendezvousServer bootstrap with permission denied. No sandbox bypass or new escalation was attempted.
- Implementation screenshot path: unavailable. Target desktop viewport: 1440 × 900; mobile and dark-state captures also pending.
- Full-view comparison and focused motion comparison: blocked. There is no normalized source/implementation comparison and no claim of source-level visual fidelity.
- Fonts, layout, colors, artwork and copy reuse the existing interface; no new visual-pass claim is made for these surfaces.
- Remaining checks: desktop/mobile arrival path, source/target alignment, sleeve turning and occlusion, extraction timing, interrupted flips, hover behavior, dark mode and actual reduced-motion rendering. Review in slow motion before accepting final visual quality.

---

# Game removal — 2026-11-04

The user cancelled the Interactive game. Removed the game navigation, dedicated route behavior, characters, Canvas animation loop, transition bridge, game styles, tests and generated study/sprite assets. Restored the original four-tab player and Space playback shortcut. Record storage, artwork, local audio, YouTube and existing scene transitions remain intact.

Validation: `npm run build` passed; all 8 remaining application/data tests passed, including Space play/pause, local-audio continuity, YouTube transport/seek and instance preservation, record storage and artwork editing. No game references remain in application source or tests. No new browser visual verification is claimed.

---

# Previous Design QA — 2026-11-02

Result: implemented and locally verified, with browser file-picker automation coverage incomplete.

## Visual evidence

Reference: https://vinylacy.com/zh/pages/configurator-beta

Inspected the live Color and printed-sleeve states, including transitions. Reference screenshots were captured in conversation at 1920 × 902. Local desktop screenshots at 1440 × 900 show the music composition, centered label and two outward-opening sleeves. Mobile full-page captures at 390px width were also inspected; the double-sleeve composition was reduced to fit the narrow stage. Captures are in the conversation, not exported image files. The reference and implementation viewport sizes differ; this is a qualitative composition review, not a normalized pixel-diff or fidelity score.

The local music view uses a large tilted record plus the requested right song list. The reference uses a lower Color selector instead. The sleeve view uses a three-dimensional jacket and extracted disc. The local double version adds two opposite-facing pockets. A/B labels are actual separate front/back surfaces, centered on the record geometry. Fonts are system sans-serif rather than extracted proprietary source fonts. Copy and controls intentionally implement a Traditional Chinese personal player rather than a purchase configurator.

## Motion and rendering

- Scene transforms use delta-time exponential interpolation, interruptible on new tab selection.
- Scene angle, scale, extraction and side flipping share one animation loop; dragging does not update React state every frame.
- Sleeves fade out faster than the camera composition changes to reduce transition ghosts.
- Playback clock updates are isolated to the audio controls. Artwork textures update only when corresponding content changes.
- Panel height and content entrances are animated. Hidden scrollbar retains overflow scrolling.
- Reduced-motion setting removes continuous spin and interpolated scene transitions.
- Generated vinyl artwork has baked reflections, not physically based live reflections.

## Verified

- Production build passes. Main JavaScript bundle is approximately 816 KB / 224 KB gzip; Vite reports a chunk-size advisory.
- Four application/data tests pass: independent labels, within-side reorder, IndexedDB audio/artwork persistence, and import → edit → archive → remount → play → unsaved-switch flow.
- Four existing Sites worker/packaging tests pass.
- Real browser: demo playback, saved collection reload, independently edited B label, appearance navigation, single/double sleeve views, desktop and mobile layout.
- Latest browser snapshots visibly show archived state and functional rendered controls. Console history retains an earlier dependency hot-reload React mismatch at 03:36 UTC; it did not recur in the subsequently reloaded and verified UI.

## Coverage limits

- Browser file selection automation could not attach test WAV files because the Chrome extension lacks local-file access. File import and persisted Blob bytes were instead covered in the integration/data tests. Real browser import through the OS picker remains unverified.
- Sorting logic is tested, but a real multi-song pointer drag has not been end-to-end automated.
- No frame-rate benchmark or exact motion-timing comparison to the source was performed.
- Initial stale native-window approval rejection was resolved by selecting the exact authorized local tab. A later reload rejection was resolved by reading the UI and confirming “已歸檔” before reloading. No approval blocker remains.

## Collection-stage update
- Replaced only the library stage with a scrollable perspective sleeve stack based on the user-provided image.png. Other tabs retain the original Three.js stage.
- Selection uses a measured source position, then a staged sleeve-opening and half-disc extraction. Reduced-motion users see the final state immediately.
- Library opens with the existing right panel collapsed; editing and persistence controls are unchanged.
- Verified two existing real collections render their covers and selecting OPED updates the center and loaded tracks without writing to the saved collection.
- App integration test updated for collapsed-library navigation and passes with the existing persistence tests.

## Collection polish follow-up
- Removed the shelf mask and heavy blurred shadows, with extra side padding for jacket edges.
- Both scenes remain mounted and crossfade with scale/position transitions. Hidden scenes are inert and removed from accessibility navigation.
- Right panel no longer changes library grid sizing. Browser-measured selected jacket bounds were identical before/after collapsing (390 × 390 at x=564.05, y=210 in the tested desktop viewport).
- Panel collapse is initial-load-only; verified music → library retains expanded state.
- Library playback verified with animation-play-state running and a nonidentity rotation matrix; paused afterward.
- Mobile screenshot verified one-column shelf above a centered half-extracted record. Removed library footer and browsing instructions.
- Application tests and production build pass.

## Sleeve flip and spine alignment
- Added an ordered retract → edge-on flip → reverse artwork → half extraction sequence. Interaction is guarded during the sequence and canceled cleanly on record changes or tab exit. Reduced-motion switches artwork immediately. Enter/Space also flip without toggling audio.
- Real browser verified reverse sleeve artwork and SIDE B, with animation busy state returning to false.
- Shelf spine is now a 12px perpendicular face anchored at the cover’s lower edge, maintaining full-width alignment; verified both existing records visually.

## Gatefold and material update
- Four separate artwork assignments replace duplicated front/back textures. Wing rotates about center spine; discs retract before closure and extend after opening. Existing front/back data remains compatible; absent inner artwork uses distinct C/D and A/B page treatments.
- Live Vinylacy label and Color states were revisited in the browser. Local label close-up, gatefold open/closed, tilted blue splatter and clear crystal were visually inspected. Transparency uses alpha rendering rather than optical refraction.
- Eight common colors, clear-crystal preset, opaque/transparent finish, custom color and solid/marble/splatter/split patterns added. Procedural textures are shared with the collection preview.
- Four tests pass including extended persistence coverage of all sleeve faces, transparent finish, pattern and accent color; production build passes. Browser testing used temporary unsaved changes, without overwriting saved collections.

## Gatefold geometry correction
- Selecting double-disc format immediately opens the sleeve.
- Disc and pocket now share one rigid hinge transform; removed independent X-position interpolation that let the disc protrude during rotation. Extraction starts only after opening; folding waits for retraction. Fully enclosed discs are hidden during hinge motion.
- Inner-paper hinge yields coplanar open panels and 0.25-unit closed pocket separation. Assembly is centered before rotation; default sleeve view has no pitch/yaw tilt. Horizontal drag is unrestricted so the reverse can be inspected.
- Added regression coverage for immediate opening and hinge-plane invariants across rotation angles. Browser verification of this latest correction is pending: two browser-control calls timed out. No fresh visual-pass claim.

## Listening layout update
- Added a geometric metal tonearm, pivot, counterweight, headshell and stylus. Fixed listening viewpoint ignores drag; arm lowers during playback.
- Same player node moves into a transparent lower-right desktop dock with coordinated height/translation transitions; mobile uses a bottom dock. Stage footer/caption removed from listening view.
- Integration coverage checks audio identity/playback continuity when entering Listening and absence of reset-view button.
- Latest browser visual verification unavailable: reference browser request timed out. Layout based on supplied image and earlier reference observations; no fresh visual-pass claim.

## Flat listening refinement
- Replaced complex tonearm with a thin rod, small pivot, cartridge and stylus; listening pose has zero tilt.
- Progress rendered below the disc using a portal from the existing audio controls, preserving the audio node and playback state. Right dock now contains a scrollable per-side queue above the divider and larger separated transport controls below.
- Integration checks progress host, queue selection and empty-side switching in addition to uninterrupted playback across tabs. Browser connection again timed out, so final visual review remains pending.
