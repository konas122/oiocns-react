import React, { ReactNode } from 'react';
import { defineElement } from '../../defineElement';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import type DocumentViewerManager from '@/executor/open/document/view/ViewerManager';

export default defineElement({
  render(props, ctx) {
    const isDesign = ctx.view.mode == 'design';

    let content: ReactNode = null;
    if (ctx.view.mode == 'design') {
      content = props.prop ? (
        <EntityIcon
          entity={
            {
              ...props.prop,
              typeName: '属性',
            } as any
          }
          showName
        />
      ) : (
        '（未绑定）'
      );
    } else {
      if (!props.prop) {
        content = '';
      } else {
        const manager = ctx.view as DocumentViewerManager;
        const data = manager.dataset.data;

        let name = data[props.prop.id + 'Name'];
        let value = data[props.prop.id];
        if (name) {
          content = name;
        } else {
          content = manager.dataset.formatFieldValue(value, props.prop.id, {
            accuracy: props.accuracy,
            displayFormat: props.dateFormat,
          });
        }
      }
    }
    return (
      <span
        className={[
          'document-property-value',
          isDesign ? 'is-design' : props.className ?? '',
        ].join(' ')}
        style={props.style ?? {}}>
        {content}
      </span>
    );
  },
  displayName: 'PropertyValue',
  meta: {
    label: '属性值',
    type: 'Document',
    props: {
      prop: {
        type: 'type',
        label: '属性',
        typeName: 'propertyFile',
      } as ExistTypeMeta<SEntity | undefined>,
      accuracy: {
        type: 'number',
        label: '小数位数',
      },
      dateFormat: {
        type: 'string',
        label: '日期格式',
      },
    },
    childrenFilter: () => {
      return false;
    },
  },
});
