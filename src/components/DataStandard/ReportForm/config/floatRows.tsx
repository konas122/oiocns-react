import { Emitter } from '@/ts/base/common';
import { IForm, IProperty } from '@/ts/core';
import { Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useState, useEffect } from 'react';
import { ValueChangedEvent } from 'devextreme/ui/text_box';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import { Button, message } from 'antd';
import OpenFileDialog from '@/components/OpenFileDialog';
import { XFloatRowsInfo } from '../types';
import cls from '../design/index.module.less';

interface IRowInfoProps {
  current: IForm;
  index: number;
  rowInfo: XFloatRowsInfo | undefined;
  notifyEmitter: Emitter;
}

const FloatRowsConfig: React.FC<IRowInfoProps> = ({
  current,
  rowInfo,
  notifyEmitter,
}) => {
  const [key, forceUpdate] = useObjectUpdate(current);
  const [formData, setFormData] = useState(rowInfo as XFloatRowsInfo);
  const [center, setCenter] = useState(<></>);
  useEffect(() => {
    setFormData(rowInfo as XFloatRowsInfo);
  }, [rowInfo]);

  const notityAttrChanged = () => {
    setFormData({ ...formData });
  };

  const renderFormItems = () => {
    if (!formData?.rowsInfo) {
      return <></>;
    }
    const updateRow = (e: ValueChangedEvent, index: number) => {
      setFormData((prevFormData) => ({
        ...prevFormData,
        rowsInfo: prevFormData.rowsInfo.map((row, i) => {
          if (i === index) {
            return { ...row, type: e.value };
          }
          return row;
        }),
      }));
      forceUpdate();
    };
    return formData?.rowsInfo.map((rowInfo, index) => {
      return (
        <GroupItem key={index} cssClass={cls.formGroup}>
          <SimpleItem>
            <span>字段：{rowInfo?.name}</span>
          </SimpleItem>
          <SimpleItem
            dataField={`rowsInfo[${index}].type`}
            editorType="dxSelectBox"
            label={{ text: '字段类型' }}
            editorOptions={{
              items: [
                { key: '数字框', text: '数字框' },
                { key: '文本框', text: '文本框' },
                { key: '引用型', text: '引用型' },
                { key: '日期型', text: '日期型' },
                { key: '时间型', text: '时间型' },
                { key: '用户型', text: '用户型' },
              ],
              displayExpr: 'text',
              valueExpr: 'text',
              value: rowInfo?.type || '数字框',
              onValueChanged: (e: ValueChangedEvent) => updateRow(e, index),
            }}
          />
          {rowInfo?.type === '数字框' && (
            <SimpleItem
              dataField={`rowsInfo[${index}].accuracy`}
              label={{ text: '精度' }}
            />
          )}
          {rowInfo?.type === '引用型' && (
            <SimpleItem label={{ text: '引用其他属性' }}>
              <Button
                size="small"
                style={{ marginRight: '5px' }}
                onClick={() =>
                  setCenter(
                    <OpenFileDialog
                      title={`选择属性`}
                      accepts={['属性']}
                      rootKey={current.spaceKey}
                      excludeIds={[]}
                      onCancel={() => setCenter(<></>)}
                      onOk={(files) => {
                        (files as IProperty[]).forEach((item) => {
                          formData.rowsInfo[index].applicationData = item.metadata;
                        });
                        setCenter(<></>);
                      }}
                    />,
                  )
                }>
                配置
              </Button>
              {rowInfo.applicationData?.name}
            </SimpleItem>
          )}
          <SimpleItem
            dataField={`rowsInfo[${index}].isLineNumber`}
            editorType="dxCheckBox"
            label={{ text: '是否序号' }}
          />
          <SimpleItem
            dataField={`rowsInfo[${index}].isOnlyRead`}
            editorType="dxCheckBox"
            label={{ text: '是否只读' }}
          />
        </GroupItem>
      );
    });
  };

  return (
    <>
      <Form
        key={key}
        height={'calc(100vh - 130px)'}
        scrollingEnabled
        formData={formData}
        onFieldDataChanged={notityAttrChanged}>
        <SimpleItem>
          <span>多选：{formData?.coords}</span>
        </SimpleItem>
        <SimpleItem isRequired dataField="code" label={{ text: '代码' }} />
        <SimpleItem
          dataField="isFloatRows"
          editorType="dxCheckBox"
          label={{ text: '浮动行' }}
          editorOptions={{
            onValueChanged: (_e: ValueChangedEvent) => {
              notifyEmitter.changCallback('isFloatRows', formData);
            },
          }}
        />
        {formData?.isFloatRows && renderFormItems()}
        {formData?.isFloatRows && (
          <SimpleItem>
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 0',
              }}>
              <Button
                onClick={() => {
                  if (!formData.code) {
                    message.error('请填写浮动行代码~');
                    return;
                  } else {
                    notifyEmitter.changCallback('row', formData);
                  }
                }}>
                批量生成
              </Button>
            </div>
          </SimpleItem>
        )}
      </Form>
      {center}
    </>
  );
};

export default FloatRowsConfig;
