import React, { CSSProperties, ReactNode } from 'react';
import { WithCommonProps, defineElement } from '../../defineElement';
import { EnumTypeMeta } from '@/ts/element/ElementMeta';
import _ from 'lodash';
import './index.less';
import { PaperOrientation, PaperSetting, PaperSize, getPaperSize } from '@/ts/element/standard/document/model';

export default defineElement({
  render(props: WithCommonProps<PaperSetting&{
    pageheader?:()=>ReactNode,
    pagefooter?:()=>ReactNode,
  }>, ctx) {
    // debugger
    const isDesign = ctx.view.mode == 'design';

    const settings = _.omit(props, ['style', 'className', 'children']);
    const sizeInfo = getPaperSize(settings);
    const style: CSSProperties = {
      ...props.style,
      ..._.omit(sizeInfo, ['margin']),
      padding: sizeInfo.margin,
    };

    return (
      <section
        id={props.id}
        className={['document-paper', isDesign ? 'is-design' : ''].join(' ')}
        style={style}>
        
        <div className="document-paper__content">
          {isDesign?<div className='document-pageheader'>{props.pageheader?.()}</div>:<></>  }
          {isDesign && (
            <>
              <div className="document-paper__corner top-left"></div>
              <div className="document-paper__corner top-right"></div>
              <div className="document-paper__corner bottom-left"></div>
              <div className="document-paper__corner bottom-right"></div>
            </>
          )}
          {props.children.map((c) => {
            const Render = ctx.view.components.getComponentRender(c.kind, ctx.view.mode);
            return <Render key={c.id} element={c} />;
          })}
          {isDesign?<div className='document-pagefooter'>{props.pagefooter?.()}</div>:<></>  }  
        </div>
       
      </section>
    );
  },
  displayName: 'Paper',
  meta: {
    label: '页面纸张',
    type: 'Document',
    props: {
      orientation: {
        type: 'enum',
        label: '纸张方向',
        options: [
          { label: '横向', value: 'landscape' },
          { label: '纵向', value: 'portrait' },
        ],
        default: 'portrait',
      } as EnumTypeMeta<PaperOrientation>,
      paperSize: {
        type: 'enum',
        label: '纸张大小',
        options: [
          { label: 'A4', value: 'A4' },
          { label: 'A3', value: 'A3' },
        ],
        default: 'A4',
      } as EnumTypeMeta<PaperSize>,
      pagination: {
        type: 'boolean',
        label: '自动分页',
        default: false,
      },
      
      // padding: {
      //   type: 'type',
      //   typeName: 'size',
      //   label: '页边距',
      //   default: '2.54cm 1.91cm 2.54cm 1.91cm',
      // } as ExistTypeMeta<string>,
    },
    childrenFilter(element) {
      return element.name != 'Paper';
    },
  },
});
