import { $confirm } from '@/utils/react/antd';
import { Tag, Typography, message } from 'antd';
import React, { ReactNode, useContext, useMemo, useState } from 'react';
import { TypeMeta } from '@/ts/element/ElementMeta';
import { PageElement } from '@/ts/element/PageElement';
import {
  DesignContext,
  PageContext,
} from '../../../../../components/PageElement/render/PageContext';
import ElementPropsItem from './ElementPropsItem';
import './index.less';
import { CloseCircleOutlined } from '@ant-design/icons';
import { PageElementView } from '@/ts/element/ElementTreeManager';

export async function removeElement(element: PageElement | null, ctx: DesignContext) {
  if (!element) {
    return;
  }
  if (element.kind == 'Root') {
    message.error('根元素不可删除');
    return;
  }
  await $confirm({
    title: '提示',
    okText: '确定',
    cancelText: '取消',
    content: `确实要移除元素 ${element.name} 及其所有下级？`,
  });
  ctx.view.removeElement(element, true);
}

interface Props {
  children?: ReactNode;
}

export default function ElementProps(props: Props) {
  const ctx = useContext<DesignContext>(PageContext as any);
  const [showProps, setShowProps] = useState(ctx.view.showProps);
  const [element, setElement] = useState<PageElement | null>(ctx.view.currentElement);
  ctx.view.subscribe((type, cmd, args) => {
    if (type == 'current' && cmd == 'change') {
      setElement(ctx.view.currentElement);
    } else if (type == 'current' && cmd == 'showProps') {
      setShowProps(args);
    }
  });

  const commonTypeMeta: Dictionary<TypeMeta> = {
    id: {
      type: 'string',
      label: 'ID',
      readonly: true,
    },
    name: {
      type: 'string',
      label: '名称',
      required: true,
    },
    className: {
      type: 'string',
      label: 'CSS类名',
    },
    style: {
      type: 'json',
      label: 'CSS样式',
    },
  };

  const [attachProps, parent] = useMemo<
    [Dictionary<TypeMeta>, PageElementView | null]
  >(() => {
    if (!element) {
      return [{}, null];
    }
    const e = ctx.view.treeManager.allElements[element.id];
    const parent = ctx.view.treeManager.allElements[e.parentId!];
    if (!parent) {
      return [{}, null];
    }

    const parentMeta = ctx.view.elements.elementMeta[parent.kind] || {};
    return [parentMeta.attachProps || {}, parent];
  }, [element]);

  if (!element || !showProps) {
    return <></>;
  }

  const meta = ctx.view.elements.elementMeta[element.kind] || {};

  return (
    <div className="page-element-props">
      <div className="props-header">
        {/* <span className="header-id">[{element.id}]</span> */}
        <span className="header-title">{element.name || '（未命名）'}</span>
        <Tag color="processing" className="header-kind">
          {meta.label || element.kind}
        </Tag>
        <div style={{ flex: 'auto', display: 'flex', flexDirection: 'row-reverse' }}>
          <CloseCircleOutlined onClick={() => (ctx.view.showProps = false)} />
        </div>
      </div>
      <div className="props-content">
        <Typography.Title level={5}>基本属性</Typography.Title>
        {Object.entries(commonTypeMeta).map(([prop, meta]) => {
          return (
            <ElementPropsItem
              key={'common_' + prop}
              target={element}
              prop={prop}
              meta={meta}
            />
          );
        })}
        {Object.keys(attachProps).length > 0 && parent && (
          <>
            <div className="diver"></div>
            <Typography.Title level={5}>附加属性</Typography.Title>
            {Object.entries(attachProps).map(([prop, meta]) => {
              return (
                <ElementPropsItem
                  key={'attach_' + prop}
                  target={element.props}
                  prop={prop}
                  meta={meta}
                  onValueChange={() => {
                    // 附加属性需要通知父元素
                    ctx.view.emitter('props', 'change', parent.id);
                  }}
                />
              );
            })}
          </>
        )}
        <div className="diver"></div>
        {Object.entries(meta.props).map(([prop, meta]) => {
          return (
            <ElementPropsItem
              key={prop}
              target={element.props}
              prop={prop}
              meta={meta}
              onValueChange={() => {
                ctx.view.emitter('props', 'change', element.id);
              }}
            />
          );
        })}
        {props.children}
      </div>
    </div>
  );
}
