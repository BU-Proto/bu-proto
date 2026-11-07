# OKLCH gradients for ASCII fields (blue to iris to rose)

## Hue path
- CSS `in oklch shorter hue` goes blue (~250) up through violet (~300) to pink (~350). That is the arc we want. `longer hue` rainbows through green: never. Sources: https://developer.mozilla.org/en-US/docs/Web/CSS/color-interpolation-method , https://nerdy.dev/gradients-going-the-shorter-longer-increasing-or-decreasing-route
- Polar spaces can detour when endpoints have different chroma/lightness (the middle lands on an unintended hue). Tailwind v4 shipped Oklab as safer default. Cheap fix: author 4-5 explicit stops (sky, iris, iris deep, rose, raspberry) and interpolate between neighbours only, so no single span exceeds ~50 degrees of hue.
- Oklab (straight line in a,b) dips toward neutral when hues are far apart; OKLCH keeps chroma. For sky to rose directly (about 100 degrees apart), Oklab midpoint is greyish lavender; OKLCH midpoint is saturated violet. Prefer OKLCH, with a mid stop.

## Keep the middle from going grey
- Interpolate L, C, h separately; do not let C dip. Add a chroma floor: C = max(lerp(C0,C1,t), 0.10) or a bump C += 0.04*sin(pi*t) in the middle.
- Match lightness of neighbouring stops within ~0.05 L. Grey reads when L and C both sag.
- Mid stop #7a6ee0 (iris deep) is the insurance policy: sits on the violet path with C around 0.17.
- Glyph fields thin the colour (strokes cover little area on dark ground), so push chroma 15-25 percent above what looks right in a solid bar, and use additive-style glow.

## Gamut limits
- sRGB max chroma peaks differ: blue ~0.31 at L ~0.45, but at high L blues lose chroma fast; pinks/rose peak around L 0.7-0.8, C ~0.2. Light sky blue at L 0.8 tops out near C 0.10.
- So a gradient that holds one C across L will clip somewhere. Clip by reducing chroma at constant hue (Ottosson), never per-channel clamp: naive clamp can rotate hue by ~20 degrees, mapping about 3 degrees. https://bottosson.github.io/posts/gamutclipping
- Clamped blues drift purple, and that makes the blue end look like the AI-default. Reduce C, keep h.

## Shader snippet idea (GLSL, own words)
Convert OKLCH to linear sRGB with the Oklab matrices. Then `if(any(lessThan(rgb,vec3(0))) || any(greaterThan(rgb,vec3(1)))) c *= 0.93` and repeat up to 6 times (cheap binary-ish chroma shrink), then gamma encode. Precompute the ramp into a 256x1 texture on CPU instead for 60fps: a lookup per glyph, with the gamut-mapped colour baked in.

## Named tips
- Complement glyph hue against the field under it (cat reference): in OKLCH just add 180 to h and keep L offset +-0.2 for legibility.
- Blown highlights: lerp toward frost #f6fbff by chroma falling, not by lightness alone, so highlights stay clean.
- Check with Evil Martians' OKLCH picker (https://oklch.com) which shows the sRGB/P3 gamut edge per hue.
