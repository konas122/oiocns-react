import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { model, schema } from '@/ts/base';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Carousel, Image, Skeleton, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import cls from './../index.module.less';
import down from '/public/img/mallTemplate/down.svg';
import DataDetails from '../components/dataDetails';
import { IForm, IWork } from '@/ts/core';
import orgCtrl from '@/ts/controller';
import { getDefaultImg } from '@/utils/tools';

interface IProps {
  current: IMallTemplate;
  product: schema.XProduct;
  form: IForm;
  works?: IWork[]
  onAddCar: (product: schema.XProduct, staging: boolean) => void;
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
}

export const Product: React.FC<IProps> = ({
  current,
  product,
  works,
  onAddCar,
  onPurchase,
  form,
}) => {
  const [center, setCenter] = useState(<></>);
  const [staging, setStaging] = useState(
    current.shoppingCar.products.some((a) => !a.isMultiple && a.id == product.id),
  );
  const productClicksCount = product.clicksCount !== undefined ? product.clicksCount : 0;
  const [clicksCount, setClicksCount] = useState<number>(productClicksCount);
  const images = (product: schema.XProduct): model.FileItemShare[] => {
    let key = 'images';
    switch (product.mode) {
      case '共享':
        key = 'icons';
        break;
    }
    const images = JSON.parse(product[key] || '[]');
    if (images.length == 0) {
      const species = form.fields.flatMap((item) =>
        item.options?.species ? item ?? [] : [],
      );
      images.push({ shareLink: getDefaultImg(product, species) } as model.FileItemShare);
    }
    return images;
  };
  useEffect(() => {
    const id = current.shoppingCar.subscribe(() => {
      setStaging(
        current.shoppingCar.products.some((a) => !a.isMultiple && a.id == product.id),
      );
    });
    return () => current.shoppingCar.unsubscribe(id);
  }, []);
  const loadBody = () => {
    switch (product.mode) {
      case '共享':
        return (
          <div key={product.id} className={cls.listItem} style={{ padding: 0 }}>
            <div
              className={cls.detail}
              onClick={async () => {
                const coll = current.directory.target.resource.genColl('-clicks-count');
                const newCount = clicksCount + 1;
                const update = {
                  _set_: {
                    count: newCount,
                  },
                };
                coll.update(product.id, update);
                setClicksCount(newCount);
                setCenter(
                  <DataDetails
                    data={product}
                    form={form}
                    current={current}
                    works={works}
                    onAddCar={onAddCar.bind(this, product, staging)}
                    onPurchase={onPurchase}
                    onCancel={() => setCenter(<></>)}
                  />,
                );
              }}>
              <Carousel autoplay={true}>
                {images(product).map((item, index) => {
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
                    {product.brand && `[${product.brand}]`}
                    {product.title || '[未设置名称]'}
                  </div>
                  <div className={cls.belong}>
                    供给方：
                    <EntityIcon entityId={product.belongId} />
                    <Typography.Text
                      className={cls.belongName}
                      ellipsis={{
                        tooltip: {
                          title: <EntityIcon entityId={product.belongId} showName />,
                          color: '#fff',
                        },
                      }}
                      style={{ flex: 1 }}>
                      {orgCtrl.user.findMetadata<schema.XEntity>(product.belongId)?.name}
                    </Typography.Text>
                  </div>
                  <div>上架时间：{product.updateTime}</div>
                  <div>点击量: {clicksCount}</div>
                </Space>
              </div>
            </div>
            <div className={cls.footer}>
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
                  <span className={cls.purchase}>加入购物车</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div key={product.id} className={cls.listItem} style={{ padding: 0 }}>
            <div
              className={cls.detail}
              onClick={async () => {
                const coll = current.directory.target.resource.genColl('-clicks-count');
                const newCount = clicksCount + 1;
                const update = {
                  _set_: {
                    count: newCount,
                  },
                };
                coll.update(product.id, update);
                setClicksCount(newCount);
                setCenter(
                  <DataDetails
                    data={product}
                    form={form}
                    current={current}
                    works={works}
                    onAddCar={onAddCar.bind(this, product, staging)}
                    onPurchase={onPurchase}
                    onCancel={() => setCenter(<></>)}
                  />,
                );
              }}>
              <Carousel autoplay={true}>
                {images(product).map((item, index) => {
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
                    {product.brand && `[${product.brand}]`}
                    {product.title || '[未设置名称]'}
                  </div>
                  {product.mode === '空间共享' && (
                    <div>
                      {product.startHours}-{product.endHours}
                    </div>
                  )}
                  <div className={cls.belong}>
                    供给方：
                    <EntityIcon entityId={product.belongId} />
                    <Typography.Text
                      className={cls.belongName}
                      ellipsis={{
                        tooltip: {
                          title: <EntityIcon entityId={product.belongId} showName />,
                          color: '#fff',
                        },
                      }}
                      style={{ flex: 1 }}>
                      {orgCtrl.user.findMetadata<schema.XEntity>(product.belongId)?.name}
                    </Typography.Text>
                  </div>
                  <div>上架时间：{product.updateTime}</div>
                  <div>点击量: {clicksCount}</div>
                </Space>
              </div>
            </div>
            <div className={cls.footer}>
              <div className={cls.purchaseInfo}>
                <div className={cls.price}>￥{product.price ?? 0}</div>
                <div className={cls.buyersNum}>
                  {0}人申领{product.isMultiple && ` 数量:${product.count}件`}
                </div>
              </div>
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
                <div className={cls.purchaseCar}>
                  <ShoppingCartOutlined
                    onClick={onAddCar.bind(this, product, staging)}
                    style={{
                      fontSize: 20,
                      color: staging ? 'red' : undefined,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  return (
    <>
      {loadBody()}
      {center}
    </>
  );
};
