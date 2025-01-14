import { useRef } from 'react';

/**
 * 确保只初始化一次的Ref
 * @param factory 初始化方法
 */
export function useRefInit<T>(factory: () => T) {
  const ref = useRef<T>(null!);
  if (ref.current == null) {
    ref.current = factory();
  }
  return ref;
}