#!/bin/sh

# Get staged files that are not deleted
files=$(git diff --cached --name-only --diff-filter=ACM)

if [ ! -z "$files" ]; then
  echo "Formatting staged files..."
  # Format the staged files
  echo "$files" | xargs pnpm exec biome format --write --no-errors-on-unmatched
  
  # Re-stage the files
  echo "$files" | xargs git add
fi
