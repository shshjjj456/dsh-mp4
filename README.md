# dsh-mp4

Play **MP4 / M4V / MOV** videos inside the DeepSeek Harness **right sidebar** — the browser's own video player replaces the "this file type cannot be previewed" placeholder.

## Why this exists

When the pane says *"this file type cannot be previewed / download to view"*, the file is fine. **No renderer claims mp4**, and which preview system opens a file depends on what you have installed:

| Your right column | What opens the file | Before |
|---|---|---|
| `dsh-better-sidebar` installed | its `editor` tab, picking a viewer through `matchFileViewer(path)` | ships markdown / html / jsonl / code only, so mp4 falls through to the catch-all `code` viewer, reads as binary → "cannot be previewed" plus a download link |
| Native DSH sidebar | `@deepseek-ai/dsh-client-ui-sidebar-documentpreview` | mp4 sits in `UNVIEWABLE_BINARY_EXTENSIONS`, matches no renderer → empty state, and not a single byte is read |

This plugin registers with **both**, so one package works on Desktop, plain `dsh web`, and any other profile. The two halves are independent: whichever system is missing simply stays idle instead of failing the plugin.

## Install

Search `dsh-mp4` in the plugin market, or:

```sh
# Desktop users: prefer Settings → Plugins (Desktop runs its own profile)
dsh plugin --profile web add dsh-mp4
dsh plugin --profile <your-profile> add dsh-mp4
