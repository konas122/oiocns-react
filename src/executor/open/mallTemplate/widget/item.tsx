import { model, schema } from '@/ts/base';
import { Carousel, Image, Skeleton, Tag, InputNumber } from 'antd';
import React from 'react';
import cls from './../index.module.less';

interface IProps {
  product: schema.XProduct;
  images: (product: schema.XProduct) => model.FileItemShare[];
  onNumberChange: (e: any) => void;
}

export const ItemProduct: React.FC<IProps> = ({ product, images, onNumberChange }) => {
  return (
    <div key={product.id} className={cls.carItem}>
      <div className={cls.carItemInfo}>
        <Carousel style={{ width: 80 }} dots={false}>
          {images(product).map((item, index) => {
            return (
              <Image
                key={index}
                src={item.shareLink}
                preview={false}
                className={cls.image}
                placeholder={<Skeleton.Image className={cls.image} />}
              />
            );
          })}
        </Carousel>
        <div className={cls.content}>
          <div className={cls.title}>
            <div>{product.title ?? '[未设置名称]'}</div>
            <Tag color="blue" className={cls.tag}>
              {product.typeName ?? '商品'}
            </Tag>
          </div>
          <div className={cls.remark}>{product.remark}</div>
          <div className={cls.amount}>{product.price ?? 0}¥</div>
        </div>
      </div>
      {product.isMultiple && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}>
          <InputNumber
            min={1}
            max={product.count || 0}
            defaultValue={product.carCount}
            onBlur={onNumberChange}
            style={{ width: '100px' }}
          />
        </div>
      )}
    </div>
  );
};
