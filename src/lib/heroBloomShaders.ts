
// The hero's two passes. The picture is the old bloom, soft and slowly folding, at full brightness.
// The glyph pass reads it cell by cell, with bands of light carrying the white across, and also makes
// the fall into the page. That happens in this final pass so it's worked out in float and dithered
// once at the end: an 8-bit picture would already be banded. The colour passes through a saturated
// horizon of deep hues, so it never goes grey, on a bell curve, so the fade has no visible start or
// end. The canvas is opaque and lands exactly on the page's ground, so nothing composites in steps.

export const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2. - 1., 0., 1.);
}`

export const PICTURE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uMap;
uniform float uT, uHeroH, uIntro, uStreaks;
uniform vec2 uView;


float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) { v += a * vn(p); p = p * 2.03 + vec2(7.1, 3.7); a *= .5; }
  return v / .9375;
}

/* The map through a cubic filter, because it's a coarse grid and bilinear shows its creases. */
vec3 smoothMap(vec2 uv) {
  vec2 size = vec2(textureSize(uMap, 0));
  vec2 st = uv * size - .5, i = floor(st), f = st - i;
  vec2 w0 = (1. - f) * (1. - f) * (1. - f) / 6.;
  vec2 w1 = (4. - 6. * f * f + 3. * f * f * f) / 6.;
  vec2 w2 = (1. + 3. * f + 3. * f * f - 3. * f * f * f) / 6.;
  vec2 w3 = f * f * f / 6.;
  vec2 g0 = w0 + w1, g1 = w2 + w3;
  vec2 p0 = (i - .5 + w1 / g0 + .5) / size, p1 = (i + 1.5 + w3 / g1 + .5) / size;
  return (texture(uMap, vec2(p0.x, p0.y)).rgb * g0.x + texture(uMap, vec2(p1.x, p0.y)).rgb * g1.x) * g0.y
    + (texture(uMap, vec2(p0.x, p1.y)).rgb * g0.x + texture(uMap, vec2(p1.x, p1.y)).rgb * g1.x) * g1.y;
}

void main() {
  vec2 px = vec2(vUv.x, 1. - vUv.y) * uView;
  vec2 uv = vec2(px.x / uView.x, px.y / uHeroH);
  vec2 p = uv * vec2(uView.x / uHeroH, 1.);
  float t = uT;

  /* the gradient itself never changes colour: it only folds and moves, slowly, like light through water */
  float n = fbm(p * 1.1 + vec2(t * .02, -t * .014));
  float m = fbm(p * 2.3 - vec2(t * .016, t * .02) + n * 1.4);
  /* streaks keep their lines: they're only stirred a little */
  vec2 warp = (vec2(n - .5, m - .5) * .2 + .012 * vec2(sin(p.y * 3. + t * .2), sin(p.x * 2.6 + t * .17))) * mix(1., .15, uStreaks);
  vec3 col = smoothMap(clamp(uv + warp, 0., 1.));

  /* soft folds, deepening each colour and lifting it, never mixing in another */
  float fold = sin((p.x * 1.3 + p.y * 2.2) * 2.6 + m * 6. + t * .12);
  col *= .95 + .08 * fold;
  col = mix(col, col * col * (3. - 2. * col), .16);

  /* the map's pale haze goes grey once it's dimmed, so low-chroma colour leans to rose while it's bright */
  float chroma = max(col.r, max(col.g, col.b)) - min(col.r, min(col.g, col.b));
  col = mix(mix(col, vec3(.86, .55, .68), .62 * (1. - uStreaks)), col, smoothstep(.04, .26, chroma));
  o = vec4(clamp(col, 0., 1.), 1.);
}`

export const GLYPHS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPic, uWarp;
uniform vec2 uOrigin, uWarpScale, uWarpSize;
uniform float uDpr, uWarpOn;
uniform vec2 uRes;
uniform float uCell, uT, uHeroPx, uIntro, uScroll;

const vec3 FROST = vec3(.961, .965, .98), MINT = vec3(.616, .941, .659), GROUND = vec3(0.);

float h(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
}
float lum(vec3 c) { return dot(c, vec3(.2126, .7152, .0722)); }
float line(vec2 p, vec2 a, vec2 b, float w, float px) {
  vec2 pa = p - a, ba = b - a;
  float k = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  return 1. - smoothstep(w - px, w + px, length(pa - ba * k));
}
float diamond(vec2 p, float r, float px) { return 1. - smoothstep(r - px, r + px, abs(p.x) + abs(p.y)); }

/* The alphabet, drawn with segments so it needs no font: ticks and daggers, and the trail's ○ > _ */
float glyph(int k, vec2 q, float px) {
  float w = .075;
  if (k == 1) return line(q, vec2(0, -.34), vec2(0, .34), w * .8, px);
  if (k == 2) return line(q, vec2(-.32, -.5), vec2(.32, .5), w, px);
  if (k == 3) return max(line(q, vec2(-.5, -.5), vec2(.06, .5), w, px), line(q, vec2(-.06, -.5), vec2(.5, .5), w, px));
  if (k == 4) return max(line(q, vec2(0, -.44), vec2(0, .44), w * 1.3, px), line(q, vec2(-.44, 0), vec2(.44, 0), w * 1.3, px));
  if (k == 5) return max(line(q, vec2(0, -.5), vec2(0, .5), w * 1.4, px), line(q, vec2(-.34, .16), vec2(.34, .16), w * 1.4, px));
  if (k == 6) return diamond(q, .36, px) - diamond(q, .2, px);
  if (k == 7) return diamond(q, .34, px);
  if (k == 8) return 1. - smoothstep(.1 - px, .1 + px, length(q));
  if (k == 9) return 1. - smoothstep(.07 - px, .07 + px, abs(length(q) - .3));
  if (k == 10) return max(line(q, vec2(-.22, -.34), vec2(.2, 0), w * 1.2, px), line(q, vec2(.2, 0), vec2(-.22, .34), w * 1.2, px));
  if (k == 11) return line(q, vec2(-.36, -.38), vec2(.36, -.38), w * 1.4, px);
  if (k == 12) return 1. - smoothstep(.2 - px, .2 + px, abs(q.x));
  return 0.;
}

/* The block shades, as the hackathons page's field draws them, at the old hero's type size: each cell
   split into 2 by 2 squares, one lit for the light shade, the two on a diagonal for the medium, three
   for the dark and all four for the full block. They fill the cell edge to edge, so bright light reads
   as solid tiles and dim light as a dither. */
float block(int s, vec2 q) {
  if (s <= 0 || abs(q.x) > .5 || abs(q.y) > .5) return 0.;
  if (s >= 4) return 1.;
  ivec2 d = ivec2(clamp(floor((q + .5) * 2.), 0., 1.));
  bool ox = (d.x & 1) == 1, oy = (d.y & 1) == 1;
  if (s == 1) return !ox && !oy ? 1. : 0.;
  if (s == 2) return ox == oy ? 1. : 0.;
  return ox && oy ? 0. : 1.;
}

/* Bands of light travelling across the screen. White comes only from here, so white always moves. */
float travelling(vec2 p, float t) {
  float bend = sin(p.y * 2.2 - t * .17) * .34 + sin(p.x * 1.5 + t * .13) * .22;
  float a = .5 + .5 * sin((p.x * .77 - p.y * .64) * 6.5 - t * .62 + bend * 4.);
  float b = .5 + .5 * sin((p.x * .64 + p.y * .77) * 3.1 + t * .37 - bend * 3.);
  return pow(a, 4.) * (.3 + .9 * b);
}

/* The deep hues the bloom falls through: indigo, violet, plum, then back to indigo, drifting slowly. */
vec3 horizon(float x, float t) {
  float u = x + .07 * sin(x * 4. + t * .09) + .04 * sin(t * .05);
  vec3 c = mix(vec3(.05, .17, .46), vec3(.13, .12, .5), smoothstep(.08, .4, u));
  c = mix(c, vec3(.46, .08, .34), smoothstep(.36, .62, u));
  return mix(c, vec3(.1, .12, .46), smoothstep(.66, .98, u));
}

void main() {
  vec2 px = vec2(vUv.x, 1. - vUv.y) * uRes;
  /* the cursor's wind, as the old field had it: the block over this pixel is the one the wind carried
     here from upwind, so the blocks flow round the cursor and ease home. The light itself stays put. */
  if (uWarpOn > .5) {
    vec2 css = px / uDpr + uOrigin;
    px += texture(uWarp, (css * uWarpScale + .5) / uWarpSize).rg * uDpr;
  }
  vec2 id = floor(px / uCell), f = fract(px / uCell) - .5;
  vec2 cuv = (id + .5) * uCell / uRes;
  cuv.y = 1. - cuv.y;
  vec4 cs = texture(uPic, cuv);
  vec4 soft = textureLod(uPic, vUv, .6);

  float light = travelling((id + .5) * uCell / uRes.y, uT);
  /* how far into the fall this cell is: 0 in the bloom, 1 once it's gone */
  float depth = px.y / uHeroPx;
  /* the fall into the dark starts lower than the hero's foot, so more of the picture stands */
  float fall = smoothstep(.7, 1.22, (id.y + .5) * uCell / uHeroPx);
  /* the travelling bands only nudge the light now, so they don't sweep pale clouds across the blocks */
  float L = pow(lum(cs.rgb), 1.45) * (1. + light * .15);
  /* saturated darks count as light too, or the raspberry core would stand empty */
  L = max(L, .3 * smoothstep(.3, .7, max(cs.r, max(cs.g, cs.b)) - min(cs.r, min(cs.g, cs.b))));
  float run = floor((id.y + h(vec2(id.x, 4.)) * 9.) / (2. + floor(h(vec2(id.x, 7.)) * 5.)));
  float n = h(vec2(id.x, run)), n2 = h(id + .5);
  /* the shimmer: slow waves of brightness that push cells up a tier as they pass */
  float wave = vn(id * .045 + vec2(uT * .09, -uT * .06)) * .6 + vn(id * .1 - vec2(uT * .07, 0.)) * .4;
  L *= 1. + .1 * (wave - .5) * 2.;

  /* the shade for this cell's light: none, light, medium, dark, full, a few cells a step lighter */
  int s = 0;
  float a = 1.;
  vec3 ink = FROST;
  /* bright light lifts the blocks only a little toward white, so they keep the picture's colour */
  vec3 lift = mix(cs.rgb * 1.3 + .03, FROST, .3 * smoothstep(.5, .95, L));
  if (L < .03) {
    s = 0;
  } else if (L < .1) {
    ink = lift;
    s = n2 > .55 ? 1 : 0;
    a = .5;
  } else if (L < .22) {
    ink = lift;
    s = n2 > .2 ? 1 : 0;
    a = .66;
  } else if (L < .38) {
    ink = lift;
    s = n > .25 ? 2 : 1;
    a = .84;
  } else if (L < .62) {
    ink = lift;
    s = n > .22 ? 3 : 2;
    a = .9;
  } else {
    /* the brightest blocks keep some of their own colour, as the old field's did, not pure white */
    ink = mix(lift, FROST, .15);
    s = n > .3 ? 4 : 3;
    a = .97;
  }

  /* falling, the blocks get lighter before they go: full and dark give way to the dither */
  if (s != 0) {
    float thin = fall * 1.5 - n2 * .7;
    if (thin > .55) s = 1;
    else if (thin > .2) s = min(s, 2);
  }
  float g = block(s, f) * a;

  /* now and then a mint cursor, fading in and out */
  if (L > .3 && h(id + 3.1) > .9992) {
    float cursor = smoothstep(.2, .7, sin(uT * .9 + n2 * 50.)) * clamp(glyph(11, f, 1.05 / uCell), 0., 1.);
    if (cursor > .01) { g = max(g, cursor); ink = mix(ink, MINT, cursor); }
  }

  /* toward the fold the type doesn't dim, it thins out: cells drop away one by one and stay crisp */
  float keep = pow(1. - smoothstep(.66, 1.2, depth), 1.5);
  float mark = g * smoothstep(.3, 1., uIntro) * smoothstep(0., .05, keep - h(id + .37));
  vec3 light_ = mix(soft.rgb, horizon(vUv.x, uT), smoothstep(.58, 1., depth));
  float reach = exp(-pow(max(depth - .82, 0.) / .19, 2.)) * (1. - smoothstep(1.24, 1.36, depth));
  reach *= (1. - .22 * pow(abs(vUv.x - .5) * 2., 3.)) * (1. - .5 * uScroll) * smoothstep(0., 1., uIntro);
  /* the type goes down with the light, in its own colour, so nothing is left floating bright */
  vec3 fallen = mix(ink, horizon(vUv.x, uT) * 1.9 + .06, smoothstep(.04, .5, fall));
  fallen *= mix(1., .16, smoothstep(.2, 1., fall));
  vec3 col = mix(mix(GROUND, light_, reach), fallen, mark);
  /* turned down to the old field's brightness, so the picture glows rather than glares */
  col *= .8;
  /* triangular dither, the last thing before the screen quantises it */
  col += (h(px * .37 + fract(uT)) + h(px * .71 + fract(uT * 1.3)) - 1.) * 2. / 255.;
  o = vec4(clamp(col, 0., 1.), 1.);
}`
