
export function is<T>(obj: unknown, condition: boolean): obj is T {
  return condition;
}
