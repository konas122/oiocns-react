import React, { FC, useState } from 'react';
import './index.less';
import Template1 from './Template1';
import { IPrint, IForm } from '@/ts/core';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { Field } from 'devextreme/ui/filter_builder';
import { XForm } from '@/ts/base/schema';
import { Form } from '@/ts/core/thing/standard/form';
interface IProps {
  current: IForm;
  printType: string;
  primaryForms: XForm;
  print: IPrint;
}
const Templates: FC<IProps> = ({ primaryForms, printType, print, current }) => {
  //表单属性列表
  const [fields, setFields] = useState<any>([]);
  const [loaded] = useAsyncLoad(async () => {
    const fields: Field[] = [];
    const form = new Form(
      { ...primaryForms, id: primaryForms.id + '_' },
      current.directory,
    );
    const xfields = await form.loadFields(false);
    fields.push(
      ...xfields.map((a) => {
        const name = `${a.name}`;
        switch (a.valueType) {
          case '数值型':
          case '货币型':
            return {
              ...a,
              xfield: {
                name: a.id,
                caption: name,
                formId: a.id,
                dataField: a.code,
                dataType: 'number',
              },
            };
          case '日期型':
            return {
              ...a,
              xfield: {
                name: a.id,
                caption: name,
                dataField: a.code,
                dataType: 'date',
              },
            };
          case '时间型':
            return {
              ...a,
              xfield: {
                name: a.id,
                caption: name,
                formId: a.id,
                dataField: a.code,
                dataType: 'datetime',
              },
            };
          case '选择型':
          case '分类型':
            return {
              ...a,
              xfield: {
                name: a.id,
                caption: name,
                dataField: a.code,
                dataType: 'string',
                lookup: {
                  displayExpr: 'text',
                  valueExpr: 'value',
                  allowClearing: true,
                  dataSource: a.lookups,
                },
              },
            };
          default:
            return {
              ...a,
              xfield: {
                name: a.id,
                caption: name,
                dataField: a.id,
                dataType: 'string',
              },
            };
        }
      }),
    );
    setFields(fields);
  }, [primaryForms]);
  if (!loaded) return <></>;
  return (
    <>
      {
        <Template1
          printType={printType}
          fields={fields}
          print={print}
          current={primaryForms}
        />
      }
    </>
  );
};
export default Templates;
