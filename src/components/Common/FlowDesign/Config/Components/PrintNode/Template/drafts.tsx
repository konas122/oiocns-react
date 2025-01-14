import React, { FC, useState } from 'react';
import './index.less';
import Template1 from './Template1';
import { IPrint } from '@/ts/core';
import { model, schema } from '@/ts/base';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { Field } from 'devextreme/ui/filter_builder';
import { Form } from '@/ts/core/thing/standard/form';

interface IProps {
  printType: string;
  primaryForms: schema.XForm[];
  detailForms: schema.XForm[];
  print: schema.XPrint;
  resource: any;
  type?: string;
  ser: any;
}
interface FormMapping extends schema.XForm {
  xform: model.MappingData;
}
const Templates: FC<IProps> = ({
  primaryForms,
  detailForms,
  printType,
  print,
  resource,
  ser,
}) => {
  //表单属性列表
  const [fields, setFields] = useState<any>([]);
  //可选表单列表
  const [forms, setForms] = useState<any>([]);

  const [loaded] = useAsyncLoad(async () => {
    const fields: Field[] = [];
    const tgs: FormMapping[] = [];
    for (const xform of [...primaryForms, ...detailForms]) {
      const form = new Form({ ...xform, id: xform.id + '_' }, ser.belong.directory);
      const xfields = await form.loadFields(false);
      xform.attributes.forEach((a) => {
        xfields.forEach((xfield) => {
          if (a.id == xfield.id) {
            if (!a.valueType) {
              a.valueType = xfield.valueType;
            }
          }
        });
      });
      fields.push(
        ...xfields.map((a) => {
          const name = `${form.name}--${a.name}`;
          switch (a.valueType) {
            case '数值型':
            case '货币型':
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  caption: name,
                  formId: xform.id,
                  dataField: a.code,
                  dataType: 'number',
                },
              };
            case '日期型':
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  caption: name,
                  dataField: a.code,
                  dataType: 'date',
                },
              };
            case '时间型':
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  caption: name,
                  formId: xform.id,
                  dataField: a.code,
                  dataType: 'datetime',
                },
              };
            case '选择型':
            case '分类型':
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  formId: xform.id,
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
                  name: xform.id + '-' + a.id,
                  caption: name,
                  dataField: xform.id + '-' + a.id,
                  dataType: 'string',
                },
              };
          }
        }),
        {
          code: '111',
          id: '111',
          lookups: [],
          name: '审核意见',
          valueType: '描述型',
          xfield: {
            name: '111-111',
            caption: '审核意见',
            dataField: '111-111',
            dataType: 'string',
          },
        },
      );
    }
    tgs.push(
      ...detailForms.map((a) => {
        return {
          ...a,
          xform: {
            type: '子表',
            id: a.id,
            formId: a.id,
            key: a.id,
            formName: a.name,
            typeName: '表单',
            trigger: a.id,
            code: '',
            name: `[子表]${a.name}`,
          },
        };
      }),
      ...primaryForms.map((a) => {
        return {
          ...a,
          xform: {
            type: '主表',
            id: a.id,
            formId: a.id,
            key: a.id,
            formName: a.name,
            typeName: '表单',
            trigger: a.id,
            code: '',
            name: `[主表]${a.name}`,
          },
        };
      }),
    );

    setForms(tgs);
    setFields(fields);
  }, [primaryForms, detailForms]);
  if (!loaded) return <></>;
  return (
    <>
      <Template1
        resource={resource}
        printType={printType}
        fields={fields}
        forms={forms}
        print={print}
      />
    </>
  );
};
export default Templates;
