import React, { useEffect, useState } from 'react';
import { Space } from 'antd';
import cls from './index.module.less';
import { ISysFileInfo } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import { FileItemShare } from '@/ts/base/model';
import { command } from '@/ts/base';
import { Button } from 'devextreme-react';
import { ITextBoxOptions } from 'devextreme-react/text-box';
import UploadIcon from '@/components/Common/FileUpload/uploadIcon';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import { getUuid, shareOpenLink } from '@/utils/tools';
import {
  CloseCircleOutlined,
  CloudDownloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

interface IProgress {
  [key: string]: number;
}

const SelectFilesItem: React.FC<ITextBoxOptions> = (props) => {
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<FileItemShare[]>([]);
  const [progress, setProgress] = useState<IProgress | undefined>();
  const uploadLabelStyle = { color: '#366EF4', fontSize: '12px', opacity: '100%' };

  useEffect(() => {
    if (props.value && props.value.length > 0) {
      try {
        var temps = JSON.parse(props.value);
        if (temps && Array.isArray(temps) && temps.length > 0) {
          temps.forEach((item) => {
            if (!item.key) {
              item.key = getUuid();
            }
          });
          setFileList(temps);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [props.value]);

  return (
    <div className={cls.selectFilesCard}>
      <div className={`${props.className} ${cls.selectFilesName}`}>
        <div className="dx-label">
          <span>{props.label}</span>
        </div>
      </div>
      <Space size={8} direction="vertical" style={{ width: '100%' }}>
        <div className={cls.imageUploader}>
          <div className={cls.upload} style={{ opacity: progress ? '50%' : '100%' }}>
            <Button
              hint="云端上传"
              type="default"
              stylingMode="text"
              height={22}
              onClick={React.useCallback(() => {
                if (!progress) {
                  setOpen(true);
                }
              }, [progress])}
              visible={props.readOnly != true}>
              <Space size={8} style={uploadLabelStyle}>
                <OrgIcons type="/toolbar/cloudUpload" size={20} notAvatar />
                <div>云端上传</div>
              </Space>
            </Button>
            <Button
              hint="本地上传"
              type="default"
              stylingMode="text"
              height={22}
              visible={props.readOnly != true}>
              <UploadIcon
                size={20}
                onSelected={async (file) => {
                  if (file) {
                    props.onValueChanged?.({
                      value: JSON.stringify([...fileList, file.shareInfo()]),
                    } as any);
                  }
                }}
                onProgress={(p: number, key) => {
                  if (p !== 100 && key) {
                    setProgress({
                      [key]: p,
                    });
                  } else {
                    setProgress(undefined);
                  }
                  if (p === 0 && key) {
                    setFileList([
                      ...fileList,
                      {
                        key,
                        name: key.split('/')[1],
                      },
                    ]);
                  }
                }}>
                <div
                  onClick={(e) => {
                    if (progress) {
                      e.stopPropagation();
                    }
                  }}>
                  <Space size={8} style={uploadLabelStyle}>
                    <OrgIcons type="/toolbar/folderAdd" size={20} notAvatar />
                    <div>本地上传</div>
                  </Space>
                </div>
              </UploadIcon>
            </Button>
          </div>
        </div>
        <div>
          <Space size={8} direction="vertical" style={{ width: '100%' }}>
            {fileList.map((i, x) => {
              return (
                <div className={cls.file}>
                  <div>
                    {i.name} &nbsp;
                    <span style={{ color: '#366EF4' }}>
                      {i.key && progress ? (
                        <span>
                          <LoadingOutlined />
                          {progress[i.key]}%
                        </span>
                      ) : (
                        <span style={{ cursor: 'pointer' }}>
                          <CloudDownloadOutlined />
                          <span
                            onClick={() => {
                              window.open(shareOpenLink(i.shareLink, true));
                            }}>
                            下载
                          </span>
                          &nbsp;&nbsp;
                          <span
                            onClick={() => {
                              command.emitter('executor', 'open', i, 'preview');
                            }}
                            style={{ cursor: 'pointer' }}>
                            预览
                          </span>
                        </span>
                      )}
                    </span>
                  </div>
                  {!(props.readOnly || props.disabled) && (
                    <CloseCircleOutlined
                      onClick={(e) => {
                        e?.stopPropagation();
                        setFileList(fileList.filter((_, i) => i !== x));
                        props.onValueChanged?.({
                          value: JSON.stringify([
                          ...fileList.filter((_, i) => i !== x),
                          ]),
                        } as any);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </Space>
        </div>
      </Space>
      {open && (
        <OpenFileDialog
          multiple
          rootKey={'disk'}
          accepts={['文件']}
          allowInherited
          maxCount={(props.maxLength ?? 100) as number}
          onCancel={() => setOpen(false)}
          onOk={(files) => {
            if (files.length > 0) {
              props.onValueChanged?.({
                value: JSON.stringify([
                  ...fileList,
                  ...files.map((i) => (i as ISysFileInfo).shareInfo()),
                ]),
              } as any);
            }
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default SelectFilesItem;
