# dev-server 2.2.1: remove the disabled vendored editor

The official npm `@rspack/dev-server@2.2.1` tarball contains executable `launch-editor@2.14.1`, affected by [GHSA-r825-w8mm-5pxw](https://github.com/vitejs/launch-editor/security/advisories/GHSA-r825-w8mm-5pxw), [GHSA-587h-7wmj-h5pm](https://github.com/vitejs/launch-editor/security/advisories/GHSA-587h-7wmj-h5pm), and [GHSA-698v-4r3x-3vcv](https://github.com/vitejs/launch-editor/security/advisories/GHSA-698v-4r3x-3vcv). An ordinary override cannot replace bundled code.

Checked on 2026-10-24: 2.2.1 is still the latest stable npm release. [Upstream commit 32e0ab4](https://github.com/rstackjs/rspack-dev-server/commit/32e0ab40ed576670dc0f9135338a948c15df955c) updates the source build dependency to 2.14.2, but that does not change the published 2.2.1 artifact. This local patch removes a feature already disabled by the application; it is not a backport of the upstream editor implementation.

The patch makes only two deletions:

- Remove `dist/0~launch-editor.js`, the entire executable editor chunk.
- Remove its sole middleware registration/lazy import from `dist/619.js`.

No replacement JavaScript, editor fork or custom sanitization is added. The patch uses a deleted-file marker for the generated chunk; it does not copy or maintain that implementation. Upstream package metadata/licenses are preserved. The application keeps its explicit editor URL 404 and localhost binding; browser overlays cannot launch a native editor. Serving, HMR, other middleware, and the three build targets remain available.

`pnpm-workspace.yaml` pins `patchedDependencies` to **2.2.1**; `pnpm-lock.yaml` records the registry integrity and patch hash. Normal `pnpm install --frozen-lockfile` applies it, including CI. Unused/failed patch checks are not disabled. Use the declared pnpm version, rather than a package manager that ignores its patches.

To reproduce the edit with [pnpm's official workflow](https://pnpm.io/10.x/cli/patch), extract an unpatched 2.2.1 using `pnpm patch @rspack/dev-server@2.2.1 --ignore-existing`, make the two deletions above, and run `pnpm patch-commit` on its edit directory. Original artifact SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `dist/619.js` | `4fe14743c8501bc3d0639b265071419975190bde6ec185ab7dafd04e53a1f80c` |
| `dist/0~launch-editor.js` | `01ec0e5006999ee4b220c11fe0525cb6df2a94499574572202bfa2aaa6ce429d` |

`test/dev-server.test.ts` verifies both direct and CLI resolutions have no executable editor chunk/references. Real development tests verify the URL remains 404 and stylesheet HMR still works. When an official stable artifact contains the fixed editor, review its bundled code, remove this patch/registration, update the version-bound test, and rerun those checks.
