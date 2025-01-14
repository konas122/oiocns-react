import { model, schema } from '@/ts/base';
import { Image, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import cls from './../index.module.less';
import down from '/public/img/mallTemplate/down.svg';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { MallTemplateMode } from '@/ts/core/public/enums';
import DataDetails from '../components/dataDetails';
import { IWork } from '@/ts/core';

interface IProps {
  current: IMallTemplate;
  product: schema.XProduct;
  works?: IWork[];
  onAddCar: (product: schema.XProduct, staging: boolean) => void;
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
}

export const Virtually: React.FC<IProps> = ({
  product,
  current,
  works,
  onAddCar,
  onPurchase,
}) => {
  const [center, setCenter] = useState(<></>);
  const [staging, setStaging] = useState(
    current.shoppingCar.products.some((a) => !a.isMultiple && a.id == product.id),
  );
  const icons: model.FileItemShare[] = JSON.parse(product.icons || '[]');
  if (icons.length == 0) {
    icons.push({} as model.FileItemShare);
  }
  useEffect(() => {
    const id = current.shoppingCar.subscribe(() => {
      setStaging(
        current.shoppingCar.products.some((a) => !a.isMultiple && a.id == product.id),
      );
    });
    return () => current.shoppingCar.unsubscribe(id);
  }, []);
  return (
    <>
      <div key={product.id} className={cls.listItem} style={{ padding: 0 }}>
        <div
          className={cls.detail}
          onClick={() => {
            setCenter(
              <DataDetails
                current={current}
                data={product}
                onAddCar={onAddCar.bind(this, product, staging)}
                onCancel={() => setCenter(<></>)}
                onPurchase={onPurchase}
              />,
            );
          }}>
          <div>
            {icons.map((item) => {
              return (
                <Image
                  key={item.name}
                  src={item.shareLink}
                  preview={false}
                  style={{
                    borderRadius: '2px',
                    width: '23px',
                    height: '23px',
                    marginRight: '6px',
                  }}
                />
              );
            })}
            {product.title ?? '[未设置名称]'}
          </div>
          <div className={cls.productInfo}>
            <Space size={8} direction="vertical">
              <div className={cls.introduce}>{product.remark}</div>
              {product.mode === MallTemplateMode.sharing && (
                <>
                  <div>
                    供给方：
                    <EntityIcon entityId={product.belongId} showName />
                  </div>
                  <div>上架时间：{product.updateTime}</div>
                </>
              )}
            </Space>
          </div>
        </div>
        <div className={cls.footer}>
          {product.mode !== MallTemplateMode.sharing && (
            <div className={cls.purchaseInfo}>
              <span className={cls.price}>￥{product.price || 0}</span>
              <span className={cls.buyersNum}>{0}人下单</span>
            </div>
          )}
          <div className={cls.purchaseControls}>
            {works ? (
              <div
                className={cls.purchaseNow}
                onClick={onPurchase.bind(this, [product], works?.[0])}>
                <img src={down}></img>
                <span className={cls.purchase}>{works?.[0]?.name}</span>
              </div>
            ) : (
              <></>
            )}
            <div
              className={cls.purchaseCar}
              onClick={onAddCar.bind(this, product, staging)}>
              <ShoppingCartOutlined
                style={{
                  fontSize: 20,
                  color: staging ? 'red' : undefined,
                }}
              />
              {product.mode === MallTemplateMode.sharing && (
                <span className={cls.purchase}>加入购物车</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {center}
    </>
  );
};
