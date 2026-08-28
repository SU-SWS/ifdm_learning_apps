// Next ships declarations for `*.module.css` only (node_modules/next/types/global.d.ts),
// so the global stylesheet side-effect import in app/layout.tsx has no declaration.
// TypeScript 6 enables `noUncheckedSideEffectImports` by default and reports that as
// TS2882 — which is why editors bundling TS 6 flag it while `next build` (TS 5.9) does not.
declare module "*.css";
