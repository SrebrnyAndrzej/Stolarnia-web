/** Time-based damping makes wheel notches gentle without changing native scrolling. */
export function advanceMovieTime(
  current: number,
  target: number,
  elapsedSeconds: number,
): number {
  const dt = Math.max(0, Math.min(elapsedSeconds, 0.064));
  const delta = target - current;
  if (Math.abs(delta) < 0.025) return target;
  const eased = delta * (1 - Math.exp(-dt / 0.28));
  return current + Math.max(-4 * dt, Math.min(4 * dt, eased));
}
