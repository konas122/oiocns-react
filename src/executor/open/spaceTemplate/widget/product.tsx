import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { model, schema } from '@/ts/base';
import { IMallTemplate } from '@/ts/core/thing/standard/page/spaceTemplate';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Carousel, Image, Skeleton, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import cls from './../index.module.less';
import down from '/public/img/mallTemplate/down.svg';
import DataDetails from '../components/dataDetails';

interface IProps {
  current: IMallTemplate;
  product: schema.XProduct;
}

const images = (product: schema.XProduct): model.FileItemShare[] => {
  let key = 'images';
  switch (product.mode) {
    case '共享':
      key = 'icons';
      break;
  }
  const images = JSON.parse(product[key] || '[]');
  if (images.length == 0) {
    images.push({} as model.FileItemShare);
  }
  return images;
};

export const Product: React.FC<IProps> = ({ current, product }) => {
  const [center, setCenter] = useState(<></>);
  const [staging, setStaging] = useState(
    current.shoppingCar.products.some((a) => a.id == product.id),
  );
  useEffect(() => {
    const id = current.shoppingCar.subscribe(() => {
      setStaging(current.shoppingCar.products.some((a) => a.id == product.id));
    });
    return () => current.shoppingCar.unsubscribe(id);
  }, []);
  const loadBody = () => {
    return (
      <div key={product.id} className={cls.listItem} style={{ padding: 0 }}>
        <div
          className={cls.detail}
          onClick={() =>
            setCenter(
              <DataDetails
                current={current}
                data={product}
                onCancel={() => setCenter(<></>)}
              />,
            )
          }>
          <Carousel autoplay={true}>
            {images(product.field).map((item, index) => {
              return (
                <Image
                  key={index}
                  width={'100%'}
                  src={item.shareLink}
                  preview={false}
                  className={cls.productImg}
                  placeholder={<Skeleton.Image className={cls.productImg} />}
                />
              );
            })}
          </Carousel>
          <div className={cls.productInfo}>
            <Space size={8} direction="vertical">
              <div className={cls.title}>
                {product.field.brand && `[${product.field.brand}]`}
                {product.field.title || '【暂无标题】'}
              </div>
              <div>{product.startHours}-{product.endHours}</div>
              <div>
                供给方：
                <EntityIcon entityId={product.belongId} showName />
              </div>
              {/*<div>上架时间：{product.updateTime}</div>*/}
            </Space>
          </div>
        </div>
        <div className={cls.footer}>
          {current.metadata.mode !== 'sharing' && (
            <div className={cls.purchaseInfo}>
              <div className={cls.price}>￥{product.price ?? 0}</div>
            </div>
          )}
          <div className={cls.purchaseControls}>
            {/*<div className={cls.purchaseNow} onClick={() => {}}>
              <img src={down}></img>
              <span className={cls.purchase}>
                   立即预定
                  </span>
            </div>*/}
            <div className={cls.purchaseCar}>
              <ShoppingCartOutlined
                onClick={() => {
                  if (staging) {
                    current.shoppingCar.remove(product);
                  } else {
                    current.shoppingCar.create(product);
                  }
                }}
                style={{
                  fontSize: 20,
                  color: staging ? 'red' : undefined,
                }}
              />
              {current.metadata.mode === 'sharing' && (
                <span className={cls.purchase}>加入购物车</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      {loadBody()}
      {center}
    </>
  );
};
