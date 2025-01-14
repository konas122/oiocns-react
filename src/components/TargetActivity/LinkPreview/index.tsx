import React, { useState, useEffect } from 'react';
import { Image, Typography } from 'antd';
import { kernel } from '@/ts/base';
import { extractPreviewData, isURL, parseTolink } from '@/utils/tools';
import cls from './index.module.less';
import ImgError from '/public/img/empty/imgError.png';

interface Iprops {
  url: string;
  isClsBase?: boolean;
}

type PreView = {
  title: string;
  description: string;
  favicon: string;
};

/**
 * 第三方网站预览
 * @param url  // 网址
 * @returns
 */

const { Paragraph } = Typography;

const LinkPreviewComponent: React.FC<Iprops> = ({ url, isClsBase }) => {
  if (!isURL(url)) return <></>;

  const [previewData, setPreviewData] = useState<PreView>({
    title: '',
    description: '',
    favicon: '',
  });

  const getProtocolAndHostname = (url: string) => {
    var match = url.match(/^(https?:\/\/)([^\/]+)/i);
    if (match) {
      return match[0];
    }
    return '';
  };

  /** 加载网站预览信息 */
  const loadPreviewData = async () => {
    try {
      const result = await kernel.httpForward({
        uri: url,
        method: 'GET',
        header: {},
        content: '',
      });
      if (result.success) {
        const res = extractPreviewData(result.data.content);
        let favicon = res.favicon;
        if (!res.favicon.includes('http://') && !res.favicon.includes('https://')) {
          favicon = getProtocolAndHostname(url) + res.favicon;
        }
        setPreviewData({ ...res, favicon });
      }
    } catch (error) {
      console.log('抛出异常', error);
    }
  };

  useEffect(() => {
    loadPreviewData();
  }, []);
  return (
    <div
      className={`${cls['link-content']} ${isClsBase ? cls['linkBaseContent'] : ''}`}
      onClick={() => {
        window.open(url, '_blank');
      }}>
      {previewData.favicon && previewData.title && (
        <Image width={60} src={previewData.favicon} preview={false} fallback={ImgError} />
      )}
      <div className={cls['link-content-des']}>
        <div dangerouslySetInnerHTML={{ __html: parseTolink(url) }}></div>
        <div className={cls['link-content-title']}>{previewData.title}</div>
        <div>
          <Paragraph ellipsis={{ rows: 2, expandable: false }}>
            {previewData.description}
          </Paragraph>
        </div>
      </div>
    </div>
  );
};
export default LinkPreviewComponent;
