"""Patch regression with real bundled runtime; never runs the live server."""
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT=Path(__file__).resolve().parent

class HostLayout(unittest.TestCase):
    def test_repeat_patch_preserves_player_flow_and_host_uses_full_width(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            with zipfile.ZipFile(ROOT/'pubbanko_linux_latest.zip') as z:z.extractall(root)
            server=root/'server.js'
            for name in ('integration','player-inactive','player-name','player-board-shop','flex-controls'):
                subprocess.run([sys.executable,str(ROOT/f'patch-{name}.py'),str(server)],check=True,capture_output=True)
            before=server.read_text()
            patch=[sys.executable,str(ROOT/'patch-host-layout.py'),str(server)]
            subprocess.run(patch,check=True,capture_output=True)
            after=server.read_text()
            self.assertEqual(after.count('els.mainGrid.style.gridTemplateColumns = "minmax(0, 1fr)";'),1)
            # Run the actual extracted host function with DOM stand-ins.
            host=re.search(r'function showHostMode\(\) \{.*?\n        \}',after,re.S).group()
            code='const assert=require("node:assert/strict"); const els={};\n'
            for element in ('playerLanding','heroBox','mainGrid','boardShopBox','waitingBox','playerBox','playerView','hostView'):
                code+=f'els.{element}={{style:{{}},classList:{{values:new Set(),add(x){{this.values.add(x)}},remove(x){{this.values.delete(x)}}}}}};\n'
            code+=host+';showHostMode(); assert.equal(els.mainGrid.style.gridTemplateColumns,"minmax(0, 1fr)"); assert(els.playerView.classList.values.has("hidden")); assert(!els.hostView.classList.values.has("hidden"));'
            subprocess.run(['node','-e',code],check=True,capture_output=True)
            # Apart from this single host function, original player code is byte-identical.
            pattern=r'function showHostMode\(\) \{.*?\n        \}'
            self.assertEqual(re.sub(pattern,'HOST',before,flags=re.S),re.sub(pattern,'HOST',after,flags=re.S))
            subprocess.run(patch,check=True,capture_output=True)
            self.assertEqual(server.read_text(),after)

    def test_unknown_input_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            server=Path(tmp)/'server.js';server.write_text('unrecognized runtime')
            r=subprocess.run([sys.executable,str(ROOT/'patch-host-layout.py'),str(server)],capture_output=True)
            self.assertNotEqual(r.returncode,0);self.assertEqual(server.read_text(),'unrecognized runtime')

if __name__=='__main__':unittest.main()
