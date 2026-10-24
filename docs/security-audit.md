# Dependency security review

Checked against main `cba6095` on 2026-10-24. GitHub had 16 open Dependabot alerts (6 high, 8 medium, 2 low); a fresh `pnpm audit --json` independently reported the same 16 advisory/version findings. The updated lockfile reports 0 known advisories. This is a dependency-advisory result, not a claim that all application or vendored code has been security audited. GitHub evaluates the default branch: this PR does not dismiss alerts or claim they are closed before merge and refresh.

## Findings and treatment

All 16 GitHub alerts label their manifest scope as development because this repository declares Electron and its build tools under devDependencies. That label alone does not determine runtime exposure: Electron is the shipped runtime, and electron-store/AJV code is bundled into main.

| GitHub alerts | Package and baseline | Advisory | Updated branch / treatment |
| --- | --- | --- | --- |
| #274, #272 | electron 44.4.5 | [eMudhra certificate mitigation](https://github.com/electron/electron/security/advisories/GHSA-jr5w-w6x2-84p9), [pointer-lock frame attribution](https://github.com/electron/electron/security/advisories/GHSA-x562-297c-g43g) | electron 44.9.3, within the existing major. Minimum requested version is 44.9.1; no Electron 45 migration. |
| #283, #282 | undici 7.30.0 / 6.29.0 | [content-encoding DoS](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c) | 7.30.1 / 6.29.1, preserving each consumer's major. |
| #281, #280 | undici 7.30.0 / 6.29.0 | [EventSource memory DoS](https://github.com/nodejs/undici/security/advisories/GHSA-4qv8-2p9j-2685) | Same patched versions. |
| #279 | undici 7.30.0 | [SRI algorithm bypass](https://github.com/nodejs/undici/security/advisories/GHSA-f72v-6w45-q472) | 7.30.1. |
| #278, #277, #276, #275 | fast-uri 3.1.8 | [scheme spoofing](https://github.com/fastify/fast-uri/security/advisories/GHSA-w74x-v6f9-j3xg), [relative path equivalence](https://github.com/fastify/fast-uri/security/advisories/GHSA-xhq7-xmqj-769h), [host confusion](https://github.com/fastify/fast-uri/security/advisories/GHSA-wjr9-j795-jxcr), [suffix scheme injection](https://github.com/fastify/fast-uri/security/advisories/GHSA-333x-w4r6-6crp) | Existing override updated to 3.1.9. |
| #273 | body-parser 1.20.8 | [compressed body DoS](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828) | Old Express/webpack-dev-server chain removed by the supported Rspack 2 dev server. No body-parser package remains in the lockfile. |
| #271, #270, #269 | launch-editor 2.14.1 | [CLI flag interpretation](https://github.com/vitejs/launch-editor/security/advisories/GHSA-r825-w8mm-5pxw), [Windows existence check](https://github.com/vitejs/launch-editor/security/advisories/GHSA-587h-7wmj-h5pm), [Windows percent escaping](https://github.com/vitejs/launch-editor/security/advisories/GHSA-698v-4r3x-3vcv) | The standalone dependency leaves the lockfile, **but dev-server 2.2.1 still vendors this version**. Its browser-to-editor middleware is removed and its URL explicitly returns 404, verified by development smoke. Host is localhost. This mitigates the reachable path; the vendored code itself awaits an upstream update. |
| #261 | http-cache-semantics 4.2.0 | [max-stale shared-cache disclosure](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) | Compatible 4.3.0 update lies outside the published affected range `<=4.2.0`. The advisory lists no patched version and [the maintainer disputes it](https://github.com/kornelski/http-cache-semantics/issues/56#issuecomment-5975759591). This is reported as a version-range resolution, **not an independently verified upstream security fix**. No alert is dismissed. |

## Dependency paths and actual use

- `electron -> @electron/get@5 -> undici@7`: Electron binary installation/download. `electron-builder -> app-builder-lib -> @electron/rebuild -> node-gyp -> undici@6`: native rebuild/download tooling. The scoped overrides do not replace Electron's embedded Node/Chromium dependencies.
- `electron-store -> conf -> AJV -> fast-uri` is bundled main-process schema/config parsing; build loaders and app-builder-lib also use AJV. External links use the built-in URL parser and a separate validated policy, not fast-uri.
- Before migration: `@rspack/cli -> @rspack/dev-server@1 -> webpack-dev-server -> express -> body-parser`, plus launch-editor. These serve development only. The replacement dev server's vendored editor endpoint is explicitly disabled; opening a source file in a local editor from the browser is unavailable, while page serving and HMR remain available.
- `electron-builder -> app-builder-lib -> @electron/get@3 -> got@11 -> cacheable-request -> http-cache-semantics`: packaging-time download tooling. The advisory describes reuse across users in a shared HTTP cache; the application does not expose such a shared caching proxy. The 4.3.0 override remains within got/cacheable-request's compatible 4.x range.

## Coverage and remaining limits

`pnpm audit` is not GitHub code scanning or secret scanning. The code-scanning API returned `404: no analysis found`; secret scanning is disabled on this repository. No scanner settings were changed, no secrets were displayed, and no credentials were rotated. Existing deprecated dependency notices are not suppressed and were not used as a reason for unrelated major upgrades.

The existing follow-redirects 1.16.1 security override remains intact. The lockfile was updated normally, not deleted. Signed installers, real update downloads/installation, and exploit reproduction against real external services are outside this verification. Rsdoctor duplicate-package and intentional environment-side-effect diagnostics are build-analysis warnings, not the dependency advisories above.
