#!/usr/bin/env bash
# Prepare the self-hosted runner for oven-sh/setup-bun without root.
#
# The pve-ci runner has no `unzip` and no sudo, and it keeps $HOME between
# jobs. This script:
#   1. removes non-executable leftovers at ~/.bun/bin/{bun,bunx} (including
#      broken symlinks) so setup-bun does not reuse a stale binary, and
#   2. installs a Python-backed `unzip` on PATH that handles the
#      `unzip -o -q archive.zip` call @actions/tool-cache makes and keeps the
#      Unix mode bits stored in the archive (the bun binary must stay +x).
#
# Every self-hosted job runs it once, right before setup-bun.
set -euo pipefail

for bun_binary in "$HOME/.bun/bin/bun" "$HOME/.bun/bin/bunx"; do
  if { [ -e "$bun_binary" ] || [ -L "$bun_binary" ]; } && [ ! -x "$bun_binary" ]; then
    rm -f -- "$bun_binary"
  fi
done

unzip_dir="${RUNNER_TEMP}/unzip-shim"
mkdir -p "$unzip_dir"
cat > "$unzip_dir/unzip" <<'PY'
#!/usr/bin/env python3
import os, sys, zipfile

arguments = [argument for argument in sys.argv[1:] if argument not in {"-o", "-q"}]
if len(arguments) != 1:
    raise SystemExit("usage: unzip -o -q archive.zip")

extracted_entries = []
with zipfile.ZipFile(arguments[0]) as archive:
    for member in archive.infolist():
        extracted_path = archive.extract(member)
        if member.create_system == 3:
            permissions = (member.external_attr >> 16) & 0o777
            extracted_entries.append((extracted_path, permissions))

for extracted_path, permissions in extracted_entries:
    os.chmod(extracted_path, permissions)
PY
chmod +x "$unzip_dir/unzip"
echo "$unzip_dir" >> "$GITHUB_PATH"
