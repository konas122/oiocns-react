import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Image, message, Modal } from 'antd';
// import type { UploadFile } from 'antd/es/upload/interface';
import { ISession, ICompany, IPerson, ITarget } from '@/ts/core';
import { ISysFileInfo } from '@/ts/core';
import { AiOutlineDelete } from 'react-icons/ai';
import { shareOpenLink } from '@/utils/tools';
import { model } from '@/ts/base';

interface IProps {
  title: string;
  images?: ISysFileInfo[];
  target: ITarget | ICompany | IPerson;
  session: ISession;
  bannerkey: string;
  multi: Boolean;
}

interface IUploadFile extends model.FileItemShare {
  uid: string;
  status: 'done';
  url: string | undefined;
  thumbUrl: string | undefined;
}

interface IBannerData {
  workbench: IUploadFile[];
  activity: IUploadFile[];
}
export function isValidKey(
  key: string | number | symbol,
  object: object,
): key is keyof typeof object {
  return key in object;
}
const BannerSetting: React.FC<IProps> = ({ title, target, bannerkey, multi }) => {
  const [pics, setPics] = useState<IUploadFile[] | undefined>([]);
  const hasRelationAuth = target.hasRelationAuth();
  useEffect(() => {
    if ('cacheObj' in target) {
      target.cacheObj.get('banner').then((res) => {
        if (res) {
          const bannerData: { [key: string]: any } = res as IBannerData;
          const bannerList = (bannerData[bannerkey] as unknown as IUploadFile[]) || [];
          setPics([...Array.from(bannerList)]);
        }
      });
    }
  }, []);
  const operateBanner = async (data: IUploadFile[] | undefined, calFn: Function) => {
    if ('cacheObj' in target) {
      target.cacheObj.get('banner').then(async (res: any) => {
        const finData = data ? data : [];
        const finBannerdata = { ...(res || {}), [bannerkey]: finData };
        const cacheRes = await target.cacheObj.set('banner', finBannerdata);
        if (!cacheRes) return message.error('存错错误！');
        setPics(finData);
        calFn();
      });
    }
  };
  return (
    <Card
      title={title}
      bordered={false}
      size="small"
      style={{ minHeight: '100px', marginTop: '10px' }}>
      {hasRelationAuth ? (
        <Upload
          maxCount={1}
          listType="picture"
          defaultFileList={pics}
          fileList={pics}
          itemRender={(_, file, __) => {
            const { shareLink, url, thumbUrl } = file as IUploadFile;
            const finUrl =
              ((url || shareLink) && shareOpenLink(url || shareLink)) || thumbUrl;
            return (
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                {finUrl && hasRelationAuth && (
                  <>
                    <Image width="50%" height="180px" src={finUrl} />
                    <AiOutlineDelete
                      style={{ cursor: 'pointer', fontSize: '16px' }}
                      onClick={async () => {
                        Modal.confirm({
                          title: '提示',
                          content: `确定要删除吗?`,
                          onOk: async () => {
                            const lastPics: IUploadFile[] =
                              pics?.filter((pic) => pic.uid !== file.uid) || [];
                            operateBanner(multi ? lastPics : undefined, () => {});
                          },
                        });
                      }}
                    />
                  </>
                )}
              </div>
            );
          }}
          customRequest={async (options: any) => {
            const file = options.file as File;
            if (file) {
              const res = await target.directory.createFile(file.name, file);
              if (
                'cacheObj' in target &&
                res?.filedata &&
                typeof res.filedata === 'object'
              ) {
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
                const allFileData: IUploadFile[] =
                  multi && pics
                    ? [...Array.from(pics), curUploadFileData]
                    : [curUploadFileData];
                operateBanner(allFileData, options.onSuccess);
              }
            }
          }}>
          {hasRelationAuth && (
            <Button style={{ marginTop: '10px' }} size="small" type="primary" ghost>
              上传
            </Button>
          )}
        </Upload>
      ) : (
        <div style={{ color: '#999' }}>可联系单位管理员设置</div>
      )}
    </Card>
  );
};

export default BannerSetting;
