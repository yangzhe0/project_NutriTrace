"""Rebuild proposal HTML, four-page PDF, text and reference pages."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
for command in [[sys.executable,'tools/build_proposal.py'],['node','tools/render_proposal.cjs'],[sys.executable,'tools/build_support.py']]:
    subprocess.run(command,cwd=root,check=True)
