#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 awardsapp
#
# rebrand-from-tambo.sh
# ---------------------
# Re-applies the awardsapp tambo→genui rebrand transformations.
#
# Use cases:
#   1. Resolve conflicts during `git rebase upstream/main` — pass the conflict
#      file list to apply rebrand sed on top of upstream `--ours` resolutions.
#   2. After a fresh clone of upstream tambo: bulk-apply rebrand to all files.
#
# This script is the single source of truth for what "rebrand" means.
# Update HERE when adding new rename rules; do not encode rules in ad-hoc
# rebase resolutions.
#
# Usage:
#   scripts/rebrand-from-tambo.sh [--all | --conflicts | --files FILE...]
#
# Modes:
#   --all          Apply to all files matching tracked patterns (json, ts, tsx,
#                  mjs, js, mdx) — used after fresh clone for full rebrand.
#   --conflicts    Apply to files currently in `git status` UU conflict state —
#                  used during rebase. Caller is responsible for prior
#                  `git checkout --ours` on each conflict.
#   --files F...   Apply to specific files (whitespace-separated list).
#
# Skipped paths (preserved verbatim):
#   - **/LICENSE, **/NOTICE, **/CHANGELOG.md (attribution/licence)
#   - README.md (top-level only — sub-package READMEs are rebranded)
#   - scripts/rebrand-from-tambo.sh (this script — must not self-mutate)
#
# IMPORTANT: Search patterns are base64-encoded so this script is INVISIBLE
# to its own transformations. The decoded patterns below are tambo identifiers;
# the encoded form prevents the script from mutating its own sed rules when
# inadvertently included in --all or git ls-files output.

set -euo pipefail

readonly SCRIPT_NAME="$(basename "$0")"
readonly REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
readonly SCRIPT_REL_PATH="scripts/rebrand-from-tambo.sh"

# ---- Decoded transformation tokens (base64-protected from self-mutation) ----

# Decode each token at script start so they're held in vars (not literals).
# This means the literal "tambo" strings never appear in the script source,
# so the script cannot rebrand itself even if accidentally included.

readonly TOK_TAMBO_AI_CLOUD_SCOPE=$(printf '%s' 'QHRhbWJvLWFpLWNsb3VkLw==' | base64 -d)            # @tambo-ai-cloud/
readonly TOK_TAMBO_AI_SCOPE=$(printf '%s' 'QHRhbWJvLWFpLw==' | base64 -d)                          # @tambo-ai/
readonly TOK_TAMBO_REPO_GIT=$(printf '%s' 'dGFtYm8tYWkvdGFtYm9cLmdpdA==' | base64 -d)              # tambo-ai/tambo\.git
readonly TOK_TAMBO_REPO=$(printf '%s' 'Z2l0aHViLmNvbS90YW1iby1haS90YW1ibw==' | base64 -d)          # github.com/tambo-ai/tambo
readonly TOK_TAMBO_CO=$(printf '%s' 'aHR0cHM6Ly90YW1ib1wuY28=' | base64 -d)                        # https://tambo\.co
readonly TOK_TAMBO_NAME_QUOTED=$(printf '%s' 'Im5hbWUiOiAidGFtYm8i' | base64 -d)                   # "name": "tambo"
readonly TOK_CREATE_TAMBO_QUOTED=$(printf '%s' 'Im5hbWUiOiAiY3JlYXRlLXRhbWJvLWFwcCI=' | base64 -d) # "name": "create-tambo-app"
readonly TOK_CREATE_TAMBO=$(printf '%s' 'Y3JlYXRlLXRhbWJvLWFwcA==' | base64 -d)                    # create-tambo-app
readonly TOK_TAMBO_AI_API=$(printf '%s' 'VGFtYm8gQUkgQVBJ' | base64 -d)                            # Tambo AI API
readonly TOK_TAMBO_AI_DOCS=$(printf '%s' 'VGFtYm8gQUkgZG9jdW1lbnRhdGlvbg==' | base64 -d)           # Tambo AI documentation
readonly TOK_TAMBO_CLOUD=$(printf '%s' 'VGFtYm8gQ2xvdWQ=' | base64 -d)                             # Tambo Cloud
readonly TOK_TAMBO_CLI=$(printf '%s' 'VGFtYm8gQ0xJ' | base64 -d)                                   # Tambo CLI
readonly TOK_NEW_TAMBO_APP=$(printf '%s' 'bmV3IFRhbWJvIGFwcGxpY2F0aW9u' | base64 -d)               # new Tambo application
readonly TOK_TAMBO_PREFIX=$(printf '%s' 'VEFNQk9f' | base64 -d)                                    # TAMBO_
readonly TOK_NEXT_PUBLIC_TAMBO=$(printf '%s' 'TkVYVF9QVUJMSUNfVEFNQk9f' | base64 -d)               # NEXT_PUBLIC_TAMBO_

# ---- Apply transformation to a single file ----------------------------------

apply_rebrand_to_file() {
    local file="$1"

    # Skip attribution/licence files
    case "$file" in
        */LICENSE|*/NOTICE|*/CHANGELOG.md|LICENSE|NOTICE|CHANGELOG.md|README.md)
            return 0
            ;;
        "$SCRIPT_REL_PATH"|"./$SCRIPT_REL_PATH"|*"/$SCRIPT_REL_PATH")
            # Never rebrand this script itself
            return 0
            ;;
    esac

    # Skip non-existent files (deleted in current state)
    [[ -f "$file" ]] || return 0

    # Apply transformations (BSD/macOS sed syntax).
    # NPM scope renames first (most specific), then identifiers, then env vars.
    # All env vars use a single TAMBO_ → GENUI_ prefix substitution which
    # covers TAMBO_API_KEY, TAMBO_SERVER_URL, TAMBO_WHITELABEL_ORG_NAME, etc.
    sed -i '' \
        -e "s|${TOK_TAMBO_AI_CLOUD_SCOPE}|@workspace-cloud/|g" \
        -e "s|${TOK_TAMBO_AI_SCOPE}|@workspace/|g" \
        -e "s|${TOK_TAMBO_REPO_GIT}|awardsapp/tambo-genui.git|g" \
        -e "s|${TOK_TAMBO_REPO}|github.com/awardsapp/tambo-genui|g" \
        -e "s|${TOK_TAMBO_CO}|https://genui.co|g" \
        -e "s|${TOK_TAMBO_NAME_QUOTED}|\"name\": \"genui\"|g" \
        -e "s|${TOK_CREATE_TAMBO_QUOTED}|\"name\": \"create-genui-app\"|g" \
        -e "s|${TOK_CREATE_TAMBO}|create-genui-app|g" \
        -e "s|${TOK_TAMBO_AI_API}|Genui AI API|g" \
        -e "s|${TOK_TAMBO_AI_DOCS}|Genui AI documentation|g" \
        -e "s|${TOK_TAMBO_CLOUD}|Genui Cloud|g" \
        -e "s|${TOK_TAMBO_CLI}|Genui CLI|g" \
        -e "s|${TOK_NEW_TAMBO_APP}|new Genui application|g" \
        -e "s|${TOK_NEXT_PUBLIC_TAMBO}|NEXT_PUBLIC_GENUI_|g" \
        -e "s|${TOK_TAMBO_PREFIX}|GENUI_|g" \
        "$file"

    return 0
}

# ---- Mode dispatchers --------------------------------------------------------

mode_all() {
    local count=0
    cd "$REPO_ROOT"

    # Find all candidate files using git ls-files (respects .gitignore)
    while IFS= read -r file; do
        case "$file" in
            *.json|*.ts|*.tsx|*.mjs|*.js|*.mdx|*.md|*.yml|*.yaml)
                apply_rebrand_to_file "$file"
                count=$((count + 1))
                ;;
        esac
    done < <(git ls-files)

    echo "Applied rebrand to $count files"
    return 0
}

mode_conflicts() {
    local count=0
    cd "$REPO_ROOT"

    # Find UU conflicts; caller must have done `git checkout --ours` first
    while IFS= read -r file; do
        apply_rebrand_to_file "$file"
        git add "$file"
        count=$((count + 1))
    done < <(git status --porcelain | grep '^UU' | awk '{print $2}')

    echo "Applied rebrand to $count conflict files (and staged)"
    return 0
}

mode_files() {
    local count=0
    cd "$REPO_ROOT"

    for file in "$@"; do
        apply_rebrand_to_file "$file"
        count=$((count + 1))
    done

    echo "Applied rebrand to $count specified files"
    return 0
}

# ---- Main --------------------------------------------------------------------

main() {
    if [[ $# -lt 1 ]]; then
        cat <<EOF
Usage: $SCRIPT_NAME [--all | --conflicts | --files FILE...]

Modes:
  --all          Apply rebrand to ALL tracked source files (post-fresh-clone).
  --conflicts    Apply to git UU conflict files (during rebase). Run after
                 'git checkout --ours' on each conflict file.
  --files F ...  Apply to specific files.

Examples:
  # Initial fresh-clone rebrand:
  $SCRIPT_NAME --all && git add -A && git commit -m "rebrand: tambo → genui"

  # During rebase conflict resolution:
  for f in \$(git status --porcelain | grep '^UU' | awk '{print \$2}'); do
      git checkout --ours "\$f"
  done
  $SCRIPT_NAME --conflicts
  git rebase --continue

This script is self-protected via base64-encoded search patterns: it never
mutates its own source even if accidentally included in --all output.
EOF
        return 1
    fi

    local mode="$1"
    shift

    case "$mode" in
        --all)
            mode_all
            ;;
        --conflicts)
            mode_conflicts
            ;;
        --files)
            mode_files "$@"
            ;;
        *)
            echo "Error: unknown mode '$mode'" >&2
            return 1
            ;;
    esac

    return 0
}

main "$@"
