
/**
 * 等待一定时间
 * @param timeout 要延迟的毫秒数
 */
export function delay(timeout: number) {
  return new Promise<void>((s) => {
    setTimeout(() => {
      s();
    }, timeout);
  });
}

/**
 * 等待当前线程空闲，类似`process.nextTick`或者`setImmediate`，但不会阻塞事件循环。
 */
export function nextTick() {
  return delay(5);
}