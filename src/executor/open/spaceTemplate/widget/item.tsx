import { model, schema } from '@/ts/base';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import { Carousel, Image, Skeleton, Tag } from 'antd';
import React from 'react';
import cls from './../index.module.less';

interface IProps {
  current: IMallTemplate;
  product: schema.XProduct;
  images: (product: schema.XProduct) => model.FileItemShare[];
}

export const ItemProduct: React.FC<IProps> = ({ product, images }) => {
  return (
    <div key={product.id} className={cls.carItem}>
      <Carousel style={{ width: 80 }} dots={false}>
        {images(product.field).map((item, index) => {
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
          <div>{product.field.title ?? '[未设置名称]'}</div>
          <Tag color="blue" className={cls.tag}>
            {product.typeName ?? '商品'}
          </Tag>
        </div>
        <div className={cls.amount}>{product.price ?? 0}¥</div>
      </div>
    </div>
  );
};
