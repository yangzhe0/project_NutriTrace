"""Install the self-hosted demo. API credentials are accepted only on stdin."""
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

config=json.load(sys.stdin)
release=Path(__file__).resolve().parents[1]
base=Path.home()/'apps'/'shiji-demo'
if not release.is_relative_to(base/'releases'):
    raise SystemExit('Unexpected deployment directory')
current=base/'current'
if current.exists() and not current.is_symlink():
    raise SystemExit('Refusing to replace a non-symlink current directory')
api_key=config.get('key','')
if not api_key:raise SystemExit('Missing API key')
env=os.environ.copy();env['FOODLEDGER_API_KEY']=api_key
subprocess.run(['systemctl','--user','import-environment','FOODLEDGER_API_KEY'],env=env,check=True,capture_output=True)
pending=base/'current.pending'
if pending.is_symlink():pending.unlink()
pending.symlink_to(release,target_is_directory=True)
os.replace(pending,current)
unit_dir=Path.home()/'.config'/'systemd'/'user';unit_dir.mkdir(parents=True,exist_ok=True)
unit=f'''[Unit]
Description=Shiji nutrition demo
After=network-online.target

[Service]
Type=simple
WorkingDirectory={current}
ExecStart=/usr/bin/node {current}/server.cjs
Environment=FOODLEDGER_SERVER_MODE=service
Environment=FOODLEDGER_ROOT={current}
Environment=FOODLEDGER_HOST=0.0.0.0
Environment=FOODLEDGER_PUBLIC_ORIGIN=https://sa.zheoi.com
Environment=FOODLEDGER_PORT=8765
Environment=FOODLEDGER_DEFAULT_ENTRY=demo/index.html
Environment=FOODLEDGER_API_BASE=http://127.0.0.1:8045
Environment=FOODLEDGER_MODEL=gemini-3.8-flash-high
PassEnvironment=FOODLEDGER_API_KEY
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
UMask=0077

[Install]
WantedBy=default.target
'''
(unit_dir/'shiji-demo.service').write_text(unit,encoding='utf-8')
for command in [['systemctl','--user','daemon-reload'],['systemctl','--user','enable','shiji-demo.service'],['systemctl','--user','restart','shiji-demo.service']]:
    subprocess.run(command,check=True,capture_output=True,text=True)
status=None
for _ in range(16):
    try:
        with urllib.request.urlopen('http://10.126.126.2:8765/api/status',timeout=2) as r:status=json.load(r)
        if status.get('configured'):break
    except Exception:pass
    time.sleep(.4)
if not status or not status.get('configured'):raise SystemExit('Service not ready')
print(json.dumps({'service':'shiji-demo.service','url':'https://sa.zheoi.com/','status':status,'release':str(release),'credentialStorage':'systemd user manager memory'},ensure_ascii=False))
