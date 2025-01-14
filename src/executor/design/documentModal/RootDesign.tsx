import React, { useState } from 'react';
import { defineElement } from '../../../components/PageElement/elements/defineElement';
import { EnumTypeMeta } from '@/ts/element/ElementMeta';
import { Slot } from '../../../components/PageElement/render/Slot';
import { XDocumentTemplate } from '@/ts/base/schema';
export default defineElement({
  render(props, ctx) {
    const isDesign = ctx.view.mode == 'design';
    const [layoutType, setLayoutType] = useState(props.layoutType);
    const setting = (ctx.view.page as XDocumentTemplate).setting || {}
    const pageheader = ()=>{
      return <div style={{fontFamily:setting.fontFamily,fontSize:setting.fontSize,textAlign:'center'}}>{setting.header}</div>
    }
    const pagefooter = ()=>{
      return setting.pageNumber?<div className='pagefooter'>页码示例: 1/1</div>:<></>
    }
    ctx.view.subscribe((type, cmd, args) => {
      if (type == 'props' && cmd == 'change' && props.id == args) {
        const layout = ctx.view.treeManager.allElements[props.id].props.layoutType;
        setLayoutType(layout);
      }
    });
    return (
      <div
        style={{ height: '100%' }}
        className={['element-root', isDesign ? 'is-design' : '', `is-${layoutType}`].join(
          ' ',
        )}>
        {isDesign ? (
          <div className="design-tip">
            <div>设计模式</div>
          </div>
        ) : (
          <></>
        )}
        {props.children.map((c) => {
          return <Slot key={c.id} child={c} params={ {pageheader,pagefooter} } />
        })}
      </div>
    );
  },
  displayName: 'Root',
  meta: {
    props: {
      layoutType: {
        type: 'enum',
        label: '布局方式',
        options: [
          { label: '滚动', value: 'scroll' },
          { label: '撑满', value: 'full' },
        ],
        default: 'scroll',
      } as EnumTypeMeta<'scroll' | 'full'>,
    },
    type: 'Container',
    label: '模板根元素',
  },
});
