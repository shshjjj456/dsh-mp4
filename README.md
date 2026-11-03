# dsh-mp4

在 DeepSeek Harness 的右栏里**直接播放** MP4 / M4V / MOV，用浏览器原生的播放器替掉那句「此文件类型不支持预览」。

English | [English](README.en.md)

## 它解决什么

右栏显示「此文件类型不支持预览 / 下载查看」时，文件并没有坏，只是**没有任何渲染器认领 mp4**。Harness 里有两套并存的预览系统，谁在管事取决于你装了什么：

| 你的右栏 | 谁在打开文件 | 原来的表现 |
|---|---|---|
| 装了 `dsh-better-sidebar` | 它的 `editor` tab，按 `matchFileViewer(path)` 选 viewer | 内置只有 markdown / html / jsonl / code 四个 viewer，mp4 落到兜底的 `code`，读出来是二进制 → 「不支持预览」+ 下载链接 |
| 原生右栏（没装 better-sidebar） | `@deepseek-ai/dsh-client-ui-sidebar-documentpreview` | mp4 在 `UNVIEWABLE_BINARY_EXTENSIONS` 名单里，无匹配渲染器 → 空状态，连一个字节都不读 |

这个插件对**两套系统各注册一次**，所以同一份包在 Desktop、`dsh web`、任何 profile 里都能用。两条注册彼此独立，缺哪套系统另一半就安静地不激活，不会让插件起不来。

## 安装

插件市场里搜 `dsh-mp4`，或者命令行：

```sh
# Desktop 用户：优先在 App 的 Settings → Plugins 里装，Desktop 用的是它自己的 profile
dsh plugin --profile web add dsh-mp4       # 普通 dsh web
dsh plugin --profile <你的 profile> add dsh-mp4
```

或者装本地目录（开发用）：

```
plugin_manager install_bundle  <该目录的绝对路径>
```

装完刷新一次页面。已经打开的旧标签页要重新点开文件（或点编辑器工具栏的刷新），因为 tab 自己缓存了「读不出来」的旧状态。

## 支持什么

| 后缀 | 支持 | 说明 |
|---|---|---|
| `.mp4` `.m4v` | ✅ | H.264 + AAC 最稳；HEVC/H.265 取决于平台与硬件解码 |
| `.mov` | ✅ | QuickTime 与 MP4 同为 ISO BMFF 容器，H.264 能播；ProRes / DNxHD 播不了 |
| `.webm` `.ogv` | ❌ | Chromium 本身支持，只是本插件没有声明——见下方「扩展」 |
| `.mkv` `.avi` `.wmv` `.flv` `.ts` | ❌ | Chromium 不支持这些容器，加扩展名也没用，需要转封装或 MSE demuxer |
| `.mp3` `.m4a` `.wav` `.flac` | ❌ | 需要走 `<audio>` 而不是 `<video>` |

两个容易踩的点：

1. **匹配只看后缀，不看编码。** 一个 `.mp4` 里如果是 HEVC 或奇怪的封装，照样会失败——失败会显示说明，不会静默黑屏。
2. **能不能播由 Chromium 决定，不由插件决定。** 插件只做三件事：认领后缀、拿到字节、交给原生播放器。

## 已知限制

- **整段字节先进内存。** better-sidebar 的 `/sidebar/file` 路由不返回 `Accept-Ranges` / `206`，所以拖动进度要等下载完成；几 MB 的短片没感觉，几百 MB 的长片会慢。真正的流式要宿主那条路由支持 Range。
- 走 DSH 原生文档预览时，受 `@deepseek-ai/dsh-api-workspace-files` 的 `maxFileBytes` 限制（默认 32 MiB）。
- 不做转码、不做缩略图、不做编辑。

## 卸载

在插件市场 / 插件管理页里卸载即可。插件只做客户端注册（槽位、文件 viewer、文案字典），全部挂在 `ctx.effect` 的清理函数上，卸载时随之注销；不写配置文件、不注册宿主路由、不落任何状态文件，所以卸完不留东西。

如果你在 better-sidebar 的设置页里手动关过这个 viewer，那条 `viewersEnabled` 记录会留在它的偏好文件里（一个布尔值，没有任何效果）。

## 扩展

想加格式只改一处：`client.js` 里的

```js
const EXTENSIONS = ['mp4', 'm4v', 'mov'];
const MEDIA_TYPES = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime' };
```

`webm` / `ogv` 加进去就能用（Chromium 原生支持）；音频格式需要把播放器换成 `<audio>`；`mkv` / `avi` / `ts` 是另一回事，要宿主 ffmpeg 转封装或前端 MSE demux。

## 结构

| 文件 | 作用 |
|---|---|
| `index.js` | Host 半边：空的 `apply`，bundle patch 需要一行 Host 插件 |
| `client.js` | 浏览器半边：两套注册 + 播放器组件 |
| `cordis.patch.yml` | bundle patch，插入 `dsh-mp4` 行 |
| `locale/{zh,en}.json` | 插件管理页/市场卡片的标题与描述 |
| `icon.svg` | 插件图标 |

运行时依赖全部由宿主提供：`slots`、`locale`，以及**可选**的 `betterSidebar` / `documentPreviews`。

## License

MIT
