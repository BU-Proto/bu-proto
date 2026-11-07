# Motion for glyph fields (topic 23)

Principle: the glyph grid is a cheap lookup. Compute one scalar per cell (0..1), then use it for glyph choice, brightness and gradient position. Never animate per-glyph DOM; use one canvas/WebGL2 pass.

## 1. Reveal
Reveal = a threshold sweeping a per-cell scalar. Patterns seen in the wild: diagonal, radial, random (react-video-ascii), edges-in, center line, zigzag (Framer Dynamic ASCII Reveal).
- t = smoothstep(r - w, r, progress * (1 + w)) where r is a cell's coordinate: dot(uv, dir) for diagonal, length(uv - c) for radial, hash(cell) for random.
- Make the front visible: cells just behind the front get a hot glyph (X, #) and an iris-to-rose tint, then settle to the final glyph. Mint only for "live".
- Sources: https://github.com/LucasHJin/react-video-ascii/wiki, https://marketplace.framer.com/marketplace/components/dynamic-ascii-reveal

## 2. Decode
Decode = glyph index cycles through the ramp until a per-cell lock time, then freezes on the true glyph.
- lock = hash(cell) * 0.6 + r * 0.4 (blend random with a spatial sweep so it reads as a wave, not noise).
- idx = t < lock ? floor(hash(cell + floor(time * 12.0)) * N) : trueIdx. Step time at about 12 Hz, not per frame, so it flickers like text rather than shimmers.
- Dim unresolved cells toward the ground (#0b2a46) so resolved cells carry the light.

## 3. Flow fields
Midjourney ASCII Swirl (WebGL2, glyph atlas, instanced renderer, per-cell vortex math, gradient ink flowing through the field, click shockwaves) is the closest named example: https://21st.dev/@arlanoska/components/midjourney-ascii.md
- Cheap flow: advect the sample coordinate, not particles. p' = p + curl(noise(p * s + time * v)) * amp, with curl = (dn/dy, -dn/dx) from two finite-difference samples. Then read the gradient and glyph density from p'.
- Colour travels with the flow: gradient coordinate g = fract(p'.x * k + time * 0.03), mapped through blue -> iris -> rose, weighted to the rose end.

## 4. Reaction diffusion
Gray-Scott on a low-res grid, one cell per glyph (for example 120x70), so it is tiny. Ping-pong two float textures, 4 to 8 steps per frame.
- A' = A + (Da * lap(A) - A*B*B + f * (1 - A)) * dt; B' = B + (Db * lap(B) + A*B*B - (k + f) * B) * dt. Da about 1.0, Db about 0.5.
- Presets from sources: coral f 0.034, k 0.061; bubbles f 0.015, k 0.05. Karl Sims parameter map: f varies on the vertical, k on the horizontal. Change f and k gradually or the system collapses.
- Map B to glyph density (. : + # blocks) and to gradient position. Seed B from the cursor trail.
- Sources: https://karlsims.com/rdtool-help.html, https://github.com/piellardj/reaction-diffusion-webgl, https://openprocessing.org/sketch/633723

## 5. Cursor interaction that stays cheap
- Do not loop over trail points in the shader. Keep one low-res "energy" texture (the same grid as the glyphs): each frame multiply by 0.94, add a gaussian blob at the cursor. Sample it once per cell.
- Use that energy to bump glyph density, push the flow offset, or inject B into the reaction-diffusion grid.
- Click shockwave: ring = exp(-pow((length(uv - c) - speed * age) / width, 2.0)), one uniform for the centre and one for the age.
- ASCII Cursor WebGL uses the cursor as a lens revealing the treatment: https://www.framer.com/marketplace/components/ascii-cursor-webgl/

## Budget and safety
Resolve everything per cell, not per pixel. Quantise time for glyph flicker. prefers-reduced-motion: render one still frame at progress = 1.
