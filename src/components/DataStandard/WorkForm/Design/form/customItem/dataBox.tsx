import React, { useState } from 'react';
import { Button, message } from 'antd';
import _ from 'lodash';
import { EditModal } from '@/executor/tools/editModal';
import { IBelong, IForm, ITarget } from '@/ts/core';
import { schema } from '@/utils/excel';
import { Form } from '@/ts/core/thing/standard/form';
import { XAttribute, XForm, XThing } from '@/ts/base/schema';
import { TextBox } from 'devextreme-react';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { jsonParse } from '@/utils/tools';
import { FieldModel } from '@/ts/base/model';

interface DataBoxProps extends ISelectBoxOptions {
  field: FieldModel;
  attributes: XAttribute[];
  multiple: boolean;
  allowSetFieldsValue?: boolean;
  nameAttribute: string;
  target?: ITarget;
  setFieldsValue?: (data: any) => void;
}
const DataBox: React.FC<DataBoxProps> = (props) => {
  const {
    width,
    height,
    readOnly,
    field,
    defaultValue,
    attributes,
    allowSetFieldsValue,
    multiple = false,
    nameAttribute,
    target,
  } = props;
  const attr = attributes?.find((item: schema.XAttribute) => item.id === props.name)!;
  const targetFormId = attr?.property?.formId;
  const [form, setForm] = useState<XForm>();
  const [formInst, setFormInst] = useState<IForm>();
  const [dataSource, setDataSource] = useState<XThing[]>(
    jsonParse(defaultValue, defaultValue),
  );
  // 点击选择数据
  const onClick = () => {
    if (!form) {
      return message.warning('未查询到关联表单，无法选择数据！');
    }
    EditModal.showFormSelect({
      form: form!,
      fields: formInst?.fields!,
      belong: (target as IBelong)!,
      multiple,
      onSave: (values) => {
        const dataSource: any = values.map((item: any) => ({
          ...item,
          formId: targetFormId,
          id: item.id,
          value: item.id,
          text: item[nameAttribute],
        }));
        // 需要设置表单值
        if (allowSetFieldsValue) {
          const toSetData = Object.keys(dataSource[0])
            .filter((id: any) => !isNaN(id) && id !== field.id)
            .reduce((pre: any, cur) => {
              pre[cur] = values[0][cur];
              return pre;
            }, {});
          toSetData[field.id] = JSON.stringify(dataSource);
          props.setFieldsValue && props.setFieldsValue(toSetData);
        } else {
          props.setFieldsValue &&
            props.setFieldsValue({
              [field.id]: JSON.stringify(dataSource),
            });
        }
        setDataSource(dataSource);
      },
    });
  };

  // 初始化
  useAsyncLoad(async () => {
    if (targetFormId) {
      let formList: XForm[] = [];
      if (target) {
        formList = (await target?.resource.formColl.find([targetFormId])) || [];
        if (formList.length) {
          // 设置表单
          setForm(formList[0]);
          const formInst = new Form(
            { ...formList[0], id: formList[0].id + '_' },
            target.directory,
          );
          await formInst.loadFields();
          // 设置表单实例
          setFormInst(formInst);
        }
      }
      return formInst;
    }
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'end',
        width: width as any,
      }}>
      <TextBox
        {...(_.omit(props, ['width']) as any)}
        style={readOnly ? { width: '100%' } : { width: 'calc(100% - 87px)' }}
        value={dataSource?.map((item) => item.text || '-').join('，')}
        placeholder="请勿手动输入，点击右侧选择数据操作"
        onValueChange={(e) => {
          if (!e) setDataSource([]);
        }}
      />
      {!readOnly && (
        <Button
          style={{ marginLeft: 10, height: height as any }}
          type="default"
          onClick={onClick}>
          选择数据
        </Button>
      )}
    </div>
  );
};
export default DataBox;
