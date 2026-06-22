export function wrapIndex(value: number, length: number) {
  if (length <= 0) return 0
  return ((Math.round(value) % length) + length) % length
}
