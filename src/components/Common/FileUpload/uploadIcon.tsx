import React, { ReactNode } from 'react';
import { Upload, UploadProps } from 'antd';
import OrgIcons from '../GlobalComps/orgIcons';
import orgCtrl from '@/ts/controller';
import { ISysFileInfo } from '@/ts/core';

interface IProps {
  size: number;
  onSelected: (file: ISysFileInfo) => void;
  onProgress?: (p: number, key?: string) => void;
  children?: ReactNode;
}

const UploadIcon: React.FC<IProps> = ({ size, onSelected, onProgress, children }) => {
  const uploadProps: UploadProps = {
    multiple: false,
    showUploadList: false,
    maxCount: 1,
    async customRequest(options) {
      const file = options.file as File;
      if (file) {
        const result = await orgCtrl.user.directory.createFile(
          file.name,
          file,
          onProgress,
        );
        if (result) {
          onSelected(result);
        }
      }
    },
  };
  return (
    <Upload {...uploadProps}>
      {children || <OrgIcons type="/toolbar/files" size={size} notAvatar />}
    </Upload>
  );
};

export default UploadIcon;
