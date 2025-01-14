import React, { useState } from 'react';
import MainLayout from '../MainLayout';
import Content from './content';
import useMenuUpdate from '@/hooks/useMenuUpdate';
import { loadSettingMenu } from './config'; 
import FullScreenModal from '../Common/fullScreen';
import { Button, Divider, Space } from 'antd';
import { IFile } from '@/ts/core';
import orgCtrl, { Controller } from '@/ts/controller';
import { MenuItemType } from 'typings/globelType';

export interface IFileDialogProps {
  title?: string;
  accepts: string[];
  multiple?: boolean;
  maxCount?: number;
  rootKey: string;
  currentKey?: string;
  excludeIds?: string[];
  allowInherited?: boolean;
  leftShow?: boolean;
  rightShow?: boolean;
  fileContents?: IFile[];
  onOk: (files: IFile[]) => void;
  onCancel: () => void;
  showFile?: boolean;
  onLoadMenu?: () => MenuItemType;
  onSelectMenuChanged?: (menu: MenuItemType) => void;
}

const OpenFileDialog: React.FC<IFileDialogProps> = (props) => {
  const [selectedFiles, setSelectedFiles] = useState<IFile[]>([]);
  const [key, rootMenu, selectMenu, setSelectMenu] = useMenuUpdate(() => {
    if (props.onLoadMenu) {
      return props.onLoadMenu();
    }
    return loadSettingMenu(props.rootKey, props.allowInherited || false);
  }, new Controller(props.currentKey ?? orgCtrl.currentKey));
  if (!selectMenu || !rootMenu) return <></>;
  return (
    <FullScreenModal
      open
      title={props.title ?? '选择文件'}
      onCancel={() => {
        props.onCancel();
        setSelectedFiles([]);
      }}
      destroyOnClose
      width={'80vw'}
      bodyHeight={'70vh'}
      footer={
        <Space split={<Divider type="vertical" />} wrap size={2}>
          <Button
            type="primary"
            onClick={() => {
              props.onOk(selectedFiles);
              setSelectedFiles([]);
            }}>
            确认
          </Button>
        </Space>
      }>
      <MainLayout
        leftShow={props.leftShow === false ? false : true}
        rightShow={props.rightShow === false ? false : true}
        previewFlag={'dialog'}
        selectMenu={selectMenu}
        onSelect={(data) => {
          setSelectMenu(data);
          props.onSelectMenuChanged?.apply(this, [data]);
        }}
        siderMenuData={rootMenu}>
        <Content
          key={key}
          showFile={props.showFile}
          accepts={props.accepts}
          selects={selectedFiles}
          current={selectMenu.item}
          excludeIds={props.excludeIds}
          fileContents={props.fileContents}
          onFocused={(file) => {
            if (!props.multiple) {
              if (file) {
                setSelectedFiles([file]);
              } else {
                setSelectedFiles([]);
              }
            }
          }}
          onSelected={(files) => {
            if (props.multiple) {
              if (props.maxCount && files.length > props.maxCount) {
                setSelectedFiles(files.slice(-props.maxCount));
              } else {
                setSelectedFiles(files);
              }
            }
          }}
        />
      </MainLayout>
    </FullScreenModal>
  );
};

export default OpenFileDialog;
