#!/usr/bin/env bash
# Cloudflare Pages build step for Aquarium World.
# Dashboard settings: Build command `bash cloudflare-build.sh`, Build output directory `aquarium-world`.
# Stamps the release id into the offline cache so installed copies pick up each new version.
# Saves live in each device's own storage and are never touched by a deploy.
set -euo pipefail
VERSION="${CF_PAGES_COMMIT_SHA:-$(date +%s)}"
VERSION="${VERSION:0:12}"
sed -i "s/const VERSION = 'dev'/const VERSION = '${VERSION}'/" aquarium-world/sw.js
grep -q "const VERSION = '${VERSION}'" aquarium-world/sw.js
echo "Aquarium World release ${VERSION} ready in aquarium-world/"
