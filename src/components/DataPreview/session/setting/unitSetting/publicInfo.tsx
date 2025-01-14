import React, { useState, useEffect, useRef } from 'react';
import { Button, Card } from 'antd';
import { ITarget } from '@/ts/core';
import SchemaForm from '@/components/SchemaForm';
import { TargetModel } from '@/ts/base/model';
import UploadItem from '@/executor/tools/uploadItem';
import { ProFormColumnsType, ProFormLayoutType } from '@ant-design/pro-components';
import { FormInstance } from '@ant-design/pro-components';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import QrCode from 'qrcode.react';
import { Theme } from '@/config/theme';
import type { ProFormInstance } from '@ant-design/pro-components';

interface IProps {
  target: ITarget;
  readonly?: boolean;
}
interface IPulicInfoForm {
  layoutType: ProFormLayoutType;
  finished?: (values: any, open?: boolean) => void;
  columns: ProFormColumnsType<TargetModel>[];
  open?: boolean;
}

const PublicInfo: React.FC<IProps> = ({ target, readonly }) => {
  const { id, remark, icon, name, code, storeId, createUser, typeName } =
    target?.metadata || {};
  const [layoutType, setLayoutType] = useState('Form');
  const hasRelationAuth = target.hasRelationAuth();
  const columns = [
    {
      title: '群组头像',
      dataIndex: 'icon',
      colProps: { span: 8 },
      show: 'ModalForm,Form',
      renderFormItem: (_: any, __: any, form: FormInstance) => {
        return (
          <>
            <UploadItem
              readonly={layoutType !== 'ModalForm'}
              typeName={typeName}
              icon={icon || ''}
              onChanged={(icon) => {
                form.setFieldValue('icon', icon);
              }}
              directory={target.directory}
            />
          </>
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      initialValue: name,
      readonly: readonly,
      colProps: { span: 8 },
      show: 'ModalForm,Form',
    },
    {
      title: '归属',
      dataIndex: 'createUser',
      initialValue: createUser,
      readonly: readonly,
      colProps: { span: 8 },
      show: 'ModalForm,Form',
    },
    {
      title: '群组账号',
      dataIndex: 'code',
      initialValue: code,
      readonly: readonly,
      colProps: { span: 8 },
      show: 'ModalForm,Form',
    },
    {
      title: '当前数据核',
      dataIndex: 'storeId',
      readonly: readonly,
      colProps: { span: 8 },
      show: 'Form',
      render: () => {
        return <EntityIcon entityId={storeId as string} showName />;
      },
    },
    {
      title: '二维码',
      readonly: readonly,
      colProps: { span: 8 },
      show: 'Form',
      render: (_: any, __: any, form: FormInstance) => {
        return (
          <QrCode
            level="H"
            size={100}
            renderAs="canvas"
            title={`${location.origin}/${id}`}
            fgColor={Theme.FocusColor}
            value={`${location.origin}/${id}`}
          />
        );
      },
    },
    {
      title: '简介',
      dataIndex: 'remark',
      valueType: 'textarea',
      initialValue: remark,
      show: 'ModalForm,Form',
      readonly: readonly,
    },
  ];
  const [finColumns, setFinColumns] = useState<ProFormColumnsType<TargetModel>[]>(
    columns as ProFormColumnsType<TargetModel>[],
  );
  const extra = hasRelationAuth ? (
    <Button
      type="primary"
      onClick={() => {
        setLayoutType('ModalForm');
      }}>
      编辑信息
    </Button>
  ) : null;
  const formRef = useRef<ProFormInstance>();
  const PulicInfoForm: React.FC<IPulicInfoForm> = ({
    layoutType,
    finished,
    columns,
    open = true,
  }) => {
    const [modelOpen, setModelOpen] = useState(open);
    const otherConfig =
      layoutType === 'ModalForm'
        ? {
            onOpenChange: (val: boolean) => {
              if (!val) {
                finished && finished({});
              }
              setModelOpen(val);
            },
          }
        : {};
    return (
      <SchemaForm<TargetModel>
        open={modelOpen}
        grid={true}
        title={'公开信息'}
        formRef={formRef}
        width={640}
        columns={columns}
        rowProps={{
          gutter: layoutType === 'ModalForm' ? [24, 0] : [0, 0],
        }}
        layoutType={layoutType}
        submitter={{
          render: (_: any, doms: any) => {
            return layoutType === 'ModalForm' ? [...doms] : [];
          },
        }}
        onFinish={async (values) => {
          finished && finished(values, open);
        }}
        {...otherConfig}
      />
    );
  };
  const getColumns = () => {
    return (
      columns
        .map((column) => {
          if (~column.show.indexOf(layoutType)) {
            return { ...column, readonly: false, colProps: { span: 24 } };
          }
        })
        .filter((item) => item) || []
    );
  };
  useEffect(() => {
    const finColumns = (getColumns() || []) as ProFormColumnsType<TargetModel>[];
    setFinColumns(finColumns);
  }, [layoutType]);
  return (
    <Card title="公开信息" extra={extra}>
      {layoutType === 'ModalForm' ? (
        <PulicInfoForm
          columns={finColumns}
          layoutType="ModalForm"
          open={true}
          finished={async (values) => {
            if (!values || !Object.keys(values).length) {
              setLayoutType('Form');
              return;
            }
            if (await target.update(values)) setLayoutType('Form');
          }}
        />
      ) : null}
      <PulicInfoForm
        columns={columns as ProFormColumnsType<TargetModel>[]}
        layoutType="Form"
      />
    </Card>
  );
};

export default PublicInfo;
