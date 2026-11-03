# dsh-mp4

Play MP4, M4V and MOV videos **inside the DSH right sidebar**, with the browser's own video player instead of the “this file type cannot be previewed” placeholder.

[中文](README.md) | English

## What it fixes

When the pane says “this file type cannot be previewed / download to view”, the file is fine — **no renderer claims mp4**. DSH ships two preview systems side by side, and which one owns your right column depends on what you installed:

| Your right column | Who opens the file | Before |
|---|---|---|
| `dsh-better-sidebar` installed | its `editor` tab, picking a viewer via `matchFileViewer(path)` | ships markdown / html / jsonl / code only; mp4 falls through to the catch-all `code` viewer, reads as binary → “cannot be previewed” + a download link |
| Native DSH sidebar | `@deepseek-ai/dsh-client-ui-sidebar-documentpreview` | mp4 sits in `UNVIEWABLE_BINARY_EXTENSIONS`, matches no renderer → empty state, not a byte read |

This plugin registers with **both**, so one package works on Desktop, `dsh web`, and any other profile. The two halves are independent: whichever system is missing simply stays idle instead of failing the whole plugin.

## Install

Search `dsh-mp4` in the plugin market, or:

```sh
# Desktop users: prefer the app's Settings → Plugins (Desktop owns its own profile)
dsh plugin --profile web add dsh-mp4
dsh plugin --profile <your-profile> add dsh-mp4
```

Refresh the page once afterwards. A tab that was already open keeps its cached “unreadable” state — reopen the file, or hit the refresh button in the editor toolbar.

## Format support

| Suffix | Supported | Notes |
|---|---|---|
| `.mp4` `.m4v` | ✅ | H.264 + AAC is the safe case; HEVC/H.265 depends on platform and hardware decode |
| `.mov` | ✅ | QuickTime is ISO BMFF like MP4, so H.264 plays; ProRes / DNxHD does not |
| `.webm` `.ogv` | ❌ | Chromium supports them; this plugin simply does not declare them |
| `.mkv` `.avi` `.wmv` `.flv` `.ts` | ❌ | Chromium cannot demux these containers — renaming will not help; needs remuxing or an MSE demuxer |
| `.mp3` `.m4a` `.wav` `.flac` | ❌ | Needs an `<audio>` player instead of `<video>` |

Two things worth knowing: matching is **by suffix, not by codec** (an HEVC `.mp4` still fails, with an explanation rather than a black frame), and **playability belongs to Chromium** — the plugin only claims the suffix, reads the bytes, and hands them to the native element.

## Known limits

- **Whole file in memory.** better-sidebar's `/sidebar/file` route answers without `Accept-Ranges` / `206`, so seeking waits for the download to finish. Fine for a few MB, slow for hundreds.
- On the native DSH path the read is capped by `@deepseek-ai/dsh-api-workspace-files` `maxFileBytes` (32 MiB by default).
- No transcoding, no thumbnails, no editing.

## Uninstall

Remove it from the market or the plugin manager. Every registration (slots, the file viewer, the copy dictionary) is owned by a `ctx.effect` cleanup, so it disappears with the plugin; nothing is written to config, no host route is registered, no state file is left behind.

If you switched this viewer off by hand in better-sidebar's settings, that one `viewersEnabled` boolean stays in its preferences — inert.

## Extending

One place: `EXTENSIONS` and `MEDIA_TYPES` in `client.js`. `webm` / `ogv` work as soon as they are listed; audio needs an `<audio>` element; `mkv` / `avi` / `ts` need host-side ffmpeg remuxing or a browser-side MSE demuxer.

## Structure

| File | Role |
|---|---|
| `index.js` | Host half: an empty `apply`; the bundle patch needs a Host row |
| `client.js` | Browser half: both registrations plus the player component |
| `cordis.patch.yml` | Bundle patch inserting the `dsh-mp4` row |
| `locale/{zh,en}.json` | Title and description for the plugin page and market card |
| `icon.svg` | Plugin icon |

Everything it needs at runtime comes from the host: `slots`, `locale`, and optionally `betterSidebar` / `documentPreviews`.

## License

MIT
