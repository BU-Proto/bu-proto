import re,json
src=open('/Users/cjxsez/Desktop/bu-proto/src/ascii-field/colormap.ts').read()
body=src[src.index('previewRows(['):]
rows=re.findall(r"'([0-9a-f]{288})'",body)
assert len(rows)==30,len(rows)
open('index.html','w').write(open('template.html').read().replace('__ROWS__',json.dumps(rows)))
