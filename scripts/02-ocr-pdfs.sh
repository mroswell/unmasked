#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

OUT_DIR=public/documents
mkdir -p "$OUT_DIR"

# Process each PDF in raw/
count=0
for entry in $(jq -r '.[] | select(.ext == "pdf") | .id' raw/manifest.json); do
  IN_PATH="raw/$entry.pdf"
  OUT_PDF="$OUT_DIR/$entry.pdf"
  OUT_TXT="$OUT_DIR/$entry.txt"

  # Idempotent: if both outputs exist and source is unchanged, skip
  if [[ -f "$OUT_PDF" ]] && [[ -f "$OUT_TXT" ]] && [[ "$IN_PATH" -ot "$OUT_PDF" ]]; then
    echo "  [skip] $entry (already processed)"
    continue
  fi

  echo "  [ocr] $entry"
  # --skip-text: leave already-text PDFs alone (testimonies are usually native-text)
  # --sidecar: emit text to a separate file
  # --quiet: suppress most output
  ocrmypdf --skip-text --sidecar "$OUT_TXT" --quiet "$IN_PATH" "$OUT_PDF"
  count=$((count + 1))
done

echo "Processed $count PDFs."
