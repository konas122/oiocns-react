import { useCallback, useRef } from "react";

/**
 * 将组件内包含闭包state变量的方法返回唯一的函数引用
 * @param fn 组件内的函数
 * @returns 返回唯一的函数引用，可以用于第三方库的回调和事件监听
 */
export function useFixedCallback<F extends AnyFunction>(fn: F): F {
  const ref = useRef<F>(null!);
  ref.current = fn;

  const ret = useCallback((...args: any[]) => {
    return ref.current(...args);
  }, []);
  return ret as F;
}