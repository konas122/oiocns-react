import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { model, schema } from '@/ts/base';
import { List as Link } from '@/ts/base/common/linq';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import { Button, Divider, Skeleton, Space, Statistic } from 'antd';
import { CheckBox, List } from 'devextreme-react';
import React, { useEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ItemProduct } from '../widget/item';
import cls from './../index.module.less';
import { IForm, IWork } from '@/ts/core';
import WorkStartDo from '../../work';
import { getDefaultImg } from '@/utils/tools';
interface IProps {
  page: IMallTemplate;
  form: IForm;
  works?: IWork[];
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
}

interface IGroup {
  key: string;
  items: schema.XProduct[];
}

type IChecked = {
  [key: string]: boolean | null;
};

export const RightCar: React.FC<IProps> = ({ page, form, works, onPurchase }) => {
  const [products, setProducts] = useState<schema.XProduct[]>([]);
  const [selectedRows, setSelectedRows] = useState<schema.XProduct[]>([]);
  const [checked, setChecked] = useState<IChecked>();
  const [center, setCenter] = useState(<></>);
  const [borrow, setBorrow] = useState<IWork>();
  const [loading, setLoading] = useState(false);
  const groups: IGroup[] = useMemo(() => {
    const result = new Link(products).GroupBy((item) => item.belongId);
    return Object.keys(result).map((item) => {
      return { key: item, items: result[item] };
    });
  }, [products]);
  const loadContent = async () => {
    setLoading(true);
    setBorrow(await page.findBorrow());
    setProducts([...(await page.shoppingCar.loadProducts())]);
    setLoading(false);
  };
  useEffect(() => {
    const id = page.shoppingCar.subscribe(() => loadContent());
    return () => page.shoppingCar.unsubscribe(id);
  }, []);
  const onValueChange = (id: string, val: boolean | null) => {
    const _checked = checked;
    const extraChecked = selectedRows.filter((i) => i.belongId !== id);
    if (val) {
      const belongChecked = groups.find((i) => i.key === id)?.items as schema.XProduct[];
      setSelectedRows([...extraChecked, ...belongChecked]);
    } else {
      setSelectedRows(extraChecked);
    }
    _checked[id] = val;
    setChecked({ ..._checked });
  };

  useEffect(() => {
    const result = new Link(selectedRows).GroupBy((item) => item.belongId);
    let checked: IChecked = {};
    groups.forEach((group) => {
      checked[group.key] =
        group.items.length == result[group.key]?.length
          ? true
          : result[group.key]?.length
          ? null
          : false;
    });
    setChecked(checked);
  }, [selectedRows.length, groups]);

  const selectedRowsGroups = useMemo(() => {
    const result = new Link(selectedRows).GroupBy((item) => item.belongId);
    return Object.keys(result).map((item) => {
      return { key: item, items: result[item] };
    });
  }, [selectedRows]);

  // 是否展示办事结算
  const isShowWork = useMemo(() => {
    if (selectedRows.length) {
      const belongId = selectedRows[0].belongId;
      return !selectedRows.find((item) => item.belongId !== belongId);
    }
    return false;
  }, [selectedRows]);
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
              selectedItems={selectedRowsGroups}
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
                    <CheckBox
                      text="全选"
                      value={checked ? checked[item.key] : false}
                      onValueChanged={(e) => {
                        e.event?.stopPropagation();
                      }}
                      onValueChange={onValueChange.bind(this, item.key)}></CheckBox>
                    <span>供给方</span>
                    <EntityIcon entityId={item.key} showName />
                  </Space>
                );
              }}
              itemRender={(item: schema.XProduct) => {
                return (
                  <ItemProduct
                    product={item}
                    images={(product) => {
                      const getImages = (key: string) => {
                        const images = JSON.parse(product[key] || '[]');
                        if (images.length == 0) {
                          const species = form.fields.flatMap((item) =>
                            item.options?.species ? item ?? [] : [],
                          );
                          images.push({
                            shareLink: getDefaultImg(product, species),
                          } as model.FileItemShare);
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
                    onNumberChange={(e) => {
                      const value =
                        +e.target.value > +item.count ? item.count : e.target.value;
                      page.shoppingCar.create({
                        ...item,
                        carCount: +value,
                      });
                      const _selectRows = selectedRows.map((i) => {
                        if (item.id === i.id) {
                          return {
                            ...item,
                            carCount: +value,
                          };
                        }
                        return i;
                      });
                      setSelectedRows(_selectRows);
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
              value={selectedRows.reduce(
                (p, n) => p + ((n.price || 0) * (n.carCount || 1) ?? 0),
                0,
              )}
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
              disabled={!borrow}
              onClick={async () => {
                const node = await borrow?.loadNode();
                if (borrow && node) {
                  const instance = await borrow.applyData(node, selectedRows);
                  setCenter(
                    <WorkStartDo
                      current={borrow}
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
                if (!borrow) {
                  return '借用（平台方未配置结算流程）';
                }
                return '借用';
              })()}
            </Button>
            {works &&
              isShowWork &&
              works.map((work) => {
                return (
                  <Button
                    type="primary"
                    onClick={onPurchase.bind(this, selectedRows, work)}>
                    {work.name}
                  </Button>
                );
              })}
          </div>
        </div>
      </div>
      {center}
    </>
  );
};
