// Keep IPC, navigation and window.open on the same external URL policy.
export function externalRequest(url: unknown, options?: unknown) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || /[\s\\\p{Cc}]/u.test(url)) {
    return null;
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname || parsed.username || parsed.password) return null;
    if (options !== undefined) {
      if (!options || typeof options !== 'object' || Array.isArray(options)) return null;
      if (Object.keys(options).some((key) => key !== 'activate')) return null;
      if ('activate' in options && typeof options.activate !== 'boolean') return null;
    }
    return {
      url: parsed.href,
      options:
        options && 'activate' in options ? { activate: options.activate as boolean } : undefined,
    };
  } catch {
    return null;
  }
}

export function isAppPageURL(actual: string, expected: string) {
  try {
    const actualURL = new URL(actual);
    const expectedURL = new URL(expected);
    // Hash routes are part of the same application document. Everything else
    // (including credentials, file path, origin and query) must match exactly.
    actualURL.hash = '';
    expectedURL.hash = '';
    return actualURL.href === expectedURL.href;
  } catch {
    return false;
  }
}

export function isAppWindow(window: Electron.BrowserWindow | null, expected: string) {
  return Boolean(
    window &&
      !window.isDestroyed() &&
      !window.webContents.isDestroyed() &&
      isAppPageURL(window.webContents.getURL(), expected)
  );
}

export function isAppSender(
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent,
  window: Electron.BrowserWindow | null,
  expected: string
) {
  try {
    return Boolean(
      isAppWindow(window, expected) &&
        event.sender === window!.webContents &&
        event.senderFrame === event.sender.mainFrame &&
        event.senderFrame &&
        !event.senderFrame.detached &&
        isAppPageURL(event.senderFrame.url, expected)
    );
  } catch {
    // Electron may detach a frame between event delivery and inspection.
    return false;
  }
}

export async function openExternal(
  opener: (url: string, options?: Electron.OpenExternalOptions) => Promise<void>,
  url: unknown,
  options?: unknown
) {
  const request = externalRequest(url, options);
  if (!request) return false;
  await opener(request.url, request.options);
  return true;
}
