# Quack Quake

Quack Quake is a goofy physics game for iPhone built with Phaser, Matter.js, and Capacitor.
You catapult a rubber duck through stacks of angry toasters, jelly pads, metal beams, and TNT barrels.

## Features

- 6 handmade levels with escalating chaos
- Physics-driven slingshot gameplay using Matter.js
- Persistent level unlocks and best-star tracking in local storage
- iPhone-ready Capacitor wrapper with an Xcode project under `ios/`

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Update the iOS shell

```bash
npm run ios:sync
```

## Free cloud build with GitHub Actions

This repo includes a manual workflow at `.github/workflows/ios-cloud-build.yml`.
It builds an unsigned iOS archive on a GitHub-hosted macOS runner and uploads an unsigned `.ipa` artifact.

### Why this route

- It works with free GitHub Actions usage.
- It avoids paid Apple signing setup inside CI.
- The resulting `.ipa` is meant for Windows sideload tools such as Sideloadly, which can re-sign the IPA with your Apple ID.

### How to use it

1. Push this project to a GitHub repository.
2. Open the repo on GitHub.
3. Go to `Actions`.
4. Open `Build Unsigned iOS IPA`.
5. Click `Run workflow`.
6. Download the `quack-quake-unsigned-ipa` artifact when the run finishes.

### Important limits

- On GitHub, standard runners are free in public repos.
- On private repos, GitHub Free includes monthly free minutes, and macOS runners consume those minutes faster than Linux runners.
- The workflow is manual on purpose so you do not burn free minutes on every push.
- The IPA from this workflow is unsigned for distribution. For sideloading, sign/install it afterwards with a tool like Sideloadly on Windows.

### Sideload reminder

- A free Apple ID sideload is typically time-limited and needs refreshing.
- Bundle identifiers may need to change during sideload signing depending on your tool and Apple account limits.

## Build the IPA on macOS

1. Open `ios/App/App.xcodeproj` in Xcode on a Mac.
2. Set your Apple signing team and bundle settings.
3. Choose an iPhone device or archive target.
4. Run `Product > Archive`.
5. Export the archive as an `.ipa`.

## Notes

- This Windows environment can generate the full iOS project, but Apple signing and final `.ipa` export require Xcode on macOS.
- The game is optimized for landscape play, but the Capacitor shell still supports rotation.
