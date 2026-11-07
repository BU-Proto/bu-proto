import { FILM } from './wakeField'

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
uniform float uT, uHeroH, uIntro;
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
  vec2 warp = vec2(n - .5, m - .5) * .2 + .012 * vec2(sin(p.y * 3. + t * .2), sin(p.x * 2.6 + t * .17));
  vec3 col = smoothMap(clamp(uv + warp, 0., 1.));

  /* soft folds, deepening each colour and lifting it, never mixing in another */
  float fold = sin((p.x * 1.3 + p.y * 2.2) * 2.6 + m * 6. + t * .12);
  col *= .95 + .08 * fold;
  col = mix(col, col * col * (3. - 2. * col), .16);

  /* the map's pale haze goes grey once it's dimmed, so low-chroma colour leans to rose while it's bright */
  float chroma = max(col.r, max(col.g, col.b)) - min(col.r, min(col.g, col.b));
  col = mix(mix(col, vec3(.86, .55, .68), .62), col, smoothstep(.04, .26, chroma));
  o = vec4(clamp(col, 0., 1.), 1.);
}`

export const GLYPHS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPic, uWake;
uniform vec2 uRes;
uniform float uCell, uT, uHeroPx, uIntro, uScroll;

const vec3 FROST = vec3(.961, .965, .98), MINT = vec3(.616, .941, .659), GROUND = vec3(0.);

${FILM}

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
  vec3 c = mix(vec3(.05, .17, .46), vec3(.22, .09, .5), smoothstep(.08, .4, u));
  c = mix(c, vec3(.46, .08, .34), smoothstep(.36, .62, u));
  return mix(c, vec3(.1, .12, .46), smoothstep(.66, .98, u));
}

void main() {
  vec2 px = vec2(vUv.x, 1. - vUv.y) * uRes;
  vec2 id = floor(px / uCell), f = fract(px / uCell) - .5;
  vec2 cuv = (id + .5) * uCell / uRes;
  cuv.y = 1. - cuv.y;
  vec4 cs = texture(uPic, cuv);
  vec4 soft = textureLod(uPic, vUv, .6);

  float light = travelling((id + .5) * uCell / uRes.y, uT);
  /* how far into the fall this cell is: 0 in the bloom, 1 once it's gone */
  float depth = px.y / uHeroPx;
  float fall = smoothstep(.58, 1.1, (id.y + .5) * uCell / uHeroPx);
  float L = pow(lum(cs.rgb), 1.45) * (1. + light * .6);
  /* saturated darks count as light too, or the raspberry core would stand empty */
  L = max(L, .3 * smoothstep(.3, .7, max(cs.r, max(cs.g, cs.b)) - min(cs.r, min(cs.g, cs.b))));
  float run = floor((id.y + h(vec2(id.x, 4.)) * 9.) / (2. + floor(h(vec2(id.x, 7.)) * 5.)));
  float n = h(vec2(id.x, run)), n2 = h(id + .5);
  /* the shimmer: slow waves of brightness that push cells up a tier as they pass */
  float wave = vn(id * .045 + vec2(uT * .09, -uT * .06)) * .6 + vn(id * .1 - vec2(uT * .07, 0.)) * .4;
  L *= 1. + .3 * (wave - .5) * 2.;
  float cl = vn(id * .13 + vec2(uT * .03, 0.)) * .65 + vn(id * .41 + 7.) * .35 + light * .45;

  int k = 0;
  float a = 1.;
  vec3 ink = FROST;
  vec3 lift = mix(cs.rgb * 1.3 + .03, FROST, smoothstep(.34, .72, L));
  if (L < .03) {
    k = 0;
  } else if (L < .1) {
    ink = lift;
    k = n2 > .84 ? 1 : (n2 > .74 ? 8 : 0);
    a = .5;
  } else if (L < .22) {
    ink = lift;
    k = n2 > .78 ? 1 : (n2 > .66 ? 6 : (n2 > .58 ? 2 : 0));
    a = .66;
  } else if (L < .38) {
    ink = lift;
    k = n > .76 ? 7 : (n > .64 ? 10 : (n > .54 ? 4 : (n > .44 ? 9 : 0)));
    a = .84;
  } else if (L < .62) {
    ink = lift;
    k = n > .72 ? 2 : (n > .5 ? 7 : (n > .32 ? 5 : (n > .16 ? 9 : 11)));
    a = .9;
  } else {
    ink = mix(lift, FROST, .6);
    k = n > .68 ? 3 : (n > .42 ? 5 : (n > .26 ? 10 : (n > .12 ? 7 : 4)));
    a = .97;
  }

  /* the cursor's wake, read once per cell so it stays type: glyphs slide along it and catch the film */
  vec4 wake = texture(uWake, vec2(cuv.x, cuv.y));
  vec2 flow = (wake.rg - .5) * 2.;
  float caught = smoothstep(.05, .5, wake.b) * step(n2 * .34, wake.b) * smoothstep(.03, .2, L + wake.b * .3);
  vec2 slid = f - vec2(flow.x, -flow.y) * wake.b * .7;
  if (caught > 0. && k == 0) k = n > .5 ? 7 : (n > .25 ? 2 : 4);
  /* falling, the type gets lighter before it goes: heavy marks give way to ticks, then to dots */
  if (k != 0 && caught == 0.) {
    float thin = fall * 1.5 - n2 * .7;
    if (thin > .55) k = 8;
    else if (thin > .2) k = n2 > .5 ? 1 : 8;
  }
  float g = clamp(glyph(k, slid, 1.05 / uCell), 0., 1.) * mix(a, 1., caught);

  /* bars gather where the light is, and fade as it moves on */
  float stub = floor((id.y + h(vec2(id.x, 11.)) * 3.) / 3.);
  float bar = smoothstep(.78, .96, cl) * step(.74, h(vec2(id.x, stub) + .4)) * (1. - smoothstep(.1, .34, fall));
  if (bar > .01 && L > .1) {
    float rod = clamp(glyph(12, f, 1.05 / uCell), 0., 1.) * bar;
    if (rod > g * .5) { g = max(g, rod); ink = mix(ink, FROST, bar); }
  }
  /* crosses and diamonds light up as a band reaches them: the band moves, so the sparkle moves */
  float gate = .992 - light * .2;
  float spark = smoothstep(gate, gate + .025, n2) * step(.12, L) * (1. - smoothstep(.2, .5, fall));
  if (spark > .01) {
    float glint = clamp(glyph(fract(n2 * 53.) > .5 ? 7 : 4, f * 1.15, 1.05 / uCell), 0., 1.) * spark;
    if (glint > g * .5) { g = max(g, glint); ink = mix(ink, FROST, spark); }
  }

  /* loose glyphs drifting slowly down the screen, each in its own column */
  float seed = h(vec2(id.x, 13.));
  if (seed > .86) {
    float rows = uHeroPx / uCell;
    float drop = fract(seed * 37. + uT * (.012 + .03 * h(vec2(id.x, 3.))));
    float at = rows * (drop * 1.1 - .05);
    float near_ = 1. - smoothstep(.2, .9, abs(id.y - at));
    if (near_ > .01) {
      float fade = smoothstep(0., .1, drop) * smoothstep(1., .85, drop) * near_ * (1. - smoothstep(.1, .36, fall));
      float dropped = clamp(glyph(seed > .93 ? 7 : 4, f * 1.15, 1.05 / uCell), 0., 1.) * fade;
      if (dropped > g * .5) { g = max(g, dropped); ink = mix(ink, FROST, fade); }
    }
  }

  /* now and then a mint cursor, fading in and out */
  if (L > .3 && h(id + 3.1) > .9992) {
    float cursor = smoothstep(.2, .7, sin(uT * .9 + n2 * 50.)) * clamp(glyph(11, f, 1.05 / uCell), 0., 1.);
    if (cursor > .01) { g = max(g, cursor); ink = mix(ink, MINT, cursor); }
  }

  /* toward the fold the type doesn't dim, it thins out: cells drop away one by one and stay crisp */
  float keep = pow(1. - smoothstep(.54, 1.08, depth), 1.5);
  float mark = g * smoothstep(.3, 1., uIntro) * smoothstep(0., .05, keep - h(id + .37));
  ink = mix(ink, min(film(wake.b * 2.4 + dot(flow, vec2(.7, .5)) * .9 + vUv.x * 1.1 - vUv.y * .7 + uT * .05) * 1.25, vec3(1.)), caught);
  vec3 light_ = mix(soft.rgb, horizon(vUv.x, uT), smoothstep(.46, .88, depth));
  float reach = exp(-pow(max(depth - .7, 0.) / .19, 2.)) * (1. - smoothstep(1.12, 1.24, depth));
  reach *= (1. - .22 * pow(abs(vUv.x - .5) * 2., 3.)) * (1. - .5 * uScroll) * smoothstep(0., 1., uIntro);
  /* the type goes down with the light, in its own colour, so nothing is left floating bright */
  vec3 fallen = mix(ink, horizon(vUv.x, uT) * 1.9 + .06, smoothstep(.04, .5, fall) * (1. - caught));
  fallen *= mix(1., mix(1., .16, smoothstep(.2, 1., fall)), 1. - caught);
  vec3 col = mix(mix(GROUND, light_, reach), fallen, mark);
  /* triangular dither, the last thing before the screen quantises it */
  col += (h(px * .37 + fract(uT)) + h(px * .71 + fract(uT * 1.3)) - 1.) * 2. / 255.;
  o = vec4(clamp(col, 0., 1.), 1.);
}`
