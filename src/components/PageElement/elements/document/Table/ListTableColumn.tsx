import React from 'react';
import { defineElement } from '../../defineElement';
import { SEntity } from '@/ts/element/standard';
import { EnumTypeMeta, ExistTypeMeta } from '@/ts/element/ElementMeta';
import { Property } from 'csstype';

export default defineElement({
  render(props, ctx) {
    return <div>{props.label}</div>;
  },
  displayName: 'ListTableColumn',
  meta: {
    type: 'Document',
    label: '子表列',
    props: {
      prop: {
        type: 'type',
        label: '属性',
        typeName: 'propertyFile',
        readonly: true,
      } as ExistTypeMeta<SEntity | undefined>,
      label: {
        type: 'string',
        label: '标题',
        default: '列',
        required: true,
      },
      width: {
        type: 'type',
        typeName: 'size',
        label: '宽度',
        default: '',
      } as ExistTypeMeta<string>,
      align: {
        type: 'enum',
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
        ],
        label: '对齐方式',
        default: 'left',
      } as EnumTypeMeta<Property.TextAlign>,
      accuracy: {
        type: "number",
        label: "小数位数",
      },
      dateFormat: {
        type: "string",
        label: "日期格式",
      },
    },
    childrenFilter: () => {
      return false;
    },
  },
});
