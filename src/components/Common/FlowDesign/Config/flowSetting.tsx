import React, { useRef, useState } from 'react';
import { Button, Card } from 'antd';
import { IAuthority, IWork, TargetType } from '@/ts/core';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import SchemaForm from '@/components/SchemaForm';
import { model } from '@/ts/base';
import { DefaultOptionType } from 'antd/lib/select';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { ProFormColumnsType, ProFormInstance } from '@ant-design/pro-form';
import { WorkDefineModel } from '@/ts/base/model';

interface FlowSettingType {
  current: IWork;
}
const FlowSetting: React.FC<FlowSettingType> = ({ current }) => {
  let initialValue: any = current.metadata;
  const formRef = useRef<ProFormInstance>();
  const [readonly, setReadonly] = useState(true);

  const [treeData, setTreeData] = useState<any[]>([]);
  const [applyAuths, setApplyAuths] = useState<any[]>([]);
  const [loaded] = useAsyncLoad(async () => {
    const getTreeData = (targets: IAuthority[]): DefaultOptionType[] => {
      return targets.map((item: IAuthority) => {
        return {
          label: item.name,
          value: item.id,
          children:
            item.children && item.children.length > 0 ? getTreeData(item.children) : [],
        };
      });
    };
    const getTreeValue = (applyAuth: string, auths: IAuthority[]): string[] => {
      const applyAuths: string[] = [];
      if (applyAuth == '0') {
        return ['0'];
      }
      for (const auth of auths) {
        if (auth.id == applyAuth) {
          return [auth.id];
        }
        const childAuth = getTreeValue(applyAuth, auth.children);
        if (childAuth.length > 0) {
          applyAuths.push(auth.id, ...childAuth);
        }
      }
      return applyAuths;
    };
    let tree = await current.directory.target.space.loadSuperAuth(false);
    if (tree) {
      setApplyAuths(getTreeValue(initialValue.applyAuth ?? '0', [tree]));
      setTreeData([
        ...[{ label: '全员', value: '0', children: [] }],
        ...getTreeData([tree]),
      ]);
    }
  }, [current.id]);
  const workTypes = ['办事'];
  if (TargetType.Group == current.directory.target.typeName) {
    workTypes.push('集群模板');
  }
  if (!loaded) return <></>;
  const columns: ProFormColumnsType<WorkDefineModel>[] = [
    {
      title: '事项名称',
      readonly: true,
      dataIndex: 'name',
      formItemProps: {
        rules: [{ required: true, message: '事项名称为必填项' }],
      },
    },
    {
      title: '事项类型',
      dataIndex: 'typeName',
      valueType: 'select',
      initialValue: '办事',
      readonly: readonly,
      fieldProps: {
        options: workTypes.map((i) => {
          return {
            value: i,
            label: i,
          };
        }),
      },
      formItemProps: {
        rules: [{ required: true, message: '事项类型为必填项' }],
      },
    },
    {
      title: '发起方式',
      dataIndex: 'applyType',
      valueType: 'select',
      initialValue: '默认',
      readonly: readonly,
      fieldProps: {
        options: [
          { text: '默认', value: '默认' },
          { text: '选择', value: '选择' },
          { text: '列表', value: '列表' },
          { text: '财务', value: '财务' },
          { text: '总账', value: '总账' },
          { text: '组合办事', value: '组合办事' },
        ],
      },
      formItemProps: {
        rules: [{ required: true, message: '事项类型为必填项' }],
      },
    },
    {
      title: '设置权限',
      readonly: readonly,
      colProps: { span: 24 },
      dataIndex: 'applyAuths',
      valueType: 'cascader',
      initialValue: applyAuths,
      formItemProps: { rules: [{ required: true, message: '请选择发起权限' }] },
      fieldProps: {
        showCheckedStrategy: 'SHOW_CHILD',
        changeOnSelect: true,
        options: treeData,
        displayRender: (labels: string[]) => labels[labels.length - 1],
      },
    },
    {
      title: '是否允许直接发起',
      dataIndex: 'allowInitiate',
      initialValue: false,
      valueType: 'select',
      readonly: readonly,
      fieldProps: {
        options: [
          {
            value: true,
            label: '允许',
          },
          {
            value: false,
            label: '不允许',
          },
        ],
      },
      formItemProps: {
        rules: [{ required: true, message: '事项类型为必填项' }],
      },
    },
    {
      title: '是否允许跨流程查看',
      dataIndex: 'isPrivate',
      valueType: 'select',
      initialValue: false,
      readonly: readonly,
      fieldProps: {
        options: [
          {
            value: false,
            label: '允许',
          },
          {
            value: true,
            label: '不允许',
          },
        ],
      },
      formItemProps: {
        rules: [{ required: true, message: '事项类型为必填项' }],
      },
    },
    {
      title: '是否允许进行催办',
      dataIndex: 'canUrge',
      valueType: 'select',
      initialValue: false,
      readonly: readonly,
      fieldProps: {
        options: [
          {
            value: true,
            label: '允许',
          },
          {
            value: false,
            label: '不允许',
          },
        ],
      },
      formItemProps: {
        rules: [{ required: true, message: '事项类型为必填项' }],
      },
    },
    {
      title: '备注',
      readonly: readonly,
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '分类定义为必填项' }],
      },
    },
  ];
  return (
    <div>
      <Card
        title="配置信息"
        extra={
          current.isUsed && (
            <Button
              type="primary"
              size="small"
              icon={readonly ? <EditOutlined /> : <CheckOutlined />}
              onClick={async () => {
                if (!readonly) {
                  await (current as IWork).update({ ...initialValue, node: undefined });
                }
                setReadonly(!readonly);
              }}>
              {readonly ? '编辑' : '保存'}
            </Button>
          )
        }>
        <SchemaForm<model.WorkDefineModel>
          open
          ref={formRef}
          key={current.id}
          layoutType="Form"
          initialValues={current.metadata}
          title={current.name}
          submitter={false}
          rowProps={{
            gutter: [24, 0],
          }}
          onValuesChange={async (values: any) => {
            initialValue = Object.assign(initialValue, values);
          }}
          columns={columns}
          onFinish={() => {}}
        />
      </Card>
    </div>
  );
};

export default FlowSetting;
