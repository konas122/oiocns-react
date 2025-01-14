import { EditModal } from '@/executor/tools/editModal';
import useStorage from '@/hooks/useStorage';
import { model, schema } from '@/ts/base';
import FormService from '@/ts/scripting/core/services/FormService';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import React, { useEffect, useState } from 'react';
import { getItemNums } from '../Utils';
import FormItem from './formItem';
import _, { cloneDeep } from 'lodash';
import { Divider } from 'antd';
import styles from './index.module.less';

interface IWorkFormProps {
  data: { [key: string]: any };
  allowEdit: boolean;
  info?: model.FormInfo;
  service: FormService;
}

const WorkFormViewer: React.FC<IWorkFormProps> = (props) => {
  const [colNum, setColNum] = useStorage('workFormColNum', '一列');
  const [fields, setFields] = useState<(schema.XGroups | model.FieldModel)[]>(
    props.service.fields,
  );
  useEffect(() => {
    if (!props.service.fields) return;
    const attributes: (schema.XGroups | model.FieldModel)[] = cloneDeep(
      props.service.fields,
    );
    if (props.service.form.groups?.length) {
      props.service.form.groups.forEach((group) => {
        attributes.splice(group.index, 0, group);
      });
    }
    setFields(attributes);
  }, []);

  return (
    <div>
      <Toolbar style={{ marginBottom: '10px' }}>
        <Item
          location="after"
          locateInMenu="never"
          widget="dxButton"
          visible={props.allowEdit && props.info?.allowSelect}
          options={{
            text: '数据选择',
            type: 'default',
            stylingMode: 'outlined',
            onClick: () => {
              EditModal.showFormSelect({
                form: props.service.form,
                fields: props.service.fields,
                belong: props.service.target,
                multiple: false,
                onSave: (values) => {
                  if (values.length > 0) {
                    if (props.info?.allowEdit) {
                      _.assign(
                        props.data,
                        _.pick(values[0], [
                          'id',
                          'code',
                          'name',
                          'chainId',
                          'belongId',
                          'createUser',
                          'createTime',
                        ]),
                      );
                    }
                    props.service.setFieldsValue(values[0]);
                  }
                },
              });
            },
          }}
        />
        <Item
          location="after"
          locateInMenu="never"
          widget="dxSelectBox"
          options={{
            text: '项排列',
            value: colNum,
            items: getItemNums(),
            onItemClick: (e: { itemData: string }) => {
              setColNum(e.itemData);
            },
          }}
        />
      </Toolbar>
      <div
        className={styles.dragList}
        style={{ display: 'flex', width: '100%', flexWrap: 'wrap', gap: 10 }}>
        <FormItem
          key={'name'}
          data={props.data}
          numStr={colNum}
          rules={[]}
          readOnly={props.allowEdit}
          field={
            {
              id: 'name',
              name: '名称',
              code: 'name',
              valueType: '描述型',
              remark: '数据的名称。',
              options: { hideField: true },
            } as model.FieldModel
          }
          belong={props.service.belong}
          service={props.service}
        />
        {fields.map((field) => {
          if (!('id' in field)) {
            return (
              <div className={styles['groups']} key={field.name}>
                <Divider type="vertical" className={styles['divider']} />
                <span>{field.name}</span>
              </div>
            );
          } else {
            return (
              <FormItem
                key={field.id}
                data={props.data}
                form={props.service.form}
                numStr={colNum}
                rules={[
                  ...(props.service.formData?.rules ?? []),
                  ...(props.service.work?.model.rules ?? []),
                ].filter((a) => a.destId == field.id)}
                readOnly={!props.allowEdit}
                field={field as model.FieldModel}
                belong={props.service.belong}
                service={props.service}
                onValuesChange={(field, value) => {
                  props.service.onValueChange(field, value, props.data);
                }}
                setFieldsValue={(data) => props.service.setFieldsValue(data)}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default WorkFormViewer;
