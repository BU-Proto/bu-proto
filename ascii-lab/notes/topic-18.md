# Topic 18: Mushroom luminosity (gills, rims, translucency)

## Why mushrooms look lit from within
- Thin flesh plus backlight. Light enters the cap, scatters, exits the front. Edges and thin gill blades glow most; thick stem stays dark. Example: backlit-from-below morning-sun gill shot, https://download.osmand.net/wiki/File:Backlit_mushroom.jpg
- Spore/gill veil diffracts backlight into a coloured halo (Smithsonian contest entry description, https://photocontest.smithsonianmag.com/photocontest/detail/peek-a-boo-116/).
- Macro shooters use soft diffused light so shadows stay open and gill translucence reads (https://adaptalux.com/mushroom-macro-photography/).
- Search found nothing on true bioluminescence (Mycena foxfire); treat as unresearched.

## Shader recipes (own words)
Wrap lighting, from Simon Green, GPU Gems ch.16 (https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch16.html):
  diff = max(0, (dot(N,L) + w) / (1 + w))   // w in 0..1, light bleeds past terminator
The chapter also suggests a slight red shift near the terminator; for our palette shift toward rose/iris instead of red.

Fake thin translucency (Wikibooks idea, https://en.wikibooks.org/wiki/GLSL_Programming/Unity/Translucent_Bodies):
  back = pow(saturate(dot(V, -(L + N*d))), p) * thickness_inv
  where thickness_inv = 1 - thickness; thin rim and gill edges give high value.
Procedural thickness for a cap: t = smoothstep over distance from the cap edge; gills = high-frequency radial stripes, sin(angle * N) with thin bright ridges.

Rim: fres = pow(1 - dot(N,V), 3). Add as cool cyan-ish rim (lagoon/sky) on the lit side.

## For ASCII + gradient
- Map luminance to glyph density, but map thickness (inverse) to colour: thick = harbor/cerulean, mid = iris, thin = rose, hottest = peach then frost block.
- Gills: radial lines as `| / \` glyphs oriented along the radial direction (angle -> glyph), brightness from the ridge function.
- Rim glow: a second pass, fres * sky tint, drawn as `+ x` glyphs; blow highlights out to solid frost blocks.
- Transmission colour: warm core (peach/haze) bleeding through the thin cap, cool sky on rim. Complementary temperature contrast is what reads as "inner light".
- Interpolate in OKLCH via an iris mid stop to avoid grey.
- Soft halo: blur the luminance buffer, add as low-density dots around the cap (diffraction halo).

## Most useful
Drive glyph colour by inverse thickness, not brightness, so thin gill edges and the cap rim turn rose and then white while the body stays blue.
