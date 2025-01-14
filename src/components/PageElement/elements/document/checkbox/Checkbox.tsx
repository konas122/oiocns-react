import React, { CSSProperties, ReactNode } from 'react';
import { defineElement } from '../../defineElement';
import './index.less';
import DocumentViewerManager from '@/executor/open/document/view/ViewerManager';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { fontFamily } from 'html2canvas/dist/types/css/property-descriptors/font-family';

export default defineElement({
  render(props, ctx) {
    let content: ReactNode = null;
    console.log(props.checkprop);

    if (ctx.view.mode == 'design') {
      return (
        <div className={'document-checkBoxRows'}>
          <div className={'document-checkBoxItem'}>
            <span style={{ fontFamily: props.fontFamily }} className={'document-icon'}>
              {props.checked}
            </span>
            选中项
          </div>
          <div className={'document-checkBoxItem'}>
            <span style={{ fontFamily: props.fontFamily }} className={'document-icon'}>
              {props.uncheck}
            </span>
            未选项
          </div>
          <div className={'document-checkBoxItem'}>
            <span style={{ fontFamily: props.fontFamily }} className={'document-icon'}>
              {props.uncheck}
            </span>
            未选项
          </div>
        </div>
      );
    } else {
      if (!props.checkprop) {
        content = '';
        return content;
      } else {
        const manager = ctx.view as DocumentViewerManager;
        const data = manager.dataset.data;
        const checkString = data[props.checkprop.id];
        console.log(
          checkString,
          manager.dataset.service.model,
          manager.dataset.service.model.fields,
        );
        const fieldId = props.checkprop.id;
        const lookups = manager.dataset.getSpeciesItems(fieldId);
        console.log(lookups);
        return (
          <div className={'document-checkBoxRows'}>
            {lookups.map((item, index) => (
              <div className={'document-checkBoxItem'}>
                <span
                  style={{ fontFamily: props.fontFamily }}
                  className={'document-icon'}>
                  {item.value == checkString ? props.checked : props.uncheck}
                </span>
                {item.text}
              </div>
            ))}
          </div>
        );
      }
    }
  },
  displayName: 'Checkbox',
  meta: {
    label: '复选框',
    type: 'Document',
    props: {
      checkprop: {
        editorConfig: {
          propType: ['选择型', '分类型'],
        },
        type: 'type',
        label: '属性',
        typeName: 'propertyFile',
      } as ExistTypeMeta<SEntity | undefined>,
      checked: {
        type: 'string',
        label: '选中图标',
        default: '☑',
      },
      uncheck: {
        type: 'string',
        label: '未选中图标',
        default: '□',
      },
      fontFamily: {
        type: 'string',
        label: '字体类型',
        default: '"Source Han Sans CN","微软雅黑", "sans-serif"',
      },
    },
    childrenFilter: () => {
      return false;
    },
  },
});
