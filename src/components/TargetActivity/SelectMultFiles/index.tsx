import React, { useEffect, useState } from 'react';
import { ISysFileInfo } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import ActivityResource from '../ActivityResource';
import { Button } from 'devextreme-react';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import UploadIcon from '@/components/Common/FileUpload/uploadIcon';

const SelectMultFiles: React.FC<{
  maxCount: number;
  types: string[];
  currentKey?: string;
  onChange: (fileList: ISysFileInfo[]) => void;
}> = (props) => {
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<ISysFileInfo[]>([]);
  const uploadLabelStyle = { paddingBottom: '10px', color: '#999', fontSize: '12px' };

  const uploadButton = (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        display: 'flex',
        alignContent: 'center',
        justifyContent: 'center',
        height: '115px',
        backgroundColor: '#F3F3F3',
      }}>
      <Button
        hint="云端上传"
        type="default"
        stylingMode="text"
        onClick={React.useCallback(() => {
          setOpen(true);
        }, [])}>
        <div>
          <OrgIcons type="/toolbar/store" size={26} notAvatar />
          <div style={uploadLabelStyle}>云端上传</div>
        </div>
      </Button>
      <Button hint="本地上传" type="default" stylingMode="text">
        <div>
          <UploadIcon
            size={26}
            onSelected={async (file) => {
              if (file) {
                setFileList([...fileList, file]);
              }
            }}
          />
          <div style={uploadLabelStyle}>本地上传</div>
        </div>
      </Button>
    </div>
  );

  useEffect(() => {
    props.onChange(fileList);
  }, [fileList]);

  return (
    <div className={'selectMultFiles'}>
      {ActivityResource(
        fileList.map((i) => i.shareInfo()),
        120,
        1,
      )}
      {fileList.length >= props.maxCount ? null : uploadButton}
      {open && (
        <OpenFileDialog
          multiple
          rootKey={'disk'}
          currentKey={props.currentKey}
          maxCount={props.maxCount}
          accepts={props.types}
          allowInherited
          onCancel={() => setOpen(false)}
          onOk={(files) => {
            setFileList([...fileList, ...files.map((i) => i as ISysFileInfo)]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default SelectMultFiles;
