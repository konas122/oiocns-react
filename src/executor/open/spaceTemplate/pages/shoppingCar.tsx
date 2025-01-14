import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { model, schema } from '@/ts/base';
import { List as Link } from '@/ts/base/common/linq';
import { ISpaceTemplate } from '@/ts/core/thing/standard/page/spaceTemplate';
import { Button, Divider, Skeleton, Space, Statistic } from 'antd';
import { List } from 'devextreme-react';
import React, { useEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import WorkStartDo from '../../work';
import { ItemProduct } from '../widget/item';
import cls from './../index.module.less';
import { IWork } from '@/ts/core';

interface IProps {
  page: ISpaceTemplate;
}

interface IGroup {
  key: string;
  items: schema.XProduct[];
}

export const RightCar: React.FC<IProps> = ({ page }) => {
  const [products, setProducts] = useState<schema.XProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<schema.XProduct[]>([]);
  const [work, setWork] = useState<IWork>();
  const [center, setCenter] = useState(<></>);
  const groups: IGroup[] = useMemo(() => {
    const result = new Link(products).GroupBy((item) => item.belongId);
    return Object.keys(result).map((item) => {
      return { key: item, items: result[item] };
    });
  }, [products]);
  const loadContent = async () => {
    setLoading(true);
    setWork(await page.findWork());
    setProducts([...(await page.shoppingCar.loadProducts())]);
    setLoading(false);
  };
  useEffect(() => {
    const id = page.shoppingCar.subscribe(() => loadContent());
    return () => page.shoppingCar.unsubscribe(id);
  }, []);
  return (
    <>
      <div className={cls.rightCar}>
        <div className={cls.products}>
          <InfiniteScroll
            dataLength={products.length}
            next={() => {}}
            hasMore={false}
            loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
            endMessage={<Divider plain>到底了，没有更多了哦 🤐</Divider>}
            scrollableTarget="scrollableDiv">
            <List<IGroup>
              dataSource={groups}
              height="100%"
              grouped
              collapsibleGroups
              showSelectionControls
              selectionMode="multiple"
              selectByClick={true}
              onSelectedItemsChange={(e: IGroup[]) => {
                setSelectedRows(e.flatMap((i) => i.items));
              }}
              groupRender={(item: IGroup) => {
                return (
                  <Space>
                    <span>供给方</span>
                    <EntityIcon entityId={item.key} showName />
                  </Space>
                );
              }}
              itemRender={(item: schema.XProduct) => {
                return (
                  <ItemProduct
                    current={page}
                    product={item}
                    images={(product) => {
                      const getImages = (key: string) => {
                        const images = JSON.parse(product[key] || '[]');
                        if (images.length == 0) {
                          images.push({} as model.FileItemShare);
                        }
                        return images;
                      };
                      switch (product.typeName) {
                        case '应用':
                          return getImages('icons');
                        default:
                          return getImages('images');
                      }
                    }}
                  />
                );
              }}
            />
          </InfiniteScroll>
        </div>
        <div className={cls.bottomSum}>
          <Space>
            <Statistic
              precision={2}
              value={selectedRows.reduce((p, n) => p + (n.price ?? 0), 0)}
              prefix={'合计:'}
              suffix="¥"
            />
          </Space>
          <div className={cls.buttons}>
            <Button
              type="primary"
              danger
              onClick={async () => {
                if (await page.shoppingCar.batchRemove(selectedRows)) {
                  setSelectedRows([]);
                }
              }}>
              批量删除
            </Button>
            <Button
              type="primary"
              loading={loading}
              disabled={!work}
              onClick={async () => {
                const node = await work[0]?.loadNode();
                if (work[0] && node) {
                  const instance = await work[0].applyData(node, selectedRows);
                  setCenter(
                    <WorkStartDo
                      current={work[0]}
                      data={instance}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                }
                return;
              }}>
              {(() => {
                if (loading) {
                  return '加载办事中...';
                }
                if (!work) {
                  return '结算（平台方未配置结算流程）';
                }
                return '结算';
              })()}
            </Button>
          </div>
        </div>
      </div>
      {center}
    </>
  );
};
