import React from 'react';
import { Typography } from 'antd';
import { model, schema } from '@/ts/base';
import { ProColumns } from '@ant-design/pro-components';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { getUuid } from '@/utils/tools';

/** 人员信息列 */
export const PersonColumns: ProColumns<schema.XTarget>[] = [
  { title: '序号', valueType: 'index', width: 50 },
  {
    title: '名称',
    dataIndex: 'name',
    render: (_: any, record: schema.XTarget) => {
      return <EntityIcon entityId={record.id} showName />;
    },
  },
  { title: '账号', dataIndex: 'code' },
  { title: '手机号', dataIndex: ['team', 'code'] },
  {
    title: '座右铭',
    dataIndex: 'remark',
    render: (_: any, record: schema.XTarget) => {
      return (
        <Typography.Paragraph ellipsis={{ rows: 1, expandable: true, symbol: '更多' }}>
          {record.remark}
        </Typography.Paragraph>
      );
    },
  },
];

/** 身份信息列 */
export const IdentityColumn: ProColumns<schema.XIdentity>[] = [
  {
    title: '序号',
    valueType: 'index',
    width: 50,
  },
  {
    title: 'ID',
    dataIndex: 'id',
  },
  {
    title: '角色编号',
    dataIndex: 'code',
  },
  {
    title: '角色名称',
    dataIndex: 'name',
  },
  {
    title: '权限',
    dataIndex: 'name',
  },
  {
    title: '组织',
    dataIndex: 'shareId',
    render: (_: any, record: schema.XIdentity) => {
      return <EntityIcon entityId={record.shareId} showName />;
    },
  },
  {
    title: '备注',
    dataIndex: 'remark',
  },
];

/** 分类子项信息列 */
export const SpeciesItemColumn: ProColumns<schema.XSpeciesItem>[] = [
  // 序号下掉 影响table折叠样式
  // {
  //   title: '序号',
  //   valueType: 'index',
  //   width: 50,
  // },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '编号',
    dataIndex: 'code',
    key: 'code',
    width: 200,
  },
  {
    title: '信息',
    dataIndex: 'info',
    key: 'info',
    width: 200,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    width: 150,
  },
  {
    title: '归属组织',
    dataIndex: 'belongId',
    editable: false,
    key: 'belongId',
    width: 200,
    render: (_: any, record: schema.XSpeciesItem) => {
      return <EntityIcon entityId={record.belongId} showName />;
    },
  },
  {
    title: '创建人',
    dataIndex: 'createUser',
    editable: false,
    key: 'createUser',
    width: 150,
    render: (_: any, record: schema.XSpeciesItem) => {
      return <EntityIcon entityId={record.createUser} showName />;
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 200,
    editable: false,
  },
];

/** 人员分类 */
export const PersonTypeColumn: ProColumns<schema.XSpeciesItem>[] = [
  {
    title: '序号',
    valueType: 'index',
    width: 50,
  },
  {
    title: '头像',
    dataIndex: 'icon',
    key: 'icon',
    width: 100,
    render: (_: any, record: schema.XSpeciesItem) => {
      return <EntityIcon entityId={record.relevanceId} />;
    },
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '手机号',
    dataIndex: 'code',
    key: 'code',
    width: 200,
  },
  {
    title: '部门编号',
    dataIndex: 'departmentCode',
    key: 'departmentCode',
    width: 200,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    width: 150,
  },
];

/** 补齐物的列 */
export const FullThingColumns = (fields: model.FieldModel[], typeName?: string) => {
  return FullEntityColumns(
    [
      {
        id: 'chainId',
        code: 'chainId',
        name: '标识',
        valueType: '描述型',
        remark: '链标识',
      },
      ...fields,
    ],
    typeName,
  );
};

/** 补齐实体的列 */
export const FullEntityColumns = (fields: model.FieldModel[], typeName?: string) => {
  let result: model.FieldModel[] = [
    {
      id: 'id',
      code: 'id',
      name: '唯一标识',
      valueType: '描述型',
      remark: '由系统生成的唯一标记,无实义.',
      options: {
        fixed: true,
        visible: true,
      },
    },
  ];
  if (typeName == '报表') {
    result.push({
      id: 'period',
      code: 'period',
      name: '期间',
      valueType: '描述型',
      remark: '期间',
      options: {
        fixed: true,
        visible: true,
      },
    });
  }
  [
    {
      id: 'name',
      code: 'name',
      name: '名称',
      valueType: '描述型',
      remark: '描述信息',
    },
    {
      id: 'code',
      code: 'code',
      name: '代码',
      valueType: '描述型',
      remark: '标识代码',
    },
  ].forEach((item) => {
    if (!fields.find((field) => field.id === item.id)) {
      result.push(item);
    }
  });
  result.push(...fields);
  [
    {
      id: 'belongId',
      code: 'belongId',
      name: '归属',
      valueType: '用户型',
      remark: '归属用户',
    },
    {
      id: 'createUser',
      code: 'createUser',
      name: '创建人',
      valueType: '用户型',
      remark: '创建标识的人',
    },
    {
      id: 'updateUser',
      code: 'updateUser',
      name: '变更人',
      valueType: '用户型',
      remark: '变更数据的人',
    },
    {
      id: 'createTime',
      code: 'createTime',
      name: '创建时间',
      valueType: '时间型',
      remark: '创建标识的时间',
    },
    {
      id: 'updateTime',
      code: 'updateTime',
      name: '修改时间',
      valueType: '时间型',
      remark: '最新修改时间',
    },
  ].forEach((item) => {
    if (!fields.find((field) => field.id === item.id)) {
      result.push(item);
    }
  });
  return result;
};

export const FullProperties = (typeName: string) => {
  switch (typeName) {
    case '虚拟商品':
      return ProductProperties();
    case '实体商品':
      return PhysicalProperties(ProductProperties());
    case '报表数据':
      return ReportProperties();
    case '办事数据':
      return WorkProperties();
    case '空间场地数据':
      return SpeacProperties();
    case '空间上架数据':
      return SpeacTimeProperties();
    case '虚拟列':
      return VirtualColumn();
    default:
      return [];
  }
};

export const PhysicalProperties = (props: schema.XProperty[]) => {
  return [
    {
      id: 'images',
      name: '缩略图',
      code: 'images',
      valueType: '附件型',
      remark: '缩略图',
    },
    {
      id: 'count',
      name: '实体商品数量',
      code: 'count',
      valueType: '描述型',
      remark: '实体商品数量',
    },
    ...props,
  ] as schema.XProperty[];
};

/** 商品属性 */
export const ProductProperties = () => {
  return [
    {
      id: 'icons',
      name: '图标组',
      code: 'icons',
      valueType: '附件型',
      remark: '图标组',
    },
    {
      id: 'title',
      name: '商品名称',
      code: 'title',
      valueType: '描述型',
      remark: '商品名称',
    },
    {
      id: 'typeName',
      name: '商品类型',
      code: 'typeName',
      valueType: '描述型',
      remark: '商品价格',
    },
    {
      id: 'mode',
      name: '模式（共享、交易）',
      code: 'mode',
      valueType: '描述型',
      remark: '模式（共享、交易）',
    },
    {
      id: 'brand',
      name: '品牌',
      code: 'brand',
      valueType: '描述型',
      remark: '品牌',
    },
    {
      id: 'price',
      name: '商品价格',
      code: 'price',
      valueType: '数值型',
      remark: '商品价格',
    },
    {
      id: 'belongId',
      code: 'belongId',
      name: '供给方',
      valueType: '用户型',
      remark: '供给方',
    },
    {
      id: 'remark',
      name: '商品描述',
      code: 'remark',
      valueType: '描述型',
      remark: '商品描述',
    },
    {
      id: 'status',
      name: '商品状态',
      code: 'status',
      valueType: '描述型',
      remark: '商品状态',
    },
    {
      id: 'introduceInfo',
      name: '商品概括',
      code: 'introduceInfo',
      valueType: '描述型',
      remark: '商品概括',
    },
    {
      id: 'useInfo',
      name: '功能介绍',
      code: 'useInfo',
      valueType: '描述型',
      remark: '功能介绍',
    },
    {
      id: 'introduceImage',
      name: '商品概括图',
      code: 'introduceImage',
      valueType: '附件型',
      remark: '商品概括图',
    },
    {
      id: 'useInfoImage',
      name: '功能介绍图',
      code: 'useInfoImage',
      valueType: '附件型',
      remark: '功能介绍图',
    },
    {
      id: 'latitudeAndLongitude',
      name: '经纬度',
      code: 'latitudeAndLongitude',
      valueType: '地图型',
      remark: '经纬度',
    },
  ] as schema.XProperty[];
};

/** 报表属性 */
export const ReportProperties = () => {
  return [
    {
      id: 'period',
      name: '期间',
      code: 'period',
      valueType: '描述型',
      remark: '期间',
    },
  ] as schema.XProperty[];
};
/** 办事属性 */
export const WorkProperties = () => {
  return [
    {
      id: 'title',
      name: '标题',
      code: 'title',
      valueType: '描述型',
      remark: '标题',
    },
    {
      id: 'defineId',
      name: '办事名称',
      code: 'defineId',
      valueType: '办事流程',
      remark: '办事流程',
    },
    {
      id: 'status',
      code: 'status',
      name: '状态',
      valueType: '选择型',
      remark: '状态',
      options: {
        visible: true,
      },
      /** 字典(字典项/分类项) */
      lookups: [
        {
          id: 1,
          text: '审核中',
          value: 1,
        },
        {
          id: 100,
          text: '通过',
          value: 100,
        },
        {
          id: '200',
          text: '驳回',
          value: 200,
        },
        {
          id: '240',
          text: '流程重置',
          value: 240,
        },
      ],
    },
    {
      id: 'content',
      code: 'content',
      name: '摘要',
      valueType: '描述型',
      remark: '摘要',
      options: {
        visible: true,
      },
    },
    {
      id: 'remark',
      code: 'remark',
      name: '备注',
      valueType: '描述型',
      remark: '备注',
      options: {
        visible: true,
      },
    },
    {
      id: 'createUser',
      name: '提交人',
      code: 'createUser',
      valueType: '用户型',
      remark: '提交人',
    },
    {
      id: 'createTime',
      name: '提交时间',
      code: 'createTime',
      valueType: '时间型',
      remark: '提交时间',
    },
    {
      id: 'updateTime',
      name: '更新时间',
      code: 'updateTime',
      valueType: '时间型',
      remark: '更新时间',
    },
  ] as schema.XProperty[];
};

export const SpeacProperties = () => {
  return [
    {
      id: 'title',
      name: '场地名称',
      code: 'title',
      valueType: '描述型',
      remark: '上架名称',
    },
    {
      id: 'latitudeAndLongitude',
      name: '经纬度',
      code: 'latitudeAndLongitude',
      valueType: '地图型',
      remark: '经纬度',
    },
    {
      id: 'images',
      name: '缩略图',
      code: 'images',
      valueType: '附件型',
      remark: '缩略图',
    },
    {
      id: 'introduceInfo',
      name: '商品概括',
      code: 'introduceInfo',
      valueType: '描述型',
      remark: '商品概括',
    },
    {
      id: 'useInfo',
      name: '功能介绍',
      code: 'useInfo',
      valueType: '描述型',
      remark: '功能介绍',
    },
    {
      id: 'introduceImage',
      name: '商品概括图',
      code: 'introduceImage',
      valueType: '附件型',
      remark: '商品概括图',
    },
    {
      id: 'useInfoImage',
      name: '功能介绍图',
      code: 'useInfoImage',
      valueType: '附件型',
      remark: '功能介绍图',
    },
    {
      id: 'paymentMethod',
      name: '付款方式',
      code: 'paymentMethod',
      valueType: '描述型',
      remark: '付款方式',
    },
    {
      id: 'paymentInformation',
      name: '付款信息',
      code: 'paymentInformation',
      valueType: '附件型',
      remark: '付款信息',
    },
  ] as schema.XProperty[];
};
export const SpeacTimeProperties = () => {
  return [
    {
      id: 'price',
      name: '场地价格',
      code: 'price',
      valueType: '数值型',
      remark: '场地价格',
    },
    {
      id: 'startHours',
      name: '开始时间',
      code: 'startHours',
      valueType: '时间型',
      remark: '开始时间',
    },
    {
      id: 'endHours',
      name: '结束时间',
      code: 'endHours',
      valueType: '时间型',
      remark: '结束时间',
    },
    {
      id: 'openingHoursImage',
      name: '开放时间介绍图',
      code: 'openingHoursImage',
      valueType: '附件型',
      remark: '开放时间介绍图',
    },
    {
      id: 'fieldId',
      name: '场地属性ID',
      code: 'fieldId',
      valueType: '描述型',
      remark: '场地属性ID',
    },
    {
      id: 'remarks',
      name: '备注信息',
      code: 'remarks',
      valueType: '描述型',
      remark: '备注信息',
    },
    {
      id: 'mode',
      name: '模式（空间共享）',
      code: 'mode',
      valueType: '描述型',
      remark: '模式（空间共享）',
    },
  ] as schema.XProperty[];
};
export const VirtualColumn = () => {
  return [
    {
      id: 'virtualColumn'+getUuid(),
      name: '虚拟列',
      code: getUuid(),
      valueType: '描述型',
      remark: '虚拟列',
    },
  ];
};
