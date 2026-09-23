export function createDelayedPending(
  delayMs: number,
  onVisibilityChange: (visible: boolean) => void,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let visible = false;

  return {
    start() {
      if (timer || visible) return;
      timer = setTimeout(() => {
        timer = null;
        visible = true;
        onVisibilityChange(true);
      }, delayMs);
    },
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      visible = false;
      onVisibilityChange(false);
    },
  };
}

export function setKeyPending(
  state: ReadonlySet<string>,
  key: string,
  pending: boolean,
): ReadonlySet<string> {
  const next = new Set(state);
  if (pending) next.add(key);
  else next.delete(key);
  return next;
}

export function isKeyPending(
  state: ReadonlySet<string>,
  key: string,
): boolean {
  return state.has(key);
}
