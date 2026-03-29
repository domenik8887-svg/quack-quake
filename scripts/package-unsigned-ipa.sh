#!/usr/bin/env bash
set -euo pipefail

PROJECT_PATH="${PROJECT_PATH:-ios/App/App.xcodeproj}"
SCHEME_NAME="${SCHEME_NAME:-App}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$RUNNER_TEMP/App.xcarchive}"
OUTPUT_DIR="${OUTPUT_DIR:-$PWD/output}"
IPA_NAME="${IPA_NAME:-quack-quake-unsigned.ipa}"

echo "Resolving Swift packages..."
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME_NAME" \
  -resolvePackageDependencies

echo "Archiving iOS app without signing..."
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME_NAME" \
  -configuration Release \
  -destination generic/platform=iOS \
  -archivePath "$ARCHIVE_PATH" \
  archive \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY=""

APP_BUNDLE_PATH="$(find "$ARCHIVE_PATH/Products/Applications" -maxdepth 1 -name '*.app' -print -quit)"

if [[ -z "$APP_BUNDLE_PATH" ]]; then
  echo "Could not find .app bundle in archive output." >&2
  exit 1
fi

PAYLOAD_DIR="$OUTPUT_DIR/Payload"
APP_NAME="$(basename "$APP_BUNDLE_PATH")"

rm -rf "$OUTPUT_DIR"
mkdir -p "$PAYLOAD_DIR"
ditto "$APP_BUNDLE_PATH" "$PAYLOAD_DIR/$APP_NAME"

(
  cd "$OUTPUT_DIR"
  ditto -c -k --sequesterRsrc --keepParent Payload "$IPA_NAME"
)

rm -rf "$PAYLOAD_DIR"

echo "ipa_path=$OUTPUT_DIR/$IPA_NAME" >> "$GITHUB_OUTPUT"
echo "archive_path=$ARCHIVE_PATH" >> "$GITHUB_OUTPUT"
