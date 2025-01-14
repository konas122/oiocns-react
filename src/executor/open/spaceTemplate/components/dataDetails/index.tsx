import React, { memo, useCallback, useState, useEffect } from 'react';
import { Modal, Image, Tabs, Carousel, Skeleton } from 'antd';
import type { schema, model } from '@/ts/base';
import { IMallTemplate } from '@/ts/core/thing/standard/page/spaceTemplate';
import cls from './index.module.less';

interface IDataDetails {
  data: schema.XProduct;
  current: IMallTemplate;
  onCancel: () => void;
}

const DataDetails = ({ current, data, onCancel }: IDataDetails) => {
  const [staging, setStaging] = useState(
    current.shoppingCar.products.some((a) => a.id == data.id),
  );

  const getImage = useCallback((type: string, num?: number,fieldType:boolean) => {
    if (fieldType){
      let images: model.FileItemShare[] = [];
      images = JSON.parse(data[type] || '[]');
      return num ? images.splice(0, num) : images;
    } else {
      let images: model.FileItemShare[] = [];
      images = JSON.parse(data.field[type] || '[]');
      return num ? images.splice(0, num) : images;
    }
  }, []);


  useEffect(() => {
    const id = current.shoppingCar.subscribe(() => {
      setStaging(current.shoppingCar.products.some((a) => a.id == data.id));
    });
    return () => current.shoppingCar.unsubscribe(id);
  }, []);

  const tabs = [
    {
      key: '1',
      label: '商品概括',
      children: (
        <>
          <div className={cls.productImage}>
            {getImage('introduceImage', 2).map((item, index) => {
              return (
                <Image
                  key={index}
                  src={item.shareLink}
                  alt=""
                  preview={false}
                  className={cls.image}
                  placeholder={<Skeleton.Image className={cls.image} />}
                />
              );
            })}
          </div>
          <div className={cls.productDescription}>{data.field.introduceInfo}</div>
        </>
      ),
    },
    {
      key: '2',
      label: '功能介绍',
      children: (
        <>
          <div className={cls.productDescription}>{data.field.useInfo}</div>
          <div className={cls.productImage}>
            {getImage('useInfoImage', 2).map((item, index) => {
              return (
                <Image
                  key={index}
                  src={item.shareLink}
                  alt=""
                  preview={false}
                  className={cls.image}
                  placeholder={<Skeleton.Image className={cls.image} />}
                />
              );
            })}
          </div>
        </>
      ),
    },
    {
      key: '3',
      label: '开放时间',
      children: (
        <>
          <div className={cls.productDescription}>使用时间：{data.startHours}至{data.endHours}</div>
          <div className={cls.footer}>
            {!!getImage('openingHoursImage', 1,true).length && (
              <Image
                src={getImage('openingHoursImage', 1,true)[0]?.shareLink}
                preview={false}
                placeholder={<Skeleton.Image className={cls.featureImage} />}
                className={cls.featureImage}
              />
            )}
          </div>
        </>
      ),
    },
    {
      key: '4',
      label: '付款方式',
      children: (
        <>
          <div className={cls.productDescription}>{data.field.paymentMethod}</div>
          <div className={cls.footer}>
            {!!getImage('paymentInformation', 1).length && (
              <Image
                src={getImage('paymentInformation', 1)[0]?.shareLink}
                preview={false}
                placeholder={<Skeleton.Image className={cls.featureImage} />}
                className={cls.featureImage}
              />
            )}
          </div>
        </>
      ),
    },
  ];
  const onChange = useCallback(() => {}, []);
  return (
    <Modal width={800} open={true} title={data.title} footer={null} onCancel={onCancel}>
      <div className={cls.header}>
        {current.metadata.template === 'dataTemplate' ? (
          <Image
            src={getImage('icon', 1)[0]?.shareLink}
            preview={false}
            placeholder={<Skeleton.Image className={cls.productImg} />}
            className={cls.productImg}
          />
        ) : (
          <Carousel dots={false} className={cls.carousel}>
            {getImage('images').map((item, index) => {
              return (
                <Image
                  key={index}
                  src={item.shareLink}
                  alt=""
                  preview={false}
                  className={cls.carousel}
                  placeholder={<Skeleton.Image className={cls.carousel} />}
                />
              );
            })}
          </Carousel>
        )}
        <div
          className={cls.left}
          style={{
            flexDirection:
              current.metadata.template === 'dataTemplate' ? 'row' : 'column',
          }}>
          <div className={cls.info}>
            <div className={cls.title}>{data.field.title || '[未设置名称]'}</div>
            {current.metadata.mode !== 'sharing' && (
              <div className={cls.buyerFooter}>
                <div className={cls.price}>￥{data.price || 0}</div>
              </div>
            )}
          </div>
          <div className={cls.controls}>
        {/*    <div className={cls.purchaseNow}>
              <span onClick={() => {}}>立即预定</span>
            </div>*/}
            <div
              className={cls.purchaseNow}
              onClick={() => {
                if (staging) {
                  current.shoppingCar.remove(data);
                } else {
                  current.shoppingCar.create(data);
                }
              }}>
              <span>加入购物车</span>
            </div>
          </div>
        </div>
      </div>
      <Tabs defaultActiveKey="1" items={tabs} onChange={onChange} />
    </Modal>
  );
};

export default memo(DataDetails);
