import re
s=open('mushroom.html').read()
for name,f in (('SCENE','scene.glsl'),('GLYPH','glyph.glsl')):
    src=open(f).read()
    s=re.sub(r'var '+name+r' = `.*?`;', lambda m:'var '+name+' = `'+src+'`;', s, flags=re.S)
s=s.replace('Math.round(Math.max(W, H) / 150)','Math.round(Math.max(W, H) / 150)')
s=s.replace('Math.min(1, 900 / Math.max(W, H))','Math.min(1, 1100 / Math.max(W, H))')
open('mushroom.html','w').write(s)
