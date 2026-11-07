# Topic 28: Accessibility of animated text-mode backgrounds

Sources: https://hidde.blog/meeting-2-22-pause-stop-hide-with-prefers-reduced-motion/ , https://dequeuniversity.com/checklists/web/animation-motion-timed , https://www.w3.org/WAI/WCAG21/Techniques/html/H86 , https://discourse.32bit.cafe/t/making-ascii-art-accessable/4454
(Secondary sources; confirm thresholds against w3.org WCAG 1.4.3, 2.2.2, 2.3.3.)

## 1. Contrast of copy over a moving glyph field
- WCAG 1.4.3: 4.5:1 for body, 3:1 for large (24px, or 19px bold). Text over motion must pass against every frame and every pixel behind it, not frame 0. So test the worst case: the brightest glyph/highlight region behind the copy.
- Do not rely on measuring the shipped field. Bound it instead. Clamp field luminance inside copy zones so the worst case is known by construction.
- Technique: a "quiet zone" mask. In the shader, multiply glyph alpha and brightness by (1 - m), where m is a smooth rect/ellipse mask around text blocks (m up to ~0.8). Field fades toward harbor #061a2e behind copy.
- Frost #f6fbff on harbor #061a2e is roughly 17:1, so there is large headroom. Rule: keep the field's max luminance behind copy at or below raised #123a5c (about 1.6 relative-luminance-wise, giving frost >= 9:1). Rose #f4a2c0 and sky #7cc7f4 glyphs at full strength behind frost text would fail (frost vs rose is about 1.9:1), so they must be masked.
- Add a scrim as a second safety layer: a radial or linear gradient of harbor at 55-75% alpha under copy, so contrast holds even if the mask is wrong.
- Blown-out white blocks (the mushroom highlight look) are the biggest contrast risk. Keep them away from copy columns, or cap the highlight to a sky tint inside the mask.
- Sketch (GLSL idea): `float q = smoothstep(0.0, 1.0, textMask(uv)); col = mix(col, harbor, q*0.75); glyphA *= 1.0 - q*0.85;`
- Test automatically: render the field to canvas at N sampled times, read pixels under each text rect, compute WCAG ratio against frost with the worst pixel, assert >= 4.5. Cheap to put in a debug flag.

## 2. Legibility of the field itself
- Glyph flicker: per-cell glyph swaps above ~3 Hz across large areas read as flashing. WCAG 2.3.1 limits to 3 flashes/sec; keep luminance change per cell small and drift slow (ripples under 0.5 Hz, glyph index changes staggered by noise rather than synchronised).
- Avoid full-field synchronous pulses. Use travelling phase (a wave) so no region flashes as a whole.
- Glyph size: keep cells >= 10-12px so the field reads as texture, not tiny jittering noise.

## 3. Reduced motion and pause
- `prefers-reduced-motion: reduce` handles 2.3.3 and, per Hidde's argument, can satisfy 2.2.2 if all motion is removed under it. Render one still frame, and stop the rAF loop (matchMedia listener, so toggling live works).
- Autoplay over 5s needs a pause control for everyone (2.2.2). Add a small, keyboard-focusable "Pause field" button; mint #9df0a8 dot = live, hollow when paused.
- Also pause when tab hidden (visibilitychange), saves battery.
- Still frame should be an intentionally chosen time (t where composition is best), not t=0.

## 4. Screen readers
- Decorative field: `aria-hidden="true"` on the canvas or pre wrapper; do not emit thousands of text glyphs into the DOM, since readers announce them character by character. Canvas/WebGL avoids this.
- If the field is a real text DOM, add `user-select: none` and aria-hidden, and keep it out of the tab order.
- Meaningful ASCII (a logo): role="img" plus aria-label.

## 5. Other
- `forced-colors` / high contrast: hide the field (`display:none`), show plain ground.
- Provide `prefers-contrast: more`: drop field alpha to ~30% and widen scrim.
