/* LabSubjects: procedural source images for the ASCII + gradient lab. All original, nothing traced.
   A buffer holds four Float32Arrays of width*height, row 0 at the top, all values 0-1:
     lum   luminance
     hint  soft colour position along LabPalette.arc
     edge  line strength (subject's own lines combined with Sobel on lum)
     mask  subject silhouette (1 inside, 0 background)
   Usage: var b = LabSubjects.create(cols, rows, cellAspect); LabSubjects.fill('mushroom', b, t);
   cellAspect is cell width / height (default 1), so a 120x50 grid of tall glyph cells stays undistorted.
   Cost is per pixel, so fill at grid size, or under about 320x200 per frame. Plain script, no deps. */
(function (root) {
  'use strict';

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(a, b, x) { x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x); }
  function mix(a, b, t) { return a + (b - a) * t; }

  /* value noise on a fixed seeded table */
  var PERM = new Float32Array(512);
  (function () {
    var s = 1234567;
    for (var i = 0; i < 512; i++) { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; PERM[i] = (s >> 8 & 0xffff) / 65535; }
  })();
  function cellHash(i, j) { return PERM[((i & 255) + PERM[j & 255] * 255 | 0) & 511]; }
  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    var a = cellHash(xi, yi), b = cellHash(xi + 1, yi), c = cellHash(xi, yi + 1), d = cellHash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct) {
    var v = 0, amp = 0.5, tot = 0;
    for (var i = 0; i < oct; i++) { v += amp * noise(x, y); tot += amp; x = x * 2.03 + 17.1; y = y * 2.01 + 9.2; amp *= 0.5; }
    return v / tot;
  }

  function create(width, height, cellAspect) {
    var n = width * height;
    return {
      width: width, height: height, cellAspect: cellAspect || 1,
      lum: new Float32Array(n), hint: new Float32Array(n), edge: new Float32Array(n), mask: new Float32Array(n)
    };
  }

  /* one shaded sample; subjects write here rather than allocating per pixel */
  var P = { lum: 0, hint: 0, edge: 0, mask: 0 };
  function over(a, lum, hint, edge) {
    P.lum += (lum - P.lum) * a; P.hint += (hint - P.hint) * a; P.edge += (edge - P.edge) * a;
  }

  /* Walk the buffer with x in [-aspect, aspect], y in [-1, 1] up. `fit` is the half width the subject needs. */
  function sweep(buf, fit, pixel) {
    var w = buf.width, h = buf.height, asp = w * buf.cellAspect / h;
    var s = Math.max(1, fit / asp), i = 0;
    for (var row = 0; row < h; row++) {
      var y = (1 - (row + 0.5) / h * 2) * s;
      for (var col = 0; col < w; col++, i++) {
        var x = ((col + 0.5) / w * 2 - 1) * asp * s;
        pixel(x, y);
        buf.lum[i] = clamp01(P.lum); buf.hint[i] = clamp01(P.hint);
        buf.edge[i] = clamp01(P.edge); buf.mask[i] = clamp01(P.mask);
      }
    }
  }

  /* Merge Sobel on lum into edge, scaled so the result holds across resolutions. */
  function addEdges(buf) {
    var w = buf.width, h = buf.height, L = buf.lum, E = buf.edge, k = h * 0.018;
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1, i = y * w + 1; x < w - 1; x++, i++) {
        var gx = L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - 1] - L[i + w - 1];
        var gy = L[i + w - 1] + 2 * L[i + w] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - w] - L[i - w + 1];
        var m = Math.sqrt(gx * gx + gy * gy) * k * 0.25;
        if (m > E[i]) E[i] = m > 1 ? 1 : m;
      }
    }
  }

  /* ---- mushroom ---------------------------------------------------------------------------
     Three-quarter view from below: a domed cap behind an elliptical gill plate, a curved stem, a dark
     bank of earth, and a warm light behind it all. Translucency comes from brightness rising toward
     every silhouette edge; the cap margin carries a cerulean rim. */
  function mushroom(buf, t) {
    var tilt = -0.17 + 0.018 * Math.sin(t * 0.31);
    var ct = Math.cos(tilt), st = Math.sin(tilt);
    var cx = 0.1, cy = 0.2, a = 1.24, b = 0.76, c = 0.37;
    var glowX = 0.62 + 0.05 * Math.sin(t * 0.17), glowY = 0.5 + 0.04 * Math.cos(t * 0.13);
    /* gill count follows resolution, so a coarse glyph grid gets lines rather than moire */
    var GILLS = Math.max(20, Math.min(64, Math.round(buf.height * 0.36))), TAU = Math.PI * 2;

    sweep(buf, 1.48, function (x, y) {
      /* background: warm bloom behind the cap, cooler toward the corners */
      var dx = x - glowX, dy = y - glowY, d2 = dx * dx * 0.5 + dy * dy * 0.8;
      var cloud = fbm(x * 0.9 + t * 0.012, y * 0.9, 3);
      var bloom = Math.exp(-d2 * 1.1);
      var bgL = 0.1 + 0.5 * bloom + 0.12 * (cloud - 0.5);
      var bgH = 0.68 + 0.3 * bloom + 0.1 * (cloud - 0.5);
      /* bokeh */
      var bx = x * 2.2 + 40, by = y * 2.2 + 40, bi = Math.floor(bx), bj = Math.floor(by);
      var seed = cellHash(bi, bj);
      if (seed > 0.62) {
        var ox = bi + 0.25 + 0.5 * cellHash(bj + 7, bi), oy = bj + 0.25 + 0.5 * cellHash(bi + 3, bj);
        var br = 0.09 + 0.16 * seed, bd = Math.sqrt((bx - ox) * (bx - ox) + (by - oy) * (by - oy));
        bgL += 0.07 * smooth(br, br - 0.05, bd) * (0.6 + 0.4 * Math.sin(t * 0.4 + seed * 40));
      }
      P.lum = bgL; P.hint = bgH; P.edge = 0; P.mask = 0;

      /* drifting spores */
      var sx = x * 7 + 0.3 * Math.sin(t * 0.2), sy = y * 7 + t * 0.12, si = Math.floor(sx), sj = Math.floor(sy);
      if (cellHash(si + 11, sj + 5) > 0.93) {
        var fx = sx - si - 0.5, fy = sy - sj - 0.5;
        if (fx * fx + fy * fy < 0.012) { P.lum += 0.35; P.edge = 0.8; }
      }

      /* local cap frame */
      var rx = x - cx, ry = y - cy, u = rx * ct - ry * st, v = rx * st + ry * ct;

      /* stem, behind the gill plate's front edge only where it meets it */
      var sv = -v, sxC = 0.12 * sv - 0.2 * sv * sv;
      var sw = 0.15 + 0.03 * sv + 0.13 * smooth(0.8, 1.45, sv) + 0.12 * smooth(0.3, 0.0, sv);
      var k = (u - sxC) / sw;

      /* earth */
      var ground = -0.86 + 0.11 * (noise(x * 1.1 + 3, 2.5) - 0.5) + 0.12 * Math.sin(x * 0.8 + 1) - 0.14 * x * 0.5;
      var ga = smooth(0.03, -0.03, y - ground);
      if (ga > 0) {
        var soil = fbm(x * 9, y * 9, 2);
        over(ga, 0.03 + 0.1 * soil * soil, 0.9 - 0.15 * soil, smooth(0.6, 0.75, soil) * 0.5);
      }

      if (sv > -0.05 && sv < 1.55 && Math.abs(k) < 1.1) {
        var sa = smooth(1, 0.9, Math.abs(k)) * smooth(-0.05, 0.02, sv) * smooth(1.55, 1.42, sv);
        var ribs = noise(k * 6 + 11, sv * 1.4);
        var kk = k * k;
        var sl = 0.24 + 0.5 * kk * kk + 0.16 * (ribs - 0.5) + 0.12 * smooth(0.7, 0.1, sv);
        var sh = 0.6 + 0.13 * sv - 0.14 * kk + 0.04 * (ribs - 0.5);
        over(sa, sl, sh, smooth(0.8, 1, Math.abs(k)) * 0.7);
        P.mask = Math.max(P.mask, sa);
      }

      /* cap: dome behind, gill plate in front; both foreshortened ellipses sharing a margin */
      var q = Math.atan2(v / c, u / a);
      var lobes = 1 + 0.016 * Math.sin(q * 7 + 1.3) + 0.01 * Math.sin(q * 15 + 0.4);
      var ua = u / (a * lobes), vc = v / (c * lobes), vb = v / (b * lobes);
      var plateR2 = ua * ua + vc * vc, domeR2 = ua * ua + vb * vb;

      if (v > -0.02 && domeR2 < 1.12) {
        var dr = Math.sqrt(domeR2);
        var da = smooth(1.012, 0.988, dr) * smooth(-0.02, 0.0, v);
        var apexA = Math.atan2(u, v + 0.42);
        var n = fbm(u * 2.4 + 5, v * 3.8, 3);
        var stria = 0.5 + 0.5 * Math.sin(apexA * GILLS * 1.1 + n * 7);
        var thin = dr * dr * dr;
        var dl = 0.17 + 0.42 * thin * thin + 0.07 * (stria - 0.5) + 0.34 * (n - 0.5)
          + 0.3 * smooth(-0.4, 1.1, u) * thin;
        var dh = 0.27 + 0.16 * n + 0.1 * smooth(-0.8, 0.9, u);
        var de = stria * stria * 0.25 + 0.9 * smooth(0.965, 0.995, dr);
        /* the bright outline of the dome reads cool */
        var fringe = smooth(0.94, 0.995, dr);
        dh = mix(dh, 0.2, fringe); dl = Math.max(dl, 0.62 * fringe + dl * (1 - fringe));
        over(da, dl, dh, de);
        P.mask = Math.max(P.mask, da);
      }

      if (plateR2 < 1.15) {
        var r = Math.sqrt(plateR2);
        var pa = smooth(1.006, 0.994, r);
        var theta = Math.atan2(vc, ua);
        var warp = noise(r * 2 + 2, theta * 1.5 + 8) - 0.5;
        var ph = (theta / TAU + 0.5) * GILLS + warp * 0.8 * r;
        var g1 = Math.abs(ph - Math.floor(ph) - 0.5) * 2;           /* full gills */
        var ph2 = ph * 2 + 0.25, g2 = Math.abs(ph2 - Math.floor(ph2) - 0.5) * 2; /* short gills, margin only */
        var fine = smooth(0.42, 0.72, r);
        var gill = Math.max(smooth(0.1, 0.62, g1), fine * smooth(0.25, 0.8, g2) * 0.75);
        gill = mix(0.45, gill, smooth(0.1, 0.34, r));   /* lines merge into a dark hub at the stem */
        var depth = Math.pow(r, 1.7);
        var lightSide = smooth(-1.0, 1.0, ua);
        var pl = (0.08 + 0.5 * depth + 0.2 * lightSide * depth) * (0.34 + 0.66 * gill);
        pl += 0.42 * smooth(0.74, 1.0, r) * (0.35 + 0.65 * gill) * (0.45 + 0.55 * lightSide);
        var ph3 = 0.78 - 0.1 * depth + 0.05 * (gill - 0.5) - 0.2 * smooth(0.8, 0.98, r);
        var pe = (1 - gill) * smooth(0.14, 0.4, r);
        /* the stem root sits in front of the near half of the plate */
        var rootTop = 0.02 * (1 - k * k) - 0.05;
        var rootA = smooth(1.05, 0.72, Math.abs(k)) * smooth(0.05, -0.1, v - rootTop);
        var rootL = 0.1 + 0.26 * smooth(0, 0.34, -v) + 0.16 * k * k;
        over(pa, mix(pl, rootL, rootA), mix(ph3, 0.68, rootA), mix(pe, 0.15, rootA));
        P.mask = Math.max(P.mask, pa);

        /* margin: thin translucent lip, hotter on the near edge and light side */
        var grad = Math.sqrt(ua * ua / (a * a) + vc * vc / (c * c)) / Math.max(r, 0.001);
        var dist = (r - 1) / Math.max(grad, 0.001);
        var rim = Math.exp(-(dist * dist) / (0.021 * 0.021));
        var nearSide = smooth(0.3, -0.25, vc);
        var rimL = rim * (0.45 + 0.55 * nearSide) * (0.65 + 0.35 * lightSide);
        P.lum += rimL * (1.1 - P.lum);
        P.hint += (0.09 - P.hint) * rim;
        P.edge = Math.max(P.edge, rim);
        P.mask = Math.max(P.mask, rim);
      }
    });
    addEdges(buf);
    return buf;
  }

  /* ---- tides: flowing bands of light -------------------------------------------------------- */
  function tides(buf, t) {
    sweep(buf, 1, function (x, y) {
      var w = fbm(x * 0.55 + t * 0.04, y * 0.8 - t * 0.03, 2) * 2;
      var flow = y * 5.2 + w * 2.8 + Math.sin(x * 1.15 + t * 0.22) * 1.1 + t * 0.32;
      var band = 0.5 + 0.5 * Math.sin(flow);
      var swell = 0.5 + 0.5 * Math.sin(x * 0.7 - y * 0.5 + w * 1.4 - t * 0.15);
      var crest = Math.pow(band, 14);
      P.lum = band * band * (0.28 + 0.55 * swell) + crest * 0.45;
      P.hint = 0.6 + 0.42 * Math.sin(y * 1.7 + x * 0.8 + w * 1.5 + t * 0.09);
      P.edge = crest;
      P.mask = smooth(0.14, 0.42, P.lum);
    });
    addEdges(buf);
    return buf;
  }

  /* ---- shapes: ○ > _ --------------------------------------------------------------------- */
  function shade(d, x, y, t) {
    var a = smooth(0.012, -0.012, d);
    var glow = Math.exp(-Math.max(d, 0) * 6);
    var run = 0.5 + 0.5 * Math.sin(x * 1.6 - y * 1.1 + t * 0.6);
    P.lum = a * (0.6 + 0.4 * run) + (1 - a) * glow * 0.34;
    P.hint = 0.56 + 0.42 * Math.sin(x * 0.9 - y * 0.75 + t * 0.2);
    P.edge = Math.exp(-(d * d) / (0.022 * 0.022));
    P.mask = a;
  }
  function segment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, h = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
    var ex = px - ax - dx * h, ey = py - ay - dy * h;
    return Math.sqrt(ex * ex + ey * ey);
  }
  function ring(buf, t) {
    sweep(buf, 0.86, function (x, y) { shade(Math.abs(Math.sqrt(x * x + y * y) - 0.62) - 0.12, x, y, t); });
    addEdges(buf);
    return buf;
  }
  function chevron(buf, t) {
    sweep(buf, 0.86, function (x, y) {
      shade(Math.min(segment(x, y, -0.34, 0.6, 0.34, 0), segment(x, y, 0.34, 0, -0.34, -0.6)) - 0.12, x, y, t);
    });
    addEdges(buf);
    return buf;
  }
  function bar(buf, t) {
    sweep(buf, 0.96, function (x, y) { shade(segment(x, y, -0.68, -0.34, 0.68, -0.34) - 0.12, x, y, t); });
    addEdges(buf);
    return buf;
  }

  /* ---- wordmark: PROTO in the monospace stack ----------------------------------------------- */
  var FONT = 'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace';
  var wordCache = {};
  function wordCover(w, h, cellAspect) {
    var key = w + 'x' + h + '@' + cellAspect;
    if (wordCache[key]) return wordCache[key];
    var out = { sharp: new Float32Array(w * h), soft: new Float32Array(w * h) };
    wordCache[key] = out;
    if (typeof document === 'undefined') return out;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var cx = cv.getContext('2d', { willReadFrequently: true });
    var visW = w * cellAspect, size = 100;
    function draw(blur) {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, w, h);
      cx.setTransform(1 / cellAspect, 0, 0, 1, w / 2, h / 2);
      cx.filter = blur ? 'blur(' + blur + 'px)' : 'none';
      cx.font = '700 ' + size + 'px ' + FONT;
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillStyle = '#fff';
      cx.fillText('PROTO', 0, 0);
      var d = cx.getImageData(0, 0, w, h).data;
      return d;
    }
    cx.font = '700 100px ' + FONT;
    size = Math.min(100 * visW * 0.88 / cx.measureText('PROTO').width, h * 0.62);
    var d = draw(0), i;
    for (i = 0; i < w * h; i++) out.sharp[i] = d[i * 4 + 3] / 255;
    d = draw(Math.max(1, size * 0.1));
    for (i = 0; i < w * h; i++) out.soft[i] = d[i * 4 + 3] / 255;
    return out;
  }
  function wordmark(buf, t) {
    var w = buf.width, h = buf.height, cover = wordCover(w, h, buf.cellAspect), asp = w * buf.cellAspect / h;
    var i = 0, sweepX = Math.sin(t * 0.35) * asp * 1.1;
    for (var row = 0; row < h; row++) {
      var y = 1 - (row + 0.5) / h * 2;
      for (var col = 0; col < w; col++, i++) {
        var x = ((col + 0.5) / w * 2 - 1) * asp;
        var s = cover.sharp[i], soft = cover.soft[i], dx = x - sweepX;
        var light = Math.exp(-dx * dx * 1.6);
        buf.lum[i] = clamp01(s * (0.62 + 0.38 * light) + (1 - s) * soft * (0.22 + 0.2 * light) + 0.035 * noise(x * 2, y * 2 + t * 0.05));
        buf.hint[i] = clamp01(0.5 + 0.46 * x / Math.max(asp, 0.001) + 0.08 * Math.sin(y * 2 + t * 0.2));
        buf.edge[i] = 0;
        buf.mask[i] = s;
      }
    }
    addEdges(buf);
    return buf;
  }

  /* ---- field: soft noise clouds ------------------------------------------------------------- */
  function field(buf, t) {
    sweep(buf, 1, function (x, y) {
      var w = fbm(x * 0.8 - t * 0.03, y * 0.8 + t * 0.02, 2);
      var n = fbm(x * 1.2 + w * 1.6 + t * 0.05, y * 1.2 - w * 1.6, 4);
      var v = smooth(0.34, 0.68, n);
      P.lum = v * v * 0.85;
      P.hint = 0.58 + 0.9 * (fbm(x * 0.5 + 9, y * 0.5 + t * 0.03, 2) - 0.5) + 0.2 * (v - 0.5);
      P.edge = 0;
      P.mask = smooth(0.25, 0.55, v);
    });
    addEdges(buf);
    return buf;
  }

  var subjects = {
    mushroom: mushroom, tides: tides, ring: ring, chevron: chevron, bar: bar, wordmark: wordmark, field: field
  };

  function fill(name, buf, t) {
    if (!subjects[name]) throw new Error('LabSubjects: no subject "' + name + '"');
    return subjects[name](buf, t || 0);
  }

  /* toRGBA(buf, out?): Uint8Array packing lum, hint, edge, mask into R, G, B, A for texImage2D (row 0 on top). */
  function toRGBA(buf, out) {
    var n = buf.width * buf.height;
    out = out || new Uint8Array(n * 4);
    for (var i = 0, j = 0; i < n; i++, j += 4) {
      out[j] = buf.lum[i] * 255; out[j + 1] = buf.hint[i] * 255;
      out[j + 2] = buf.edge[i] * 255; out[j + 3] = buf.mask[i] * 255;
    }
    return out;
  }

  root.LabSubjects = {
    names: Object.keys(subjects), create: create, fill: fill, toRGBA: toRGBA,
    mushroom: mushroom, tides: tides, ring: ring, chevron: chevron, bar: bar, wordmark: wordmark, field: field,
    noise: noise, fbm: fbm, smooth: smooth
  };
})(typeof window !== 'undefined' ? window : globalThis);
