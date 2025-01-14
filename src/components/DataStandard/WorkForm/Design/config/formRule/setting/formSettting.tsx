import React, { useState } from 'react';
import { Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { IForm } from '@/ts/core';
import { schema } from '@/ts/base';
import OpenFileDialog from '@/components/OpenFileDialog';

interface Iprops {
  current: IForm;
  value?: schema.XForm[] | undefined;
  fieldName: string;
  onValueChanged: Function;
  onConditionsDelete: Function;
}

const FormSettting: React.FC<Iprops> = ({
  current,
  value,
  fieldName,
  onValueChanged,
  onConditionsDelete,
}) => {
  const [formModel, setFormModel] = useState<boolean>(false);
  const [val] = useState<schema.XForm[]>(value || ([] as schema.XForm[]));

  return (
    <div>
      {val[0]?.name}
      {val.length > 0 ? (
        <span>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setFormModel(true);
            }}>
            编辑表单绑定
          </Button>
          <Popconfirm
            key={'delete'}
            title="确定删除吗？"
            onConfirm={() => {
              onConditionsDelete(fieldName);
            }}>
            <Button type="link" icon={<DeleteOutlined />} danger>
              删除条件
            </Button>
          </Popconfirm>
        </span>
      ) : (
        <Button
          type="link"
          onClick={() => {
            setFormModel(true);
          }}>
          选择表单绑定
        </Button>
      )}

      {formModel && (
        <OpenFileDialog
          title={`选择表单`}
          rootKey={current.spaceKey}
          accepts={['表单']}
          excludeIds={val.map((i) => i.id)}
          onCancel={() => setFormModel(false)}
          onOk={(files) => {
            if (files.length > 0) {
              const forms = (files as unknown[] as IForm[]).map((i) => i.metadata);
              onValueChanged(forms, fieldName);
            }
            setFormModel(false);
          }}
        />
      )}
    </div>
  );
};
export default FormSettting;
