#!/usr/bin/env bash
# Provide Chromium's system libraries without root on the self-hosted runner.
#
# `playwright install --with-deps` needs sudo, which the pve-ci runner does not
# grant. Instead, ask Playwright which apt packages this distro needs, download
# them unprivileged with `apt-get download`, unpack them into a per-version
# directory under $HOME (persistent on the self-hosted runner), and expose the
# libraries through LD_LIBRARY_PATH for the rest of the job.
#
# Run after `playwright install chromium`; fails if any library is still missing.
set -euo pipefail

playwright="./node_modules/.bin/playwright"
version=$("$playwright" --version | awk '{print $2}')
# The runner keeps $HOME across OS upgrades, so key the unpacked libraries by
# distro release and architecture too, not only by Playwright version.
# shellcheck source=/dev/null
os_release=$(. /etc/os-release; printf '%s-%s' "$ID" "$VERSION_ID")
deps_dir="$HOME/.cache/ms-playwright-deps/$version-$os_release-$(dpkg --print-architecture)"

if [ ! -f "$deps_dir/.complete" ]; then
  packages=$("$playwright" install-deps --dry-run chromium \
    | sed -n 's/.*--no-install-recommends \([^"]*\).*/\1/p')
  if [ -z "$packages" ]; then
    echo "Could not read Chromium dependency list from 'playwright install-deps --dry-run'" >&2
    exit 1
  fi

  download_dir="${RUNNER_TEMP:-/tmp}/playwright-debs"
  rm -rf "$download_dir" "$deps_dir"
  mkdir -p "$download_dir" "$deps_dir"
  # shellcheck disable=SC2086 # word-splitting the package list is intended
  (cd "$download_dir" && apt-get download $packages)
  for deb in "$download_dir"/*.deb; do
    dpkg-deb -x "$deb" "$deps_dir"
  done
  touch "$deps_dir/.complete"
fi

lib_path="$deps_dir/usr/lib/x86_64-linux-gnu:$deps_dir/lib/x86_64-linux-gnu"

shell_binary=$(find "$HOME/.cache/ms-playwright" -type f -path '*/chrome-headless-shell-linux64/chrome-headless-shell' | head -n 1)
if [ -z "$shell_binary" ]; then
  echo "chrome-headless-shell not found under ~/.cache/ms-playwright; run 'playwright install chromium' first" >&2
  exit 1
fi
missing=$(LD_LIBRARY_PATH="$lib_path" ldd "$shell_binary" | grep 'not found' || true)
if [ -n "$missing" ]; then
  echo "Chromium still has unresolved libraries:" >&2
  echo "$missing" >&2
  exit 1
fi

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "LD_LIBRARY_PATH=$lib_path${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" >> "$GITHUB_ENV"
fi
echo "Chromium system libraries ready: $lib_path"
