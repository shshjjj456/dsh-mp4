/**
 * Host half of the `dsh-mp4` bundle.
 *
 * The whole capability lives in the browser: the Client module registers an MP4
 * renderer with the right Sidebar's document-preview registry. Nothing on the
 * Host needs to change, so this export is deliberately empty; it exists because
 * a bundle row is a Host plugin entry.
 */
export function apply() {}
