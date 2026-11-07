/* LabPalette: BU Proto colours, OKLCH mixing, and the cerulean > iris > rose > peach arc.
   All rgb triples are floats 0-1 in sRGB unless a name says bytes. Plain script, no deps. */
(function (root) {
  'use strict';

  var colors = {
    harbor: '#061a2e', raised: '#0b2a46', raisedHi: '#123a5c', frost: '#f6fbff',
    cerulean: '#1a8fc0', lagoon: '#3fb8d0', sky: '#7cc7f4',
    iris: '#b6aaff', irisDeep: '#7a6ee0',
    rose: '#f4a2c0', raspberry: '#c2407a',
    peach: '#f8928a', haze: '#cec1be', mint: '#9df0a8'
  };

  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function toHex(rgb) {
    var s = '#';
    for (var i = 0; i < 3; i++) s += ('0' + Math.round(clamp01(rgb[i]) * 255).toString(16)).slice(-2);
    return s;
  }
  function toCss(rgb, a) {
    var r = Math.round(clamp01(rgb[0]) * 255), g = Math.round(clamp01(rgb[1]) * 255), b = Math.round(clamp01(rgb[2]) * 255);
    return a === undefined ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function resolve(c) { return typeof c === 'string' ? hexToRgb(colors[c] || c) : c; }

  function s2l(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function l2s(c) { return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }

  function toOklch(c) {
    var rgb = resolve(c), r = s2l(rgb[0]), g = s2l(rgb[1]), b = s2l(rgb[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [L, Math.sqrt(A * A + B * B), Math.atan2(B, A)]; /* hue in radians */
  }

  function linFromLch(L, C, h) {
    var A = C * Math.cos(h), B = C * Math.sin(h);
    var l = L + 0.3963377774 * A + 0.2158037573 * B;
    var m = L - 0.1055613458 * A - 0.0638541728 * B;
    var s = L - 0.0894841775 * A - 1.291485548 * B;
    l = l * l * l; m = m * m * m; s = s * s * s;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ];
  }
  function fromOklch(lch) {
    var C = lch[1], lin = linFromLch(lch[0], C, lch[2]);
    /* out of gamut: pull chroma in rather than clip, so hue holds */
    for (var i = 0; i < 12; i++) {
      if (Math.min(lin[0], lin[1], lin[2]) >= -0.001 && Math.max(lin[0], lin[1], lin[2]) <= 1.001) break;
      C *= 0.92;
      lin = linFromLch(lch[0], C, lch[2]);
    }
    return [l2s(clamp01(lin[0])), l2s(clamp01(lin[1])), l2s(clamp01(lin[2]))];
  }

  /* mix(a, b, t): a, b are colour names, hex strings or rgb triples; interpolates in OKLCH, shortest hue. */
  function mix(a, b, t) {
    var p = toOklch(a), q = toOklch(b), d = q[2] - p[2];
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    return fromOklch([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + d * t]);
  }

  /* Pink-weighted: blue-to-violet is the short leg, rose owns the most room. */
  var arcStops = [[0, 'cerulean'], [0.32, 'iris'], [0.7, 'rose'], [1, 'peach']];
  var ARC_N = 1024, arcTable = new Float32Array((ARC_N + 1) * 3);
  (function () {
    for (var i = 0; i <= ARC_N; i++) {
      var t = i / ARC_N, k = 0;
      while (k < arcStops.length - 2 && t > arcStops[k + 1][0]) k++;
      var a = arcStops[k], b = arcStops[k + 1], rgb = mix(a[1], b[1], (t - a[0]) / (b[0] - a[0]));
      arcTable.set(rgb, i * 3);
    }
  })();

  /* arc(t): rgb 0-1 for t 0-1, from a 1024-step table, safe for per-cell use. */
  function arc(t) {
    var i = Math.round(clamp01(t) * ARC_N) * 3;
    return [arcTable[i], arcTable[i + 1], arcTable[i + 2]];
  }

  /* lut(n): Uint8Array RGBA of n texels along the arc, for a WebGL ramp (n x 1). */
  function lut(n) {
    n = n || 256;
    var out = new Uint8Array(n * 4);
    for (var i = 0; i < n; i++) {
      var c = arc(i / (n - 1));
      out[i * 4] = Math.round(c[0] * 255); out[i * 4 + 1] = Math.round(c[1] * 255);
      out[i * 4 + 2] = Math.round(c[2] * 255); out[i * 4 + 3] = 255;
    }
    return out;
  }

  /* cssLut(n): array of n 'rgb()' strings, for canvas 2D fillStyle without per-cell string building. */
  function cssLut(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(toCss(arc(i / (n - 1))));
    return out;
  }

  root.LabPalette = {
    colors: colors, arcStops: arcStops, hexToRgb: hexToRgb, toHex: toHex, toCss: toCss, resolve: resolve,
    toOklch: toOklch, fromOklch: fromOklch, mix: mix, arc: arc, lut: lut, cssLut: cssLut
  };
})(typeof window !== 'undefined' ? window : globalThis);
