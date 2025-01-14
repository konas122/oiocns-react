import { useEffect, useState } from 'react';

/**
 * 监听元素滚动触底事件
 * @param elemId 元素Id
 * @param callback? 回调
 * @param deps If present, effect will only activate if the values in the list change.
 * @returns hooks 常量
 */
export const useScrolllEndHandler = (
    elemId: string,
    callback: (elem: HTMLElement) => void,
    deps?: React.DependencyList | undefined
): [boolean] => {
    const [scrollEnd, setScrollEnd] = useState(false);
    var scrollDiv = document.getElementById(elemId);
    useEffect(() => {
        const scrollHandler = () => {
            if (scrollDiv &&
                scrollDiv.scrollHeight - scrollDiv.clientHeight <= scrollDiv.scrollTop) {
                callback?.apply(this, [scrollDiv])
                setScrollEnd(true);
            } else {
                setScrollEnd(false);
            }
        }
        if (scrollDiv) {
            scrollDiv.addEventListener('scroll', scrollHandler);
        }
        return () => {
            if (scrollDiv) {
                scrollDiv.removeEventListener('scroll', scrollHandler);
            }
        };
    }, deps);
    return [scrollEnd];
};

export default useScrolllEndHandler;
