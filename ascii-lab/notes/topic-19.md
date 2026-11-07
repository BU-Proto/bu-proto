# Topic 19: Procedural mushroom and organic forms, SDF raymarching

Sources: https://iquilezles.org/articles/smin/ (smooth min), https://iquilezles.org/articles/distfunctions/ (primitives), https://www.cl.cam.ac.uk/teaching/1718/FGraphics/1. Ray Marching and Signed Distance Fields.pdf (polynomial smin), https://godotshaders.com/shader/fullscreen-sdf-raymarching-with-smooth-csg-and-depth/ (colour blended by the smin factor), https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/ (metaball-style melting). Search found no mushroom-specific shader, so the recipe below is our own composition of these primitives.

## Mushroom recipe
- Cap: ellipsoid or a sphere scaled in y, then cut flat underneath with a plane: d = max(sphere, -y - k). Add a thin gill disc: a squashed cylinder just under the rim.
- Stem: capped cone or vertical capsule with a radius that tapers: r(y) = mix(rBase, rTop, y). Bend by offsetting p.x by a sin(y*1.5) * 0.1 before evaluating.
- Join with polynomial smooth min so cap and stem melt:
  h = clamp(0.5 + 0.5*(b-a)/k, 0., 1.); d = mix(b, a, h) - k*h*(1.-h);
  Use k near 0.15. Return h too, to mix material ids or colours.
- Organic wobble: domain-warp p with low-amplitude sin noise (p += 0.04*sin(p.yzx*7.+t)) before the SDF. Keep amplitude small or the distance bound breaks; multiply step by 0.7.
- Spots: for cap surface, subtract small spheres placed by cell hash on the cap's spherical coords, with smax to dent them.
- Cluster: domain repetition with per-cell hash for height, tilt and scale; evaluate only the neighbouring cells.

## Shading for ASCII (the useful part)
- Normal by 4-tap tetrahedron gradient. Light = soft wrap diffuse: dot(n,l)*0.5+0.5.
- Fresnel rim: pow(1.-max(dot(n,-rd),0.),3.). Drive a cyan/lagoon rim from it, matching the reference's rim.
- Bright pass: threshold light at ~0.75; those texels become line glyphs (+ x / |), above 0.95 become white blocks. Below, a soft blurred colour field stays visible.
- Colour by depth/height through the palette, not by albedo: base harbor to cerulean, mid iris, top rose, so the gradient reads as light on a form.
- Glyph choice: map light to a density ramp, and map the normal's screen-space angle (atan(n.y,n.x)) to a stroke glyph: - / | \ . Edges then follow the surface curvature, which looks like drawn hatching.
- Subsurface fake: add thickness = smooth AO from 3 short marches along -n; tint with peach/haze warm core.

## Performance
- Render the SDF at the glyph grid resolution (e.g. 120x60 cells), not pixels. 48 steps, early out at 0.002, bounding sphere test first. Then the cost is tiny; cell sample feeds the glyph atlas lookup.
- Reduced motion: freeze t and render one frame.

## Single most useful idea
Raymarch at glyph-cell resolution and pick the glyph from the surface normal's angle, colouring by height gradient plus a fresnel rim.
