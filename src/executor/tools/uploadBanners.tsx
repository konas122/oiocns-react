import React, { useState } from 'react';
import { model } from '@/ts/base';
import { message, Upload, UploadProps, Image, Button, Space } from 'antd';
import { IDirectory } from '@/ts/core';
import { shareOpenLink } from '@/utils/tools';

interface IUploadFile extends model.FileItemShare {
  uid: string;
  status: 'done';
  url: string | undefined;
  thumbUrl: string | undefined;
}
interface IProps {
  banners?: IUploadFile[];
  directory: IDirectory;
  readonly?: boolean;
  onChanged: (url: string[]) => void;
}

const UploadBanner: React.FC<IProps> = ({ banners, directory, readonly, onChanged }) => {
  const unitBanners = Array.isArray(banners)
    ? banners.map((banner) => {
        return { ...banner, url: banner.thumbnail, thumbUrl: banner.thumbnail };
      })
    : { ...(banners || {}), url: banners?.thumbnail };
  const [bannerImgs, setBannerImgs] = useState<IUploadFile[] | undefined>(
    unitBanners as IUploadFile[],
  );
  const renderImage = (url: string) => {
    return <Image height="80px" src={url} />;
  };
  const uploadProps: UploadProps = {
    multiple: false,
    showUploadList: false,
    maxCount: 1,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image');
      if (!isImage) {
        message.error(`${file.name} 不是一个图片文件`);
      }
      return isImage;
    },
    // TODO 先支持上传一张，后期再开放多张
    // itemRender: (_, file, __) => {
    //   const { url, thumbUrl } = file;
    //   const finUrl = (url && shareOpenLink(url)) || thumbUrl;
    //   return (
    //     <div
    //       style={{
    //         marginTop: '20px',
    //         display: 'flex',
    //         alignItems: 'center',
    //         justifyContent: 'space-between',
    //       }}>
    //       {finUrl && !readonly && (
    //         <>
    //           {renderImage(finUrl)}
    //           <AiOutlineDelete
    //             style={{ cursor: 'pointer', fontSize: '16px' }}
    //             onClick={async () => {
    //               Modal.confirm({
    //                 title: '提示',
    //                 content: `确定要删除吗?`,
    //                 onOk: async () => {
    //                   const lastPics: IUploadFile[] =
    //                     banners?.filter((pic) => pic.uid !== file.uid) || [];
    //                   setBannerImgs(lastPics);
    //                   onChanged([JSON.stringify(lastPics)]);
    //                 },
    //               });
    //             }}
    //           />
    //         </>
    //       )}
    //     </div>
    //   );
    // },
    async customRequest(options) {
      const file = options.file as File;
      if (file) {
        const result = await directory.createFile(file.name, file);
        if (result) {
          const shareInfo = result.shareInfo();
          onChanged([JSON.stringify(shareInfo)]);
          setBannerImgs([{ ...(shareInfo as IUploadFile), url: shareInfo.shareLink }]);
        }
      }
    },
  };
  return (
    <Space>
      {bannerImgs &&
        Array.isArray(bannerImgs) &&
        bannerImgs.map((banner) => {
          const { shareLink, url, thumbUrl } = banner;
          const finUrl =
            ((shareLink || url) && shareOpenLink(shareLink || url)) || thumbUrl;
          if (finUrl) return renderImage(finUrl);
        })}

      {!readonly && (
        <Upload {...uploadProps} defaultFileList={bannerImgs} fileList={bannerImgs}>
          <Button type="link">上传图片</Button>
        </Upload>
      )}
    </Space>
  );
};

export default UploadBanner;
