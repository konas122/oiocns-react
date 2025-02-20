import { IForm } from '@/ts/core';
import React, { useState } from 'react';
import Rule from './rule';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { FieldInfo } from 'typings/globelType';

interface IAttributeProps {
  current: IForm;
}

const FormRuleConfig: React.FC<IAttributeProps> = ({ current }) => {
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [loaded] = useAsyncLoad(async () => {
    const resultFields = await current.loadFields();
    const ss = resultFields.map((a) => {
      switch (a.valueType) {
        case '数值型':
        case '货币型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'number',
            fieldType: a.valueType,
          };
        case '日期型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'date',
            fieldType: '日期型',
          };
        case '时间型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'datetime',
            fieldType: '时间型',
          };
        case '选择型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            fieldType: '选择型',
            dataType: 'string',
            lookup: {
              displayExpr: 'text',
              valueExpr: 'value',
              allowClearing: true,
              dataSource: a.lookups,
            },
          };
        case '分类型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            fieldType: '分类型',
            dataType: 'string',
            filterOperations: ['sequal', 'snotequal'],
            lookup: {
              displayExpr: 'text',
              valueExpr: 'value',
              allowClearing: true,
              dataSource: a.lookups,
            },
          };
        default:
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'string',
            fieldType: '未知',
          };
      }
    });
    ss.unshift();
    setFields([
      {
        id: 'name',
        name: 'name',
        dataField: 'name',
        caption: '名称',
        dataType: 'string',
      },
      ...(ss as FieldInfo[]),
    ]);
  }, [current]);

  return (
    <div
      style={{
        gap: 10,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 130px)',
        overflow: 'scroll',
      }}>
      {loaded && <Rule fields={fields} form={current}></Rule>}
    </div>
  );
};

export default FormRuleConfig;
