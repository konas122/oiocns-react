import React, { useState, useEffect } from 'react';
import { Space, Select } from 'antd';
import { TextArea, TextBox } from 'devextreme-react';
import _ from 'lodash';
import { model, schema } from '@/ts/base';
import { FieldSelect } from '@/components/Common/FlowDesign/Config/Components/Rule/modal/FieldSelect';

interface Iprops {
  targetSource: model.MappingData[];
  detailForms: schema.XForm[];
  combination: model.CombinationType;
  applyType: string;
  onValueChange: (combinations: model.CombinationType) => void;
}

const CombinationComp: React.FC<Iprops> = ({
  targetSource,
  detailForms,
  combination,
  applyType,
  onValueChange,
}) => {
  const [combinations, setCombinations] = useState<model.CombinationType>(combination);

  useEffect(() => {
    onValueChange({ ...combinations });
  }, [combinations]);

  const onFieldChange = (fieldObj: {
    [field: string]: model.MappingData | model.MappingData[] | string;
  }) => {
    setCombinations({
      ...combinations,
      ...fieldObj,
    });
  };

  return (
    <Space
      direction="vertical"
      size={15}
      style={{
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'center',
      }}>
      <TextBox
        label="名称"
        labelMode="floating"
        value={combinations?.name}
        onValueChange={(e) => {
          onFieldChange({
            name: e,
          });
        }}
      />
      <div className="flex items-center">
        <div style={{ marginRight: '16px' }}>
          {applyType === '拆分' ? '拆分前' : '合并后'}资产的选择字段：
        </div>
        <FieldSelect
          style={{ flex: 'auto' }}
          value={combinations?.assetSource}
          onChange={(e: model.MappingData) => {
            onFieldChange({
              assetSource: e,
            });
          }}
          data={targetSource.filter(
            (i) => i.widget === '引用选择框' || i.valueType === '引用型',
          )}
        />
      </div>
      {applyType === '合并' && (
        <div className="flex items-center">
          <div style={{ marginRight: '16px' }}>被合并的资产的关联核销/处置表单：</div>
          <Select
            style={{ width: '180px' }}
            placeholder="请选择表单"
            value={combinations?.verificationFormId}
            onChange={(e) => {
              onFieldChange({
                verificationFormId: e,
              });
            }}
            options={detailForms.map((item) => {
              return {
                label: item.name,
                value: item.id,
              };
            })}></Select>
        </div>
      )}
      {applyType === '拆分' && (
        <React.Fragment>
          <div className="flex items-center">
            <div style={{ marginRight: '16px' }}>拆分的字段：</div>
            <FieldSelect
              style={{ flex: 'auto' }}
              value={combinations?.splitTarget}
              onChange={(e: model.MappingData) => {
                onFieldChange({
                  splitTarget: e,
                });
              }}
              data={targetSource.filter(
                (i) =>
                  i.widget === '数字框' ||
                  i.valueType === '数值型' ||
                  i.valueType === '货币型',
              )}
            />
          </div>
          <div className="flex items-center">
            <div style={{ marginRight: '16px' }}>触发拆分的字段：</div>
            <FieldSelect
              style={{ flex: 'auto' }}
              value={combinations?.splitType}
              onChange={(e: model.MappingData) => {
                onFieldChange({
                  splitType: e,
                });
              }}
              data={targetSource.filter((i) => i.valueType === '选择型')}
            />
          </div>
          <div className="flex items-center">
            <div style={{ marginRight: '16px' }}>拆分后条数的选择字段：</div>
            <FieldSelect
              style={{ flex: 'auto' }}
              value={combinations?.splitNumber}
              onChange={(e: model.MappingData) => {
                onFieldChange({
                  splitNumber: e,
                });
              }}
              data={targetSource.filter(
                (i) =>
                  i.widget === '数字框' ||
                  i.valueType === '数值型' ||
                  i.valueType === '货币型',
              )}
            />
          </div>
        </React.Fragment>
      )}
      <TextArea
        label="备注"
        labelMode="floating"
        onValueChanged={(e) => {
          onFieldChange({
            remark: e.value,
          });
        }}
        value={combinations?.remark}
      />
    </Space>
  );
};
export default CombinationComp;
