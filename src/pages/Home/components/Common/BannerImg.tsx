import React, { useEffect, useState } from 'react';
import { Carousel, Upload, message } from 'antd';
import cls from './index.module.less';
import { ICompany, IPerson, ITarget } from '@/ts/core';
import { model } from '@/ts/base';

interface IProps {
  bannerImg: any[];
  target: ITarget;
  bannerkey: string;
}
interface IUploadFile extends model.FileItemShare {
  uid: string;
  status: 'done';
  url: string | undefined;
  thumbUrl: string | undefined;
}

// 轮播
const Banner: React.FC<IProps> = (props) => {
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    setContent(props.bannerImg);
    if (props.target) {
      if ('cacheObj' in props.target) {
        props.target.cacheObj.get('banner').then(async (res: any) => {
          if (res && res[props.bannerkey]) {
            const finBannerdata = res[props.bannerkey].filter(
              (item: any) => !!item.shareLink,
            );
            finBannerdata.length > 0 && setContent(finBannerdata);
          }
        });
      }
    }
  }, [props]);

  const operateBanner = async (data: IUploadFile[] | undefined) => {
    if (props.target) {
      if ('cacheObj' in props.target) {
        props.target.cacheObj.get('banner').then(async (res: any) => {
          const finData = data ? data : [];
          const finBannerdata = { ...(res || {}), [props.bannerkey]: finData };
          const cacheRes = await (props?.target as IPerson | ICompany)?.cacheObj?.set(
            'banner',
            finBannerdata,
          );
          if (!cacheRes) return message.error('存错错误！');
          setContent(finData);
        });
      }
    }
  };
  return (
    <div className={cls['bannerImg-space']}>
      <Carousel className={cls['bannerImg-space']}>
        {content.map((item: any, index: number) => (
          <div className={cls['bannerImg-item']} key={index}>
            <div
              style={{
                backgroundImage: `url(${item.url || item.shareLink})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '220px',
                overflow: 'hidden',
              }}
            />
            <Upload
              maxCount={1}
              listType="picture"
              defaultFileList={[]}
              fileList={[]}
              customRequest={async (options: any) => {
                const file = options.file as File;
                if (file) {
                  const res = await props.target.directory.createFile(file.name, file);
                  if (res) {
                    const { name, key, thumbnail, size, shareLink } = res.filedata;
                    const curUploadFileData: IUploadFile = {
                      uid: key,
                      name,
                      status: 'done',
                      url: shareLink,
                      shareLink: shareLink,
                      thumbUrl: thumbnail,
                      size,
                    };
                    const allFileData: IUploadFile[] = [curUploadFileData];
                    operateBanner(allFileData);
                  }
                }
              }}>
              {props.target.hasRelationAuth() && (
                <div className={cls['bannerImg-edit']}>编辑封面</div>
              )}
            </Upload>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default Banner;
