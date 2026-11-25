#!/usr/bin/env python3
"""Persistent unbuffered JSON-RPC SQLite3 bridge for Cloudflare D1 local/test emulation."""
import json
import sqlite3
import sys

db_path = sys.argv[1] if len(sys.argv) > 1 else ':memory:'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
conn.execute('PRAGMA foreign_keys = ON;')

while True:
    line = sys.stdin.readline()
    if not line:
        break
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        op = req.get('op')
        sql = req.get('sql', '')
        params = req.get('params', [])
        if op == 'exec':
            conn.executescript(sql)
            conn.commit()
            resp = {'ok': True}
        elif op == 'all':
            cur = conn.execute(sql, params)
            rows = [dict(r) for r in cur.fetchall()]
            resp = {'ok': True, 'results': rows}
        elif op == 'first':
            cur = conn.execute(sql, params)
            row = cur.fetchone()
            resp = {'ok': True, 'result': dict(row) if row is not None else None}
        elif op == 'run':
            cur = conn.execute(sql, params)
            conn.commit()
            resp = {'ok': True, 'meta': {'changes': cur.rowcount, 'last_row_id': cur.lastrowid}}
        else:
            resp = {'ok': False, 'error': f'Unknown op: {op}'}
    except Exception as exc:
        resp = {'ok': False, 'error': str(exc)}
    sys.stdout.write(json.dumps(resp) + '\n')
    sys.stdout.flush()
