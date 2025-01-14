import React, { useState } from 'react';
import { model, parseAvatar } from '@/ts/base';
import { message, Upload, UploadProps, Image, Button, Space, Avatar } from 'antd';
import { IDirectory } from '@/ts/core';
import TypeIcon from '@/components/Common/GlobalComps/typeIcon';

interface IProps {
  icon?: string;
  typeName: string;
  directory: IDirectory;
  readonly?: boolean;
  avatarSize?: number;
  iconSize?: number;
  tips?: string;
  onChanged: (icon: string) => void;
}

const UploadItem: React.FC<IProps> = ({
  icon,
  tips,
  typeName,
  directory,
  readonly,
  avatarSize = 100,
  iconSize = 64,
  onChanged,
}) => {
  const [avatar, setAvatar] = useState<model.FileItemShare | undefined>(
    parseAvatar(icon),
  );
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
    async customRequest(options) {
      const file = options.file as File;
      if (file) {
        const result = await directory.createFile(file.name, file);
        if (result) {
          setAvatar(result.shareInfo());
          onChanged(JSON.stringify(result.shareInfo()));
        }
      }
    },
  };
  return (
    <Space>
      <Avatar
        size={avatarSize}
        style={{
          background: '#f9f9f9',
          color: '#606060',
          fontSize: 10,
          paddingLeft: '10px',
        }}
        src={
          avatar ? (
            <Image
              width={avatarSize - 10}
              src={avatar.thumbnail}
              preview={{ src: avatar.shareLink }}
            />
          ) : (
            <TypeIcon iconType={typeName} size={iconSize} />
          )
        }
      />
      {!readonly && (
        <Upload {...uploadProps}>
          <Button type="link"> 上传{tips || '图标'}</Button>
        </Upload>
      )}
      {!readonly && avatar ? (
        <Button
          type="link"
          onClick={() => {
            setAvatar(undefined);
            onChanged('');
          }}>
          清除{tips || '图标'}
        </Button>
      ) : (
        ''
      )}
    </Space>
  );
};

export default UploadItem;
