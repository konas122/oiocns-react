import { useEffect } from "react"
import { kernel } from '@/ts/base';
let iframeRef: HTMLIFrameElement | null

const usePostMessage = (metaData: any, link: 'string') => {
    useEffect(() => {
        iframeRef = document.getElementById(metaData.iframeId) as HTMLIFrameElement;
        // 监听iframe传递的数据
        window.addEventListener('message', handleReceiveMsg)
        return () => {
            window.removeEventListener('message', handleReceiveMsg)
        }
    }, [])

    // 接受子页面信息
    const handleReceiveMsg = async (message: any) => {
        ((msg: any) => {
            if (message.data.from === 'orginone') return
            if (!(iframeRef?.contentWindow)) {
                iframeRef = document.getElementById(message.iframeId || metaData.iframeId) as HTMLIFrameElement
            }
            setTimeout(async () => {
                let result: any = { from: "orginone" }
                try {
                    let res: any = await execAppRequest(msg.data)
                    result = { ...result, ...res }
                }
                catch (ex) {
                    result.exception = ex
                }
                finally {
                    if (iframeRef?.contentWindow) {
                        iframeRef.contentWindow.postMessage(result, link)
                    }
                }
            })
        })(message)
    }

    // 处理app请求
    const execAppRequest = async (data: any) => {
        switch (data.actions) {
            case 'getMeatData':
                return metaData
            case 'getInterfaceData':
                return await kernel[data.funcName](data.params)
        }
    }
}
export default usePostMessage