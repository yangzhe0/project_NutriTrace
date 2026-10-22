"""Keep the readable text companion synchronized with the print proposal."""
from html.parser import HTMLParser
import re

class CopyParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.out=[]
        self.skip=0
        self.table=False
        self.cells=0
        self.row=0

    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if self.skip:
            if tag not in ['img','br','hr','input']:self.skip+=1
            return
        if any(c in attrs.get('class','').split() for c in ['chapter','references-area']):
            self.skip=1
            return
        if tag=='table':self.table=True;self.row=0;self.out.append('\n\n')
        elif tag=='tr':self.out.append('\n| ');self.cells=0
        elif tag in ['h1','h2','h3']:self.out.append('\n\n'+'#'*int(tag[1])+' ')
        elif tag in ['p','div','figure','section'] and not self.table:self.out.append('\n\n')
        elif tag=='br':self.out.append(' / ' if self.table else '\n')

    def handle_endtag(self,tag):
        if self.skip:self.skip-=1;return
        if tag in ['td','th']:self.out.append(' | ');self.cells+=1
        elif tag=='tr':
            self.out.append('\n')
            if self.row==0:self.out.append('| '+' | '.join('---' for _ in range(self.cells))+' |\n')
            self.row+=1
        elif tag=='table':self.table=False;self.out.append('\n\n')
        elif tag in ['h1','h2','h3','p','div','figure','section'] and not self.table:self.out.append('\n\n')

    def handle_data(self,data):
        if not self.skip:self.out.append(data)

def sync(root,document,sources):
    parts=[]
    for main in re.findall(r'<main>(.*?)</main>',document,re.S):
        parser=CopyParser();parser.feed(main)
        parts.append(re.sub(r'\n[ \t]*\n(?:[ \t]*\n)+','\n\n',''.join(parser.out)).strip())
    assert len(parts)==4
    parts[-1]+='\n\n## 参考文献与公开资料\n\n'+'\n\n'.join(f'[{n}] [{title}]({url})' for n,(title,url) in sources.items())+'\n\n在线体验：https://sa.zheoi.com/\n'
    (root/'docs/proposal.md').write_text('\n\n<!-- PAGE -->\n\n'.join(parts)+'\n',encoding='utf-8')
