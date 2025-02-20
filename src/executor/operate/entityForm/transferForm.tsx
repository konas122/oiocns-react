import SchemaForm from '@/components/SchemaForm';
import { Transfer } from '@/ts/base/model';
import { IDirectory } from '@/ts/core';
import { ITransfer } from '@/ts/core/';
import { ProFormColumnsType, ProFormInstance } from '@ant-design/pro-components';
import React, { createRef } from 'react';
import { generateCodeByInitials } from '@/utils/tools';

interface IProps {
  formType: string;
  current: IDirectory | ITransfer;
  finished: (link?: ITransfer) => void;
}

const TransferForm: React.FC<IProps> = ({ formType, current, finished }) => {
  let initialValue = {};
  switch (formType) {
    case 'updateTransferConfig':
      initialValue = current.metadata;
      break;
  }
  const formRef = createRef<ProFormInstance>();
  const columns: ProFormColumnsType<Transfer>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      formItemProps: {
        rules: [{ required: true, message: '名称为必填项' }],
      },
    },
    {
      title: '编码',
      dataIndex: 'code',
      formItemProps: {
        rules: [{ required: true, message: '编码为必填项' }],
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
    },
  ];
  return (
    <SchemaForm<Transfer>
      formRef={formRef}
      open
      title="配置定义"
      width={640}
      columns={columns}
      initialValues={initialValue}
      rowProps={{
        gutter: [24, 0],
      }}
      layoutType="ModalForm"
      onOpenChange={(open: boolean) => {
        if (!open) {
          finished();
        }
      }}
      onValuesChange={async (values: any) => {
        if (Object.keys(values)[0] === 'name') {
          formRef.current?.setFieldValue('code', generateCodeByInitials(values['name']));
        }
      }}
      onFinish={async (values) => {
        switch (formType) {
          case 'newTransferConfig': {
            values.typeName = '迁移配置';
            let directory = current as IDirectory;
            await directory.standard.createTransfer(values);
            finished();
            break;
          }
          case 'updateTransferConfig': {
            let transfer = current as ITransfer;
            transfer.update({ ...initialValue, ...values });
            finished();
            break;
          }
        }
      }}
    />
  );
};

export default TransferForm;
