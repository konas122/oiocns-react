import { Emitter } from '@/ts/base/common';
import { IView } from '@/ts/core';
import { Button } from 'antd';
import { Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useEffect, useState } from 'react';
import OpenFileDialog from '@/components/OpenFileDialog';
import { CloseOutlined } from '@ant-design/icons';
import { XFormOptions } from '@/ts/base/schema';

interface IAttributeProps {
  current: IView;
  notifyEmitter: Emitter;
}

const ReportViewConfig: React.FC<IAttributeProps> = ({ notifyEmitter, current }) => {
  const [formOptions, setFormOptions] = useState<XFormOptions[]>(
    current.metadata.options?.formOptions ?? [],
  );
  const [center, setCenter] = useState(<></>);

  useEffect(() => {
    if (!current.metadata.options) {
      current.metadata.options = { itemWidth: 300 };
    }
  }, [current]);

  const notityAttrChanged = () => {
    notifyEmitter.changCallback('form');
  };

  return (
    <>
      <Form
        scrollingEnabled
        height={'calc(100vh - 175px)'}
        formData={current.metadata}
        onFieldDataChanged={notityAttrChanged}>
        <GroupItem itemType="group">
          <SimpleItem dataField="name" isRequired={true} label={{ text: '名称' }} />
          <SimpleItem dataField="code" isRequired={true} label={{ text: '代码' }} />
          <SimpleItem
            dataField="remark"
            editorType="dxTextArea"
            isRequired={true}
            label={{ text: '视图描述' }}
            editorOptions={{
              height: 100,
            }}
          />
        </GroupItem>
        <GroupItem caption="查看设置">
          <SimpleItem label={{ text: '视图关联表单' }}>
            <div>
              <Button
                type="primary"
                size="small"
                style={{ marginRight: '5px' }}
                onClick={() => {
                  setCenter(
                    <OpenFileDialog
                      title={`选择报表`}
                      rootKey={current?.directory?.key}
                      multiple={true}
                      allowInherited
                      accepts={['报表']}
                      excludeIds={current.metadata.options.formOptions?.map(
                        (form) => form.id,
                      )}
                      onCancel={() => setCenter(<></>)}
                      onOk={(files) => {
                        current.metadata.options.formOptions = [
                          ...(current.metadata.options.formOptions ?? []),
                          ...files.map((file) => {
                            const newMetadata: any = { ...file.metadata };
                            delete newMetadata.reportDatas;
                            return {
                              name: file.name,
                              id: file.id,
                              metadata: newMetadata,
                            };
                          }),
                        ];
                        notityAttrChanged();
                        setCenter(<></>);
                      }}
                    />,
                  );
                }}>
                选择报表
              </Button>
            </div>
            <div>
              {current.metadata.options?.formOptions?.map((form, index) => {
                return (
                  <div
                    key={index}
                    style={{
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingRight: '10px',
                    }}>
                    <span>{form.name}</span>
                    <CloseOutlined
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        current.metadata.options?.formOptions?.splice(index, 1);
                        setFormOptions(formOptions.filter((item) => item.id !== form.id));
                        notityAttrChanged();
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </SimpleItem>
          <SimpleItem label={{ text: '视图关联报表树' }}>
            <div>
              <Button
                type="primary"
                size="small"
                style={{ marginRight: '5px' }}
                onClick={() => {
                  setCenter(
                    <OpenFileDialog
                      title={`选择报表树`}
                      rootKey={current?.directory?.key}
                      accepts={['报表树']}
                      allowInherited
                      onCancel={() => setCenter(<></>)}
                      onOk={(files) => {
                        const file = files[0] as any;
                        current.metadata.options.treeInfo = {
                          directoryId: file.directory.id,
                          applicationId: file.directory.id,
                          id: file.id,
                          key: 'id',
                          name: file.name,
                        };
                        setCenter(<></>);
                      }}
                    />,
                  );
                }}>
                选择报表树
              </Button>
            </div>
            <div>
              {current.metadata.options?.treeInfo ? (
                <div
                  style={{
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingRight: '10px',
                  }}>
                  <span>{current.metadata.options?.treeInfo.name}</span>
                </div>
              ) : (
                <></>
              )}
            </div>
          </SimpleItem>
        </GroupItem>
      </Form>
      {center}
    </>
  );
};

export default ReportViewConfig;
