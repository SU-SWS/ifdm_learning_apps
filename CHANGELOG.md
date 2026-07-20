# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Releases are identified by deploy date.

## [2026-07-20]
- TVM text change.

### [2026-07-15]

- TVM interest-rate tab now reports that no meaningful rate could be calculated, instead of a misleading cash-flow-signs error, when the only root falls below the -100% floor (#159).

## [2026-07-10]

First tracked production release. Promotes the accumulated calculator work from
late June through 10 July (PR [#157](https://github.com/SU-SWS/ifdm_learning_apps/pull/157),
`dev` into `1.x`). All blocker and high-priority issues raised during review are resolved.

### Added

- Inline validation and error messaging for the Time Value of Money calculator, per the TVM error document (#134, #146).
- Inline validation and error messaging for the Compounding Frequency calculator (#140).
- Inline validation and error messaging for the Inflation Impact calculator (#141).
- Error states and input standards for the Interest calculator (#142).
- Inline validation and error messaging for the Mortgage v2 calculator (#145).
- Input defaulting for the TVM Present Value, Future Value, and Payment fields so blank fields resolve to sensible defaults (#144).

### Changed

- Interest calculator math, error handling, and layout updated to match spec (#148).
- Compounding Frequency default period changed to Annual (#147).
- Default compounding frequency set for the TVM calculator (#144).
- Color tokens updated and corrected across calculators (#152).
- UI cleanup plus label and punctuation corrections to match design (#134, #148).

### Fixed

- TVM interest-rate solver now returns the correct rate for high-rate and edge-case scenarios (#152).
- TVM interest-rate solver now handles high and mixed-frequency (cross-compounding) rates correctly (#154).
- TVM edge-case math error in the rate calculation (#152).
- TVM zero-rate present value calculation (#144).
- TVM interest-rate calculator correction (#146).
- Inflation Impact currency input no longer corrupts the value when a field is re-edited, and the empty-field error no longer fires at the wrong time (#153).
- Inflation Impact onChange handler now accepts valid entries, including negative values (#151).
- Interest calculator percent edge cases (#156).
- Interest calculator interest-rate calculation (#142).
- All remaining blocker and high-priority issues cleared ahead of the production release (#156).
