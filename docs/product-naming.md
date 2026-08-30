# Feishin Product Naming

## Scope

Future packaged applications and release artifacts use the public product name `Feishin`.
The fork and authentication implementation remain identifiable through repository metadata,
version suffixes, and internal application identity rather than binary filenames.

## Requirements

- **PN-1:** Every Electron builder configuration uses `Feishin` as `productName` and
  `Feishin-${version}-${os}-${arch}.${ext}` as its artifact template.
- **PN-2:** The packaged executable, installer shortcuts, uninstall entry, tray tooltip,
  ZIP files, and installer files use `Feishin` without `BasicAuth` in their names.
- **PN-3:** Preserve `eu.remaxku.feishin.basicauth` as the Electron `appId`,
  `feishin-basic-auth` as the package/repository identity, and the existing GitHub updater
  owner/repository. Continue using the existing `Feishin BasicAuth` user-data directory so
  saved servers, safeStorage credentials, settings, and playback state survive the rename.
  These stable identities allow an existing installation to upgrade.
- **PN-4:** Release validation rejects packaged `.exe`, `.zip`, and `.blockmap` assets whose
  names contain `BasicAuth` or do not begin with `Feishin-`.
- **PN-5:** Release documentation points to the renamed assets beginning with the first
  renamed prerelease.

## Acceptance Criteria

1. The naming contract test passes for the default, alpha, and beta builder configurations.
2. A full Windows package build produces only `Feishin-*` release assets and a packaged
   `Feishin.exe`.
3. `latest.yml` uses the architecture-neutral `Feishin-<version>-win.exe` update path.
4. Installing the renamed x64 package over the current installation retains application
   settings and does not leave a second runnable product installation.
