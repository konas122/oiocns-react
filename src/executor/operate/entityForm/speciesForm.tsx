import React, { useState } from 'react';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { IApplication, IDirectory, IGroup, TargetType } from '@/ts/core';
import UploadItem from '../../tools/uploadItem';
import { ISpecies } from '@/ts/core';
import { EntityColumns } from './entityColumns';
import { schema } from '@/ts/base';
import { Button } from 'antd';
import OpenFileDialog from '@/components/OpenFileDialog';
import GroupTree from '@/components/GroupTree';
interface Iprops {
  formType: string;
  typeName: string;
  current: IDirectory | ISpecies;
  finished: () => void;
}
/*
  编辑
*/
const SpeciesForm = (props: Iprops) => {
  const [open, setOpen] = useState(true);
  const [selectModal, setSelectModal] = useState(<></>);
  const [selectedFile, setSelectedFile] = useState<IApplication | IGroup>();
  let title = '';
  let directory: IDirectory;
  let species: ISpecies | undefined;
  const readonly = props.formType === 'remark';
  let initialValue: any = props.current.metadata;
  switch (props.formType) {
    case 'new':
      title = '新建' + props.typeName;
      initialValue = {};
      directory = props.current as IDirectory;
      break;
    case 'update':
      species = props.current as ISpecies;
      directory = species.directory;
      title = '更新' + props.typeName;
      break;
    case 'remark':
      species = props.current as ISpecies;
      directory = species.directory;
      title = '查看' + props.typeName;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XSpecies>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={readonly}
            typeName={props.typeName}
            icon={initialValue.icon}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={directory}
          />
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '分类名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '分类代码为必填项' }],
      },
    },
  ];
  if (props.typeName === '字典') {
    if (props.formType === 'new' || props.current.metadata.isPersonnel) {
      columns.push({
        title: '是否为人员分类',
        dataIndex: 'isPersonnel',
        valueType: 'switch',
        readonly: props.formType !== 'new' ? true : false,
        colProps: { span: 12 },
        render: () => {
          return <div>是</div>;
        },
      });
    }
  } else {
    columns.push(
      {
        title: '分类标签',
        dataIndex: 'tags',
        valueType: 'select',
        colProps: { span: 24 },
        readonly: props.formType !== 'new',
        fieldProps: {
          options: ['分类', '应用分类', '组织分类'].map((i) => {
            return {
              value: i,
              label: i,
            };
          }),
        },
      },
      {
        valueType: 'dependency',
        name: ['tags'],
        columns: ({ tags }) => {
          if (props.formType !== 'new') return [];
          switch (tags) {
            case '应用分类':
              return [
                {
                  title: '选择应用',
                  dataIndex: 'selectFile',
                  colProps: { span: 24 },
                  renderFormItem: (_, __, form) => {
                    return (
                      <Button
                        onClick={() => {
                          setSelectModal(
                            <OpenFileDialog
                              multiple={false}
                              title="选择应用"
                              accepts={['应用']}
                              rootKey={props.current.spaceKey}
                              onOk={async (files) => {
                                if (files[0]) {
                                  const { name, code, remark } = files[0];
                                  form.setFieldsValue({
                                    selectApp: files[0].name,
                                    name,
                                    code,
                                    remark,
                                  });
                                  setSelectedFile(files[0] as IApplication);
                                }
                                setSelectModal(<></>);
                              }}
                              onCancel={() => setSelectModal(<></>)}
                            />,
                          );
                        }}>
                        选择应用
                      </Button>
                    );
                  },
                },
              ];
            case '组织分类':
              return [
                {
                  title: '选择组织',
                  dataIndex: 'selectFile',
                  colProps: { span: 24 },
                  renderFormItem: (_, __, form) => {
                    return (
                      <GroupTree
                        key={props.current.spaceKey}
                        onChange={(file: IGroup) => {
                          const { name, code, remark } = file;
                          form.setFieldsValue({
                            selectApp: file.name,
                            name,
                            code,
                            remark,
                          });
                          setSelectedFile(file);
                        }}
                        target={props.current.target}
                        rootDisable={false}
                        resultType="file"
                        accept={[TargetType.Group]}
                      />
                    );
                  },
                },
              ];
            default:
              return [];
          }
        },
      },
    );
  }
  if (readonly) {
    columns.push(...EntityColumns(props.current!.metadata));
  }
  columns.push({
    title: '备注信息',
    dataIndex: 'remark',
    valueType: 'textarea',
    colProps: { span: 24 },
    readonly: readonly,
    formItemProps: {
      rules: [{ required: true, message: '备注信息为必填项' }],
    },
  });
  return (
    <>
      <SchemaForm<schema.XSpecies>
        open={open}
        title={title}
        width={640}
        columns={columns}
        initialValues={initialValue}
        rowProps={{
          gutter: [24, 0],
        }}
        layoutType="ModalForm"
        onOpenChange={(open: boolean) => {
          if (!open) {
            props.finished();
          }
        }}
        onFinish={async (values) => {
          values.typeName = props.typeName;
          switch (props.formType) {
            case 'update':
              await species!.update(values);
              break;
            case 'new':
              {
                switch (values.tags) {
                  case '组织分类':
                  case '应用分类':
                    if (selectedFile && 'toSpecies' in selectedFile) {
                      await selectedFile.toSpecies(directory);
                      setOpen(false);
                    }
                    break;
                  default:
                    await directory.standard.createSpecies(values);
                    break;
                }
              }
              break;
          }
          props.finished();
        }}
      />
      {selectModal}
    </>
  );
};

export default SpeciesForm;
