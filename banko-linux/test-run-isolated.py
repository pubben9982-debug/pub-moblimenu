"""Execute copied run.sh twice; dependencies reused read-only, loopback only."""
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT=Path(__file__).resolve().parent
if __name__=='__main__':
    dependency_runtime=Path(sys.argv[1]).resolve()
    with tempfile.TemporaryDirectory(prefix='banko-run-isolated-') as tmp:
        root=Path(tmp)/'banko';root.mkdir();bindir=Path(tmp)/'bin';bindir.mkdir()
        for path in ROOT.iterdir():
            if path.is_file():shutil.copyfile(path,root/path.name)
        # npm is substituted only to reuse installed packages, no install/network.
        npm=bindir/'npm';npm.write_text('#!/bin/sh\nln -s "$TEST_NODE_MODULES" node_modules\n');npm.chmod(0o700)
        preload=Path(tmp)/'loopback.cjs'
        preload.write_text("const net=require('node:net');const listen=net.Server.prototype.listen;net.Server.prototype.listen=function(...args){if(typeof args[1]==='string')args[1]='127.0.0.1';else if(typeof args[0]==='object')args[0].host='127.0.0.1';return listen.apply(this,args)};")
        with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
        env=dict(os.environ,PATH=str(bindir)+':'+os.environ['PATH'],TEST_NODE_MODULES=str(dependency_runtime/'node_modules'),
                 NODE_OPTIONS='--require='+str(preload),BANKO_PORT=str(port),BARTENDER_PIN='TEST-ONLY',
                 BANKO_GIFTCARD_PILOT='0',BANKO_BUDGET_SHADOW='0')
        before=None
        for iteration in range(2):
            with (Path(tmp)/f'run-{iteration}.log').open('w') as log:
                proc=subprocess.Popen(['/bin/bash',str(root/'run.sh')],env=env,stdout=log,stderr=log)
                try:
                    for _ in range(200):
                        if proc.poll() is not None:raise AssertionError('test run.sh exited: '+(Path(tmp)/f'run-{iteration}.log').read_text())
                        try:
                            with urllib.request.urlopen(f'http://127.0.0.1:{port}/health',timeout=.2) as response:health=json.load(response)
                            break
                        except OSError:time.sleep(.05)
                    else:raise AssertionError('test runtime did not become ready')
                    assert health['players']==0
                    snapshot=((root/'runtime/.build-stamp').read_bytes(),(root/'runtime/server.js').stat().st_mtime_ns)
                    if before is not None:assert snapshot==before,'second run rebuilt unchanged runtime'
                    before=snapshot
                    assert not (root/'data/giftcard-prizes.json').exists()
                finally:proc.terminate();proc.wait(timeout=5)
        print('PASS run.sh: real build/host patch, loopback health, second start without rebuild, no giftcard payout. npm dependency installation substituted with existing read-only modules.')
