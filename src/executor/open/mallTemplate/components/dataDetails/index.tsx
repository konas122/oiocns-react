import React, { memo, useCallback, useEffect, useState } from 'react';
import { Modal, Image, Tabs, Carousel, Skeleton } from 'antd';
import type { schema, model } from '@/ts/base';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import cls from './index.module.less';
import { IForm, IWork } from '@/ts/core';
import { getDefaultImg } from '@/utils/tools';
import FormItem from '@/components/DataStandard/WorkForm/Viewer/formItem';

interface IDataDetails {
  data: schema.XProduct;
  current: IMallTemplate;
  form?: IForm;
  works?: IWork[]
  onCancel: () => void;
  onAddCar: () => void;
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
}

const DataDetails = ({
  current,
  data,
  form,
  works,
  onCancel,
  onAddCar,
  onPurchase,
}: IDataDetails) => {
  const getImage = useCallback((type: string, num?: number) => {
    let images: model.FileItemShare[] = [];
    images = JSON.parse(data[type] || '[]');
    if (!images.length && form) {
      const species = form.fields.flatMap((item) =>
        item.options?.species ? item ?? [] : [],
      );
      images.push({
        shareLink: getDefaultImg(data, species),
      } as any);
    }
    return num ? images.splice(0, num) : images;
  }, []);
  const evaluateData = [
    {
      key: 1,
      evaluateTitle: '推荐',
      Score: 5,
      evaluateContent:
        '非常好用！里面的插画非常好看，小熊画的超级可爱！里面还有日记提醒，想得很周全，最好的是还不许付费，写完日记还有奖励贴纸。总提来说非常不错！加油！强烈推荐',
      date: '2月12日',
      evaluatePeople: 'aswegrtyui',
    },
    {
      key: 2,
      evaluateTitle: '推荐',
      Score: 5,
      evaluateContent:
        '非常好用！里面的插画非常好看，小熊画的超级可爱！里面还有日记提醒，想得很周全，最好的是还不许付费，写完日记还有奖励贴纸。总提来说非常不错！加油！强烈推荐',
      date: '2月12日',
      evaluatePeople: 'aswegrtyui',
    },
    {
      key: 3,
      evaluateTitle: '推荐',
      Score: 5,
      evaluateContent:
        '非常好用！里面的插画非常好看，小熊画的超级可爱！里面还有日记提醒，想得很周全，最好的是还不许付费，写完日记还有奖励贴纸。总提来说非常不错！加油！强烈推荐',
      date: '2月12日',
      evaluatePeople: 'aswegrtyui',
    },
    {
      key: 4,
      evaluateTitle: '推荐',
      Score: 5,
      evaluateContent:
        '非常好用！里面的插画非常好看，小熊画的超级可爱！里面还有日记提醒，想得很周全，最好的是还不许付费，写完日记还有奖励贴纸。总提来说非常不错！加油！强烈推荐',
      date: '2月12日',
      evaluatePeople: 'aswegrtyui',
    },
    {
      key: 5,
      evaluateTitle: '推荐',
      Score: 5,
      evaluateContent:
        '非常好用！里面的插画非常好看，小熊画的超级可爱！里面还有日记提醒，想得很周全，最好的是还不许付费，写完日记还有奖励贴纸。总提来说非常不错！加油！强烈推荐',
      date: '2月12日',
      evaluatePeople: 'aswegrtyui',
    },
    {
      key: 6,
      evaluateTitle: '推荐',
      Score: 5,
      evaluateContent:
        '非常好用！里面的插画非常好看，小熊画的超级可爱！里面还有日记提醒，想得很周全，最好的是还不许付费，写完日记还有奖励贴纸。总提来说非常不错！加油！强烈推荐',
      date: '2月12日',
      evaluatePeople: 'aswegrtyui',
    },
  ];
  const loadMoreData = useCallback(() => {
    console.log(loadMoreData, 'loadMoreData');
  }, []);

  const tabs = [
    {
      key: '1',
      label: '商品概括',
      children: (
        <>
          <div className={cls.productFormData}>
            {form?.fields.map((field) => {
              return (
                <FormItem
                  key={field.id}
                  data={data}
                  numStr={'三列'}
                  rules={[]}
                  readOnly={true}
                  field={field}
                  belong={current.belong}
                />
              );
            })}
          </div>
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
          <div className={cls.productDescription}>{data.introduceInfo}</div>
        </>
      ),
    },
    {
      key: '2',
      label: '功能介绍',
      children: (
        <>
          <div className={cls.productDescription}>{data.useInfo}</div>
          <div className={cls.footer}>
            {!!getImage('useInfoImage', 1).length && (
              <Image
                src={getImage('useInfoImage', 1)[0]?.shareLink}
                preview={false}
                placeholder={<Skeleton.Image className={cls.featureImage} />}
                className={cls.featureImage}
              />
            )}
          </div>
        </>
      ),
    },
    // {
    //   key: '3',
    //   label: '评价',
    //   children: (
    //     <>
    //       <div className={cls.evaluate}>
    //         <div className={cls.evaluateInfo}>
    //           <div className={cls.evaluationScore}>4.9</div>
    //           <div>满分 5 分</div>
    //           <div>432 个评价</div>
    //         </div>
    //         <InfiniteScroll
    //           dataLength={evaluateData.length}
    //           next={loadMoreData}
    //           hasMore={true}
    //           loader={<></>}
    //           scrollableTarget="scrollableDiv">
    //           <List
    //             dataSource={evaluateData}
    //             renderItem={(i) => {
    //               return (
    //                 <List.Item key={i.key} className={cls.evaluateItem}>
    //                   <div className={cls.evaluateTitle}>{i.evaluateTitle}</div>
    //                   <Rate disabled allowHalf value={i.Score} />
    //                   <div>{i.evaluateContent}</div>
    //                   <div className={cls.evaluateFooter}>
    //                     <div>{i.date}</div>
    //                     <div>{i.evaluatePeople}</div>
    //                   </div>
    //                 </List.Item>
    //               );
    //             }}
    //           />
    //         </InfiniteScroll>
    //       </div>
    //     </>
    //   ),
    // },
  ];
  const onChange = useCallback(() => {}, []);
  return (
    <Modal
      width={800}
      open={true}
      title={data.title || '[未设置名称]'}
      footer={null}
      onCancel={onCancel}>
      <div className={cls.header}>
        {current.metadata.template === 'dataTemplate' ? (
          <Image
            src={getImage('icons', 1)[0]?.shareLink}
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
            <div className={cls.title}>{data.title || '[未设置名称]'}</div>
            <div className={cls.introduce}>{data.remark}</div>
            {data.mode !== '共享' && (
              <div className={cls.buyerFooter}>
                <div className={cls.price}>￥{data.price || 0}</div>
                <div>{0}人申领</div>
              </div>
            )}
          </div>
          <div>品牌：{data.brand}</div>
          <div>规格型号：{data.specModel}</div>
          <div className={cls.controls}>
            {works ? (
              <div className={cls.purchaseNow}>
                <span onClick={onPurchase.bind(this, [data], works[0])}>
                  {works[0].name}
                </span>
              </div>
            ) : (
              <></>
            )}
            <div className={cls.purchaseCar} onClick={onAddCar}>
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
