window.__ModuleLoader__.load({
  id: 'dsh-mp4',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** This package's copy namespace inside the Client locale service. */
    const NS = 'dsh-mp4';

    /**
     * Identity of the renderer inside the Host's document-preview registry.
     * The same string is the body's key in the keyed `sidebar.right.tab.document`
     * slot, because the pane passes `entryKey: selected.id`.
     */
    const HOST_RENDERER_ID = 'dsh-mp4/video';

    /**
     * Identity of the file viewer inside the Better Sidebar registry, whose
     * editor tab is what actually opens a file path in this deployment.
     */
    const SIDEBAR_VIEWER_ID = 'dsh-mp4:video';

    /** Suffixes this plugin claims. Extensions are lowercase, without a dot. */
    const EXTENSIONS = ['mp4', 'm4v', 'mov'];

    /** Blob media type per suffix; a `<video>` needs a type it can decode. */
    const MEDIA_TYPES = {
      mp4: 'video/mp4',
      m4v: 'video/mp4',
      mov: 'video/quicktime',
    };

    const dictionary = {
      zh: {
        title: '视频',
        preview: '视频预览：{name}',
        unsupported: '视频预览需要完整文件内容。',
        decoding: '正在准备视频…',
        fetchFailed: '读取视频失败：{message}',
        failed:
          '这个视频无法在浏览器里解码。它可能使用了当前不支持的编码（例如 H.265/HEVC），或者文件已损坏。',
      },
      en: {
        title: 'Video',
        preview: 'Video preview: {name}',
        unsupported: 'Video preview requires the complete file contents.',
        decoding: 'Preparing video…',
        fetchFailed: 'Could not read the video: {message}',
        failed:
          'This video cannot be decoded in the browser. It may use an unsupported codec (for example H.265/HEVC), or the file is damaged.',
      },
    };

    /**
     * Fill `{name}` placeholders the way the host dictionaries expect.
     * @param template - dictionary string.
     * @param vars - values for its placeholders.
     * @returns the rendered string.
     */
    function format(template, vars) {
      return String(template).replace(/\{(\w+)\}/gu, (match, key) =>
        vars !== undefined && key in vars ? String(vars[key]) : match,
      );
    }

    /**
     * Resolve copy through a locale-bound translate, falling back to the built-in
     * English dictionary so a missing namespace can never blank the preview.
     * @param t - translate supplied by the slot or the viewer host.
     * @param key - dictionary key.
     * @param vars - placeholder values.
     * @returns the localized line.
     */
    function copy(t, key, vars) {
      if (typeof t === 'function') {
        try {
          const value = t(key, vars);
          if (typeof value === 'string' && value.length > 0 && value !== key) return value;
        } catch {
          /* fall through to the built-in dictionary */
        }
      }
      return format(dictionary.en[key] ?? key, vars);
    }

    /** Final path segment of a path or a `dsh-resource://file/…` address. */
    function fileNameOf(address) {
      const raw = String(address ?? '').split('?')[0].split('#')[0];
      const segment = raw.replaceAll('\\', '/').split('/').pop() ?? raw;
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    }

    /** Lowercased suffix without the dot; `''` when the name has none. */
    function suffixOf(name) {
      const dot = name.lastIndexOf('.');
      return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
    }

    /** Media type of one path, defaulting to MP4 so an odd name still plays. */
    function mediaTypeOf(path) {
      return MEDIA_TYPES[suffixOf(fileNameOf(path))] ?? 'video/mp4';
    }

    const frameStyle = {
      boxSizing: 'border-box',
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: 0,
      padding: '12px',
      background: 'var(--dsw-alias-bg-layer-2)',
    };

    const videoStyle = {
      display: 'block',
      maxWidth: '100%',
      maxHeight: '100%',
      width: 'auto',
      height: 'auto',
      background: '#000',
      borderRadius: '12px',
      outline: 'none',
    };

    const statusStyle = {
      maxWidth: '42ch',
      padding: '16px 20px',
      borderRadius: '12px',
      background: 'var(--dsw-alias-bg-layer-1)',
      border: '1px solid var(--dsw-alias-border-l1)',
      color: 'var(--dsw-alias-label-primary)',
      fontSize: '13px',
      lineHeight: '1.6',
      textAlign: 'center',
    };

    /**
     * A 16px glyph for the viewer inventory: a play mark inside a frame.
     * @param size - square size in CSS pixels.
     * @returns the icon node.
     */
    function viewerIcon(size) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('rect', {
          x: 1.6,
          y: 3,
          width: 12.8,
          height: 10,
          rx: 2,
          stroke: 'currentColor',
          strokeWidth: 1.2,
        }),
        h('path', { d: 'M6.6 5.9 L10.4 8 L6.6 10.1 Z', fill: 'currentColor' }),
      );
    }

    /**
     * The Better Sidebar file viewer — the surface that owns the right column in
     * this deployment: its editor tab matches one viewer per path, and the
     * matching viewer draws the whole pane body.
     *
     * The host hands over an authenticated URL for the file's bytes instead of
     * the bytes themselves, so the pane reads whatever the server can serve and
     * the blob is re-typed here: the shared media route answers
     * `application/octet-stream` for anything outside its image table, and a
     * `<video>` refuses an unknown media type.
     *
     * @param props - the viewer props (`mediaUrl`, `path`, `visible`) plus copy.
     * @returns the playing element, a preparation line, or a failure notice.
     */
    function SidebarVideoViewer(props) {
      const { mediaUrl, path, t } = props;
      const name = fileNameOf(path ?? '');
      const mediaType = mediaTypeOf(path ?? '');

      /** `{ status: 'loading' | 'ready' | 'failed', url?, message? }` */
      const [state, setState] = React.useState({ status: 'loading' });
      const videoRef = React.useRef(null);

      React.useEffect(() => {
        if (typeof mediaUrl !== 'string' || mediaUrl.length === 0) {
          setState({ status: 'failed', message: 'no media url' });
          return undefined;
        }
        const controller = new AbortController();
        let objectUrl;
        setState({ status: 'loading' });

        fetch(mediaUrl, { signal: controller.signal })
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.arrayBuffer();
          })
          .then((buffer) => {
            if (controller.signal.aborted) return;
            objectUrl = URL.createObjectURL(new Blob([buffer], { type: mediaType }));
            setState({ status: 'ready', url: objectUrl });
          })
          .catch((error) => {
            if (controller.signal.aborted) return;
            setState({ status: 'failed', message: error instanceof Error ? error.message : String(error) });
          });

        return () => {
          controller.abort();
          if (objectUrl !== undefined) URL.revokeObjectURL(objectUrl);
        };
      }, [mediaUrl, mediaType]);

      /* A parked tab keeps its DOM; stop the sound the reader cannot see. */
      React.useEffect(() => {
        const element = videoRef.current;
        if (props.visible === false && element !== null) element.pause();
      }, [props.visible]);

      if (state.status === 'loading') {
        return h('div', { style: frameStyle }, h('p', { style: statusStyle, role: 'status' }, copy(t, 'decoding')));
      }

      if (state.status === 'failed') {
        const message =
          state.reason === 'decode' ? copy(t, 'failed') : copy(t, 'fetchFailed', { message: state.message ?? '' });
        return h('div', { style: frameStyle }, h('p', { style: statusStyle, role: 'alert' }, message));
      }

      return h(
        'div',
        { style: frameStyle, 'data-dsh-mp4-preview': true },
        h('video', {
          ref: videoRef,
          key: state.url,
          src: state.url,
          controls: true,
          playsInline: true,
          preload: 'metadata',
          style: videoStyle,
          'aria-label': copy(t, 'preview', { name }),
          onError: () => setState({ status: 'failed', reason: 'decode' }),
        }),
      );
    }

    /**
     * The Host document-preview body: the bytes arrive complete, so this only
     * turns them into a Blob URL and renders the browser's own player.
     *
     * @param props - document content, the tab's resource address, and copy.
     * @returns the video stage, a preparation status, or a decode notice.
     */
    function HostVideoBody(props) {
      const { content, resourceAddress, t } = props;
      const data = content !== undefined && content.kind === 'bytes' ? content.data : undefined;

      const name = React.useMemo(() => fileNameOf(resourceAddress), [resourceAddress]);
      const mediaType = MEDIA_TYPES[suffixOf(name)] ?? 'video/mp4';

      const [source, setSource] = React.useState();
      const [decodeFailed, setDecodeFailed] = React.useState(false);

      React.useEffect(() => {
        if (data === undefined) return undefined;
        let url;
        try {
          url = URL.createObjectURL(new Blob([data], { type: mediaType }));
        } catch {
          setDecodeFailed(true);
          return undefined;
        }
        setDecodeFailed(false);
        setSource({ data, mediaType, url });
        return () => {
          URL.revokeObjectURL(url);
        };
      }, [data, mediaType]);

      if (data === undefined) {
        return h('div', { style: frameStyle }, h('p', { style: statusStyle, role: 'alert' }, copy(t, 'unsupported')));
      }

      if (decodeFailed) {
        return h('div', { style: frameStyle }, h('p', { style: statusStyle, role: 'alert' }, copy(t, 'failed')));
      }

      if (source === undefined || source.data !== data || source.mediaType !== mediaType) {
        return h('div', { style: frameStyle }, h('p', { style: statusStyle, role: 'status' }, copy(t, 'decoding')));
      }

      return h(
        'div',
        { style: frameStyle, 'data-dsh-mp4-preview': true },
        h('video', {
          key: source.url,
          src: source.url,
          controls: true,
          playsInline: true,
          preload: 'metadata',
          style: videoStyle,
          'aria-label': copy(t, 'preview', { name }),
          onError: () => setDecodeFailed(true),
        }),
      );
    }

    return {
      /* `slots` and `locale` are always present; the two preview systems are
         optional, so each half waits for its own service instead of blocking
         the plugin on a deployment that ships only one of them. */
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () =>
            ctx.locale.register(NS, {
              zh: dictionary.zh,
              en: dictionary.en,
            }),
          'dsh-mp4: dictionaries',
        );

        const t = ctx.locale.bind(NS);

        /* The Host's own document pane: a renderer registration plus its body. */
        ctx.inject(['documentPreviews'], (scope) => {
          scope.effect(
            () =>
              scope.documentPreviews.register({
                id: HOST_RENDERER_ID,
                extensions: EXTENSIONS,
                binaryExtensions: EXTENSIONS,
                title: () => copy(t, 'title'),
                loading: 'bytes-complete',
                wrap: false,
              }),
            'dsh-mp4: document renderer',
          );
          scope.effect(
            () =>
              scope.slots.inject('sidebar.right.tab.document', () =>
                scope.slots.register(
                  {
                    name: 'sidebar.right.tab.document',
                    key: HOST_RENDERER_ID,
                    locale: NS,
                  },
                  HostVideoBody,
                ),
              ),
            'dsh-mp4: document body',
          );
        });

        /* The Better Sidebar editor tab: one file viewer per matched path. */
        ctx.inject(['betterSidebar'], (scope) => {
          /* One stable component type: the editor renders `viewer.component`
             directly, so a fresh arrow function per call would remount the
             player (and re-read the file) on every parent render. */
          const Viewer = (props) => h(SidebarVideoViewer, { ...props, t });
          scope.effect(
            () =>
              scope.betterSidebar.registerFileViewer({
                id: SIDEBAR_VIEWER_ID,
                title: () => copy(t, 'title'),
                icon: (size) => viewerIcon(size),
                exts: EXTENSIONS,
                priority: 10,
                fetchStrategy: 'mediaUrl',
                component: Viewer,
              }),
            'dsh-mp4: sidebar viewer',
          );
        });
      },
    };
  },
});
