#!/bin/bash
# Launch AI cockpit

source "$HOME/_/.env.local/bin/activate"
python3 "$HOME/_/ai/ai.py" "$@"
node "$HOME/_/ai/ai.js" "$@"
