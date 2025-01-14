import { Emitter } from '@/ts/base/common';
import { IProperty, IReport, orgAuth } from '@/ts/core';
import { Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useState, useEffect } from 'react';
import { ValueChangedEvent } from 'devextreme/ui/text_box';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import { Button, message } from 'antd';
import OpenFileDialog from '@/components/OpenFileDialog';
import cls from '../design/index.module.less';
import { XFloatRowsInfo } from '@/ts/base/schema';
import { loadwidgetOptions } from '../../WorkForm/Utils';

interface IRowInfoProps {
  current: IReport;
  rowInfo: XFloatRowsInfo | undefined;
  notifyEmitter: Emitter;
}

const FloatRowsConfig: React.FC<IRowInfoProps> = ({
  current,
  rowInfo,
  notifyEmitter,
}) => {
  const [key, _forceUpdate] = useObjectUpdate(current);
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

    return formData?.rowsInfo.map((rowInfo, index) => {
      return (
        <GroupItem key={index} cssClass={cls.formGroup}>
          <SimpleItem>
            <span>字段：{rowInfo?.name}</span>
          </SimpleItem>
          <SimpleItem
            dataField={`rowsInfo[${index}].rule.value.type`}
            editorType="dxSelectBox"
            label={{ text: '数据类型' }}
            editorOptions={{
              items: [
                { key: '输入型', text: '输入型' },
                { key: '属性型', text: '属性型' },
              ],
              displayExpr: 'text',
              valueExpr: 'text',
              value: rowInfo.rule.value?.type || '输入型',
            }}
          />
          {rowInfo?.rule.value?.type === '属性型' && (
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
                          formData.rowsInfo[index].rule.value!.valueString = {
                            propId: item.id,
                            property: item.metadata,
                            ...item.metadata,
                            id: 'snowId()',
                            rule: '{}',
                            queryRule: '',
                            options: {
                              visible: true,
                              isRequired: false,
                            },
                            formId: current.id,
                            authId: orgAuth.SuperAuthId,
                          };
                        });
                        setCenter(<></>);
                      }}
                    />,
                  )
                }>
                配置
              </Button>
              {rowInfo.rule.value?.valueString?.name}
            </SimpleItem>
          )}
          {rowInfo?.rule.value?.type === '属性型' && (
            <SimpleItem
              dataField={`rowsInfo[${index}].rule.value.valueString.widget`}
              editorType="dxSelectBox"
              label={{ text: '组件' }}
              editorOptions={{
                items: loadwidgetOptions(rowInfo.rule.value.valueString ?? []),
              }}
            />
          )}
          <SimpleItem
            dataField={`rowsInfo[${index}].valueType`}
            editorType="dxSelectBox"
            label={{ text: '字段类型' }}
            editorOptions={{
              items: [
                { key: '文本框', text: '文本框' },
                { key: '数字框', text: '数字框' },
                { key: '日期型', text: '日期型' },
              ],
              displayExpr: 'text',
              valueExpr: 'text',
              value: rowInfo?.valueType || '文本框',
            }}
          />
          {rowInfo?.valueType === '数字框' && (
            <SimpleItem
              dataField={`rowsInfo[${index}].accuracy`}
              label={{ text: '精度' }}
            />
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
        <SimpleItem isRequired dataField="floatRowCode" label={{ text: '代码' }} />
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
                  if (!formData.floatRowCode) {
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
