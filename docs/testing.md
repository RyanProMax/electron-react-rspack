# Test coverage and boundaries

The regression suite has several layers. A stubbed successful `quitAndInstall` assertion does not establish that macOS accepts or installs an update.

| Command / layer | Assertions | Boundary |
| --- | --- | --- |
| `pnpm test:unit` — 31 cases | URL/options/source policy; listener ownership; IPC-before-window ordering; window close cancellation/reopen; Store/theme payloads; updater check timeout/rejection/error, confirmation, progress, direct Abort, completion/cancel/dispose races, late events, once-only install call and cleanup. | Electron windows, shell and updater are stubs. |
| `pnpm build` | Production `electron-main`, `electron-preload`, `web`, shared outputs and source maps. | Compilation is separate from runtime checks. |
| `pnpm analyze` | All three targets and offline Rsdoctor HTML/JSON reports. | Duplicate-package and intentional side-effect diagnostics remain visible; no benchmark claim. |
| `pnpm test:e2e` — 18 cases selected | Six existing smoke cases, seven window/IPC/visual cases and four local-transport cases, plus a development-only case. Mac production runs 16 and skips the development command and packaged LaunchServices cases. | Other OSes skip the four MacUpdater probes and packaged LaunchServices case. Linux xvfb also skips native min/max because it has no window manager. |
| `pnpm test:e2e:dev` | Development main build, real HTTP pages/preload/Arco/theme/About, editor URL 404, the same applicable window/IPC/transport checks, and real README commands/HMR in a temporary source copy. Mac runs 17 and skips packaged LaunchServices. | Stylesheet edits affect only the copy; the marker assertion verifies no document reload. Main/preload changes still require restart. |
| `pnpm package:smoke` then `pnpm test:e2e:packaged` | A distinct Mac app ID/name, current-architecture ZIP and app, `--publish never`, signing identity null. All 13 smoke/window cases run against the packaged executable, including same-PID LaunchServices reopen. | No `/Applications` install, physical Dock click, signing/notarization or native update installation. |

## Real renderer and window checks

Managed renderer calls exercise Store get/set, package metadata, About, theme broadcasts, Close, Minimize, Maximize and Quit. Quit is cancelled once by `before-quit`, checked for continued IPC operation, then allowed to exit its isolated app. Home Close also really exits its own test process. Native tests assert minimum dimensions, a resize event, size clamping, minimize/maximize toggling and restore. Existing smoke coverage cancels About close and reopens it.

A real unmanaged BrowserWindow loads the production preload and attempts privileged IPC: invokes reject, sends have no window/quit/theme/shell effects. A real cross-origin iframe has neither its own preload bridge nor access to the parent's bridge. Main-side rejection with that real child-frame identity uses explicitly synthetic events; it is not presented as actual iframe IPC. Shell opening is stubbed so no untrusted URL is opened.

Home and About switch light → dark → light across windows. Native screenshots cover normal/minimum window sizes and 125% Electron page zoom; tests wait for theme transitions. Native `capturePage` avoids CDP screenshot clipping at non-default page zoom. Screenshots and display metadata are retained for review; this is not a pixel-baseline comparison.

Mac visual review used one 1920×1080 display with a 1× scale factor. Home controls remain readable in both themes; at constrained About zoom its content scrolls to the footer. Page zoom does not validate Retina DPI changes or moving between monitors. Those need suitable hardware. LaunchServices uses the isolated packaged app's exact bundle path and verifies the original process reopens Home; it does not synthesize an `activate` event or claim a physical Dock click.

## Update layers

`test/lifecycle.test.ts` drives the product's real orchestration code with a stub updater. It covers checking → available → authorized confirmation → progress → downloaded → one install-method call; negative confirmation/source/payload, direct Abort, failure, timeout, late events, cancellation/completion races and disposal are separate assertions.

`e2e/local-update.spec.ts` builds a separate temporary Electron app from `update-probe.ts`. The real MacUpdater parser and Electron HTTP transport read a loopback-only feed and download a throttled fixture ZIP. Four scenarios verify success plus SHA-512, metadata 404, checksum failure, and cancellation after progress. Per-test user/cache paths are temporary. Native Squirrel, install, quit/relaunch methods are guarded, and every case asserts zero native install calls. The fixture is not an installable application; these probes are not an end-to-end product update UI or installation test.

The Mac test machine has no valid code-signing identities. Developer ID signing, notarization, signed installer trust and real installation/restart remain unverified. Tests do not create/import certificates, alter system security, contact the production update feed, publish releases or overwrite an installed user app.

## Checks and artifacts

Lint and `pnpm typecheck` are required. The source check uses `skipLibCheck`; strict `pnpm exec tsc --noEmit --incremental false` currently reports 36 errors in upstream declarations (Arco/React 19, b-validate, semver and resize-observer-polyfill), with none in repository source. Strict checking is not reported as passing.

CI runs lint/build/source typecheck/unit/production Electron tests on macOS, Windows and Linux. macOS additionally runs development/HMR and isolated packaging checks. `test-results/` and `playwright-report/` are uploaded for review. Test outputs, local app/ZIP artifacts, reports and screenshots are ignored by Git. Local code checks do not replace the exact-commit CI result.
