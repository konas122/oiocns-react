import React, { ReactNode } from 'react';
import { defineElement } from '../../defineElement';
import { EnumTypeMeta, ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';

import './index.less';
import { Property } from 'csstype';
import DocumentViewerManager from '@/executor/open/document/view/ViewerManager';
import { FileItemShare } from '@/ts/base/model';

export default defineElement({
  render(props, ctx) {
    // console.log(props.image, window.location);
    // console.log(props.imageProp);
    const isDesign = ctx.view.mode == 'design';
    const width = props.width,
      height = props.height,
      fit = props.fit;

    const imgUrl = props.image?.id ? window.location.origin + '/' + props.image?.id : '';
    const imageStyle = props.imageStyle;
    let content: ReactNode = null;
    if (ctx.view.mode == 'design') {
      if (imageStyle == 'file') {
        content = props.image ? (
          <EntityIcon
            entity={
              {
                ...props.image,
                typeName: '图片',
              } as any
            }
            showName
          />
        ) : (
          '（未绑定）'
        );
      } else if (imageStyle == 'form') {
        content = props.imageProp ? (
          <EntityIcon
            entity={
              {
                ...props.imageProp,
                typeName: '属性',
              } as any
            }
            showName
          />
        ) : (
          '（未绑定）'
        );
      }

      return (
        <div className={['document-image', isDesign ? 'is-design' : ''].join(' ')}>
          <div style={{ width: width, height: height }} className={'document-imageInner'}>
            {content}
          </div>
        </div>
      );
    } else {
      if (imageStyle == 'form') {
        if (!props.imageProp) {
          content = '';
        } else {
          const manager = ctx.view as DocumentViewerManager;
          const data = manager.dataset.data;
          const imgString = data[props.imageProp.id];
          if (imgString) {
            const imgArr = (JSON.parse(imgString) as FileItemShare[]).filter((item) =>
              item.contentType?.startsWith('image'),
            );

            if (imgArr.length > 0) {
              return (
                <div
                  className={['document-image', isDesign ? 'is-design' : ''].join(' ')}>
                  {imgArr.map((item, index) => (
                    <img
                      key={index}
                      src={window.location.origin + item.shareLink}
                      alt={`Image ${index}`}
                      style={{ width: width, height: height, objectFit: fit }}
                    />
                  ))}
                </div>
              );
            }
          }
        }
      } else {
        return (
          <div className={['document-image', isDesign ? 'is-design' : ''].join(' ')}>
            <img
              src={imgUrl}
              alt=""
              style={{ width: width, height: height, objectFit: fit }}
            />
          </div>
        );
      }
    }
  },
  displayName: 'Image',
  meta: {
    label: '图片',
    type: 'Document',
    props: {
      imageStyle: {
        type: 'enum',
        options: [
          { label: '资源绑定', value: 'file' },
          { label: '表单绑定', value: 'form' },
        ],
        label: '图片来源',
        default: 'file',
      } as EnumTypeMeta<string>,
      image: {
        type: 'type',
        label: '图片资源',
        typeName: 'picFile',
      } as ExistTypeMeta<SEntity | undefined>,
      imageProp: {
        type: 'type',
        label: '表单图片',
        typeName: 'propertyFile',
      } as ExistTypeMeta<SEntity | undefined>,
      width: {
        type: 'type',
        typeName: 'size',
        label: '宽度',
        default: '100px',
      } as ExistTypeMeta<string>,
      height: {
        type: 'type',
        typeName: 'size',
        label: '高度',
        default: '100px',
      } as ExistTypeMeta<string>,
      fit: {
        type: 'enum',
        options: [
          { label: '无', value: 'none' },
          { label: '拉伸', value: 'fill' },
          { label: '等比缩小', value: 'contain' },
          { label: '等比填充', value: 'cover' },
        ],
        label: '内容适应',
        default: 'none',
      } as EnumTypeMeta<Property.ObjectFit>,
    },
    childrenFilter: () => {
      return false;
    },
  },
});
