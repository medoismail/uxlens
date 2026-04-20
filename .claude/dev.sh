#!/bin/bash
cd "$(dirname "$0")/.."
exec /usr/local/bin/node /usr/local/lib/node_modules/npm/bin/npm-cli.js run dev:legacy -- --port 3000
