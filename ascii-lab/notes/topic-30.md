# Topic 30: colour-means-something systems

Goal: encode size/status in a glyph field with the BU Proto palette (sky = small, iris = medium, rose = big, mint = live) without losing beauty.

## 1. Meaning on one axis, not three
Drive colour from ONE scalar t in [0,1] (size). Map t through a fixed 3-stop ramp: sky #7cc7f4 -> iris #b6aaff -> rose #f4a2c0. Keep status (mint) on a separate channel (glyph, not hue), so the ramp stays readable.

## 2. Interpolate in OKLCH / Oklab, not RGB
Plain sRGB blending between sky and rose passes through grey-lilac. Convert stops to Oklab, mix, convert back. With a violet mid stop (iris), the middle holds chroma. Oklab was published by Bjorn Ottosson (https://bottosson.github.io/posts/oklab/); Raph Levien's review uses gradients to show where spaces fail (https://notes.billmill.org/visualization/interactive_explainers/An_interactive_review_of_Oklab.html). Photoshop's "Perceptual" gradient uses Oklab.

Shader sketch (own words): in GLSL, convert each stop to Oklab on the CPU, upload as vec3 uniforms, `mix()` in Oklab, then apply the inverse matrix and cube the LMS values in the fragment shader. Clamp or reduce chroma if out of sRGB gamut (chroma bisection is the standard fix).

## 3. Size also rides lightness and glyph density
Redundant encoding keeps meaning when hue is ambiguous (colour-blind viewers, projectors). Let t also select glyph ink coverage: `. : + x #` by t quantised into 5 bins. Big = dense glyph + rose. Small = sparse glyph + sky. Colour and density agree, so the field reads even in greyscale.

## 4. Hold lightness steady for categories, vary it for magnitude
Guides note that fixing L and C while sweeping hue gives evenly weighted categories (https://dev.to/irrationalapps/why-your-generated-color-palettes-look-muddy-and-what-oklch-does-about-it-410c). For a size ramp do the opposite: let L rise slightly toward rose so "big" glows. Keep the L change monotonic, so the ramp never reverses.

## 5. Status as light, not as another colour
Mint "live" works as a small accent: a 1-2 cell pulse, `sin(time*2 + id)` modulating alpha, with a faint bloom. Never tint the whole field mint. One accent hue means "live" stays unambiguous.

## 6. Keep it beautiful
- Quantise t to 6-8 bands so the gradient reads as posterised light (the cat reference) rather than a smooth wash.
- Add low-frequency noise to t so size regions have soft, organic edges.
- Highlights blow out to frost #f6fbff for the biggest values (mushroom reference).
- Use warm peach/haze only inside the field as the core glow.

## 7. Named examples to study
Viridis/Cividis colormaps for the monotonic-lightness principle; Tailwind v4's OKLCH scales for even steps; Photoshop's Oklab gradient mode.

## Most useful idea
One scalar (size) feeds colour, lightness and glyph density together through an Oklab ramp, and mint is reserved for a separate pulsing "live" channel.
