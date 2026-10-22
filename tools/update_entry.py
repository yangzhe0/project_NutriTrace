"""Update the proposal entry and regenerate its QR SVG without credentials."""
from pathlib import Path
import json
import sys
from reportlab.graphics import renderSVG
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode.qr import QrCodeWidget

root=Path(__file__).resolve().parents[1]
url=sys.argv[1] if len(sys.argv)>1 else 'https://sa.zheoi.com/'
config=json.loads((root/'project.config.json').read_text(encoding='utf-8'))
config['experience_url']=url
(root/'project.config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
qr=QrCodeWidget(url,barLevel='M')
x0,y0,x1,y1=qr.getBounds()
size=480
d=Drawing(size,size,transform=[size/(x1-x0),0,0,size/(y1-y0),-x0,-y0])
d.add(qr)
renderSVG.drawToFile(d,str(root/'assets/demo-access-qr.svg'))
print('Entry and QR SVG updated:',url)
