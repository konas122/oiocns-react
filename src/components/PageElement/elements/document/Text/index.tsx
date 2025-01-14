import React, { CSSProperties } from 'react';
import { defineElement } from '../../defineElement';
import './index.less';
import { EnumTypeMeta, ExistTypeMeta } from '@/ts/element/ElementMeta';
import { Property } from 'csstype';

export default defineElement({
  render(props, ctx) {
    const style: CSSProperties = {
      fontSize: props.fontSize,
      textAlign: props.textAlign,
      fontFamily: props.fontFamily,
      color: props.color,
      lineHeight: props.lineHeight,
    };
    if (props.bold) style['fontWeight'] = 'bold';
    if (props.italic) style['fontStyle'] = 'italic';
    if (props.underline) style['textDecoration'] = 'underline';

    return (
      <div className="document-text" style={style}>
        <span>{props.text}</span>
        {props.children.map((c) => {
          const Render = ctx.view.components.getComponentRender(c.kind, ctx.view.mode);
          return <Render key={c.id} element={c} />;
        })}
      </div>
    );
  },
  displayName: 'Text',
  meta: {
    label: '文本',
    type: 'Document',
    props: {
      text: {
        type: 'string',
        label: '文本',
        default: '文本内容',
        inputType: 'textarea',
      },
      fontSize: {
        type: 'enum',
        options: [
          { label: '9（小五）', value: '9pt' },
          { label: '10.5（五号）', value: '10.5pt' },
          { label: '12（小四）', value: '12pt' },
          { label: '14（四号）', value: '14pt' },
          { label: '15（小三）', value: '15pt' },
          { label: '16（三号）', value: '16pt' },
          { label: '18（小二）', value: '18pt' },
          { label: '22（二号）', value: '22pt' },
          { label: '24（小一）', value: '24pt' },
          { label: '26（一号）', value: '26pt' },
          { label: '28', value: '28pt' },
          { label: '32', value: '32pt' },
          { label: '36（小初）', value: '36pt' },
          { label: '40', value: '40pt' },
          { label: '42（初号）', value: '42pt' },
          { label: '44', value: '44pt' },
          { label: '48', value: '48pt' },
          { label: '52', value: '52pt' },
          { label: '60', value: '60pt' },
          { label: '64', value: '64pt' },
          { label: '72', value: '72pt' },
        ],
        label: '字号',
        default: '12pt',
      } as EnumTypeMeta<string>,
      fontFamily: {
        type: 'enum',
        options: [
          { label: '(默认)', value: '' },
          { label: '宋体', value: '宋体' },
          { label: '黑体', value: '黑体' },
          { label: '楷体', value: '楷体' },
          { label: '仿宋', value: '仿宋' },
        ],
        label: '字体',
        default: '',
      },
      bold: {
        type: 'boolean',
        label: '加粗',
        default: false,
      },
      italic: {
        type: 'boolean',
        label: '斜体',
        default: false,
      },
      underline: {
        type: 'boolean',
        label: '下划线',
        default: false,
      },
      color: {
        type: 'type',
        typeName: 'color',
        label: '颜色',
        default: '',
      } as ExistTypeMeta<string>,
      textAlign: {
        type: 'enum',
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
        ],
        label: '对齐方式',
        default: 'left',
      } as EnumTypeMeta<Property.TextAlign>,
      lineHeight: {
        type: 'type',
        typeName: 'size',
        label: '行高',
        default: '1.5em',
      } as ExistTypeMeta<string>,
    },
    childrenFilter: (element: { name: string }) => {
      return element.name != 'Paper' && element.name != 'ListTableColumn';
    },
  },
});
