import Banner from '@/pages/Home/components/Common/BannerImg';
import { LoadBanner } from '@/pages/Home/components/Common/bannerDefaultConfig';
import { schema } from '@/ts/base';
import { IForm, IWork } from '@/ts/core';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import {
  Badge,
  Col,
  Drawer,
  Empty,
  Input,
  Layout,
  message,
  Pagination,
  Row,
  Segmented,
  Space,
  Spin,
} from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import { ScrollView, TreeView } from 'devextreme-react';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../widget/product';
import { Virtually } from '../widget/virtually';
import List from '../widget/list';
import cls from './../index.module.less';
import { RightCar } from './shoppingCar';
import WorkStartDo from '../../work';
import { TemplateType } from '@/ts/core/public/enums';
import { cloneDeep } from 'lodash';
import DataDetails from '../components/dataDetails';
import { clicksCount, Xbase } from '@/ts/base/schema';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
interface IProps {
  current: IMallTemplate;
}

export const MallTemplate: React.FC<IProps> = ({ current }) => {
  const [center, setCenter] = useState(<></>);
  const [works, setWorks] = useState<IWork[]>();
  const [form, setForm] = useState<IForm>();
  const [loading, setLoading] = useState(true);
  // 加入购物车
  const onAddCar = async (product: schema.XProduct, staging: boolean) => {
    if (product.isMultiple) {
      let num =
        current.shoppingCar.products.find((i) => i.id === product.id)?.carCount || 0;
      num++;
      if (!num) return;
      if (num > (product.count || 0)) {
        message.error('库存不足');
        return;
      }
      const res = await current.shoppingCar.create({
        ...product,
        carCount: num,
      });
      if (res) {
        message.success('已加入购物车');
      } else {
        message.error('加入购物车失败');
      }
    } else {
      if (staging) {
        const res = await current.shoppingCar.remove(product);
        if (res) {
          message.success('已删除购物车商品');
        } else {
          message.error('删除购物车商品失败');
        }
      } else {
        const res = await current.shoppingCar.create(product);
        if (res) {
          message.success('已加入购物车');
        } else {
          message.error('加入购物车失败');
        }
      }
    }
  };

  // 批量操作购物车
  const onBatchAddCar = async (products: schema.XProduct[], staging: boolean = false) => {
    let _products = cloneDeep(products);
    // 处理可选择多数量商品
    _products = _products.filter((product) => {
      if (product.isMultiple) {
        let num =
          current.shoppingCar.products.find((i) => i.id === product.id)?.carCount || 0;
        num++;
        if (num < (product.count || 0)) {
          current.shoppingCar.create({
            ...product,
            carCount: num,
          });
          return;
        }
        message.error('库存不足');
      }
      return product;
    });
    if (staging) {
      const res = await current.shoppingCar.batchRemove(_products);
      if (res) {
        message.success('已删除购物车商品');
      } else {
        message.error('删除购物车商品失败');
      }
    } else {
      const res = await current.shoppingCar.batchCreate(_products);
      if (res) {
        message.success('已加入购物车');
      } else {
        message.error('加入购物车失败');
      }
    }
  };
  // 结算
  const onPurchase = async (selectedRows: schema.XProduct[], work: IWork) => {
    if (!selectedRows.length) {
      message.error('请先选择商品');
      return;
    }
    const node = await work?.loadNode();
    if (work && node) {
      const rows = selectedRows.map((item) => {
        return {
          ...item,
          orderCount: item.carCount || (item.isMultiple && 1),
        };
      });
      const instance = await work.applyData(node, rows);
      setCenter(
        <WorkStartDo
          current={work}
          data={instance}
          finished={async (success) => {
            if (success) {
              await current.shoppingCar.batchRemove(selectedRows);
            }
            setCenter(<></>);
          }}
        />,
      );
    }
    return;
  };

  // 加载办事
  const loadContent = async () => {
    setLoading(true);
    setWorks(await current.findWork());
    setForm(await current.loadForm());
    setLoading(false);
  };

  useEffect(() => {
    loadContent();
  }, []);

  if (!current.params?.form) {
    return (
      <Empty>
        <span>未绑定商品表单</span>
      </Empty>
    );
  }
  if (!form) {
    if (!loading) {
      return (
        <Empty>
          <span>未绑定商品表单</span>
        </Empty>
      );
    } else {
      return <Empty image={<Spin spinning={loading}></Spin>} description=""></Empty>;
    }
  }
  return (
    <Layout className={cls.physical}>
      <Header>
        <Banner
          bannerImg={LoadBanner(
            current.metadata.template === 'realTemplate' ? 'trading' : 'assetModule',
          )}
          target={current.directory.target}
          bannerkey={current.id}
        />
      </Header>
      <HotBody
        current={current}
        form={form}
        works={works}
        onPurchase={onPurchase}
        onAddCar={onAddCar}
      />
      <ContentBody
        current={current}
        form={form}
        works={works}
        onPurchase={onPurchase}
        onAddCar={onAddCar}
        onBatchAddCar={onBatchAddCar}
      />
      {center}
    </Layout>
  );
};

interface IHotGroup {
  current: IMallTemplate;
  form: IForm;
  works?: IWork[];
  onAddCar: (product: schema.XProduct, staging: boolean) => void;
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
}

const HotBody: React.FC<IHotGroup> = ({ current, form, works, onPurchase, onAddCar }) => {
  const [hot, setHot] = useState<IForm>();
  useEffect(() => {
    const id = current.subscribe(async () => setHot(await current.loadHot()));
    return () => current.unsubscribe(id);
  }, []);
  if (!hot) {
    return <></>;
  }
  if (!current.params?.form) {
    return (
      <Empty>
        <span>未绑定商品表单</span>
      </Empty>
    );
  }
  return (
    <div className={cls.cardInfo}>
      <div className={cls.header}>
        <div className={cls.title}>{'热门商品'}</div>
      </div>
      <Provider
        current={current}
        form={hot}
        renderBody={(products) => {
          return (
            <ScrollView direction="horizontal" showScrollbar="always">
              <Space direction="horizontal" size={[24, 16]} className={cls.space}>
                {products.map((item) => {
                  return (
                    <Product
                      key={item.id}
                      current={current}
                      form={form}
                      works={works}
                      product={item}
                      onAddCar={onAddCar}
                      onPurchase={onPurchase}
                    />
                  );
                })}
              </Space>
            </ScrollView>
          );
        }}
      />
    </div>
  );
};

interface DataProps extends IProps {
  form: IForm;
}
interface IContentBody extends IProps {
  works?: IWork[];
  form: IForm;
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
  onAddCar: (product: schema.XProduct, staging: boolean) => void;
  onBatchAddCar: (products: schema.XProduct[]) => void;
}

const ContentBody: React.FC<IContentBody> = ({
  current,
  works,
  form,
  onPurchase,
  onAddCar,
  onBatchAddCar,
}) => {
  const [openMode, setOpenMode] = useState<schema.IOpenMode>(
    current.metadata.openMode || 'horiz',
  );
  const toggleView = (mapV: schema.IOpenMode) => {
    setOpenMode(mapV);
  };
  if (!current.params?.form) {
    return (
      <Empty>
        <span>未绑定商品表单</span>
      </Empty>
    );
  }
  const renderProducts = (products: schema.XProduct[]) => {
    let el = <></>;
    switch (openMode) {
      case 'horiz':
        el = (
          <Row gutter={[16, 24]}>
            {products.map((item) => {
              return (
                <Col key={item.id} span={6}>
                  <Col key={item.id} span={6} style={{ maxWidth: 'unset' }}></Col>
                  {current.template === TemplateType.realTemplate ? (
                    <Product
                      current={current}
                      product={item}
                      form={form}
                      works={works}
                      onAddCar={onAddCar}
                      onPurchase={onPurchase}
                    />
                  ) : (
                    <Virtually
                      current={current}
                      product={item}
                      works={works}
                      onAddCar={onAddCar}
                      onPurchase={onPurchase}
                    />
                  )}
                </Col>
              );
            })}
          </Row>
        );
        break;
      case 'map':
        el = (
          <MapMall
            current={current}
            products={products}
            onAddCar={onAddCar}
            onPurchase={onPurchase}
          />
        );
    }
    return el;
  };
  return (
    <Content className={cls.content}>
      {openMode !== 'vertical' && <Filter current={current} form={form} />}
      <Layout className={cls.productList}>
        <div className={cls.cardInfo}>
          <Group
            openMode={openMode}
            onPurchase={onPurchase}
            toggleView={toggleView}
            current={current}
            form={form}
            works={works}
          />
          <Provider
            current={current}
            form={form}
            renderBody={(products, loader) => {
              return (
                <Space direction="vertical" align="center" className={cls.space}>
                  {openMode !== 'vertical' ? (
                    renderProducts(products)
                  ) : (
                    <Row gutter={[16, 24]}>
                      <List
                        current={current}
                        fields={form.fields}
                        form={form}
                        works={works}
                        onBatchAddCar={onBatchAddCar}
                        onPurchase={onPurchase}
                      />
                    </Row>
                  )}
                  {openMode === 'horiz' ? (
                    <Pagination
                      current={loader.page}
                      pageSize={loader.size}
                      total={loader.total}
                      showTotal={(total) => `共 ${total} 条`}
                      showSizeChanger
                      pageSizeOptions={['12', '24', '48', '96']}
                      onChange={(current, size) => {
                        loader.setPage(current);
                        loader.setSize(size);
                        loader.loadData(current, size);
                      }}
                    />
                  ) : (
                    <></>
                  )}
                </Space>
              );
            }}
          />
        </div>
      </Layout>
    </Content>
  );
};

interface IGroup extends DataProps {
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
  toggleView: (mapV: 'horiz' | 'vertical' | 'map') => void;
  openMode: 'horiz' | 'vertical' | 'map';
  works?: IWork[];
}

const Group: React.FC<IGroup> = ({
  current,
  form,
  onPurchase,
  toggleView,
  openMode,
  works,
}) => {
  const [visible, setVisible] = useState(false);
  const [length, setLength] = useState(current.shoppingCar.products.length);
  useEffect(() => {
    const id = current.shoppingCar.subscribe(async () => {
      await current.shoppingCar.loadProducts();
      setLength(current.shoppingCar.products.length);
    });
    return () => current.shoppingCar.unsubscribe(id);
  }, []);

  return (
    <div className={cls.header}>
      <div className={cls.title}>{'实体商品'}</div>
      <Space size={20}>
        {openMode !== 'vertical' && (
          <Input
            size="large"
            placeholder="搜索"
            style={{ width: '240px' }}
            onPressEnter={(e) => {
              const reduce = form.fields
                .filter(
                  (item) =>
                    item.valueType == '描述型' &&
                    (item.code === 'belongId' || item.code === 'title'),
                )
                .map((item) => [item.code, 'contains', e.currentTarget.value] as any[])
                .reduce((p, n, i, f) => {
                  const next = [...p, n];
                  if (i !== f.length - 1) {
                    next.push('or');
                  }
                  return next;
                });
              current.command.emitter('filter', 'all', reduce);
            }}
            prefix={<SearchOutlined />}
          />
        )}
        <Badge count={length}>
          <ShoppingCartOutlined
            style={{ fontSize: 24 }}
            onClick={() => setVisible(true)}
          />
          <Drawer
            title="购物车"
            size={'large'}
            onClose={() => setVisible(false)}
            open={visible}>
            <RightCar page={current} form={form} works={works} onPurchase={onPurchase} />
          </Drawer>
        </Badge>
        <Segmented
          value={openMode}
          onChange={(value) => {
            toggleView(value as schema.IOpenMode);
          }}
          options={[
            {
              value: 'horiz',
              icon: <OrgIcons type={'icons/icon'} size={22} />,
            },
            {
              value: 'vertical',
              icon: <OrgIcons type={'icons/list'} size={22} />,
            },
            {
              value: 'map',
              icon: <OrgIcons type={'icons/activity'} size={22} />,
            },
          ]}
        />
      </Space>
    </div>
  );
};

const Filter: React.FC<DataProps> = ({ current, form }) => {
  const lookups = form.fields.flatMap((item) =>
    item.options?.species ? item.lookups ?? [] : [],
  );
  if (lookups.length === 0) {
    return <></>;
  }
  return (
    <div className={cls.tab}>
      <TreeView
        keyExpr="id"
        dataSource={lookups}
        searchEnabled
        dataStructure="plain"
        searchMode="contains"
        searchExpr="text"
        displayExpr="text"
        parentIdExpr="parentId"
        selectionMode="multiple"
        showCheckBoxesMode="normal"
        selectNodesRecursive={true}
        selectByClick={true}
        onSelectionChanged={(e) => {
          const match: any = {};
          for (const { itemData } of e.component.getSelectedNodes()) {
            if (itemData?.value?.startsWith('T')) {
              match[itemData.value] = { _exists_: true };
            } else if (itemData?.value?.startsWith('S')) {
              if (match['T' + itemData.propertyId]?._in_) {
                match['T' + itemData.propertyId]._in_.push(itemData.value);
              } else {
                match['T' + itemData.propertyId] = {
                  _in_: [itemData.value],
                };
              }
            }
          }
          current.command.emitter('filter', 'species', { match });
        }}
      />
    </div>
  );
};

interface FilterProps {
  species: { match: any };
}

interface ProviderProps extends DataProps {
  renderBody: (products: schema.XProduct[], loader: PageLoader) => ReactNode;
}

interface PageLoader {
  page: number;
  setPage: (page: number) => void;
  size: number;
  setSize: (size: number) => void;
  total: number;
  loadData: (page: number, size: number) => Promise<void>;
}

const Provider: React.FC<ProviderProps> = ({ current, form, renderBody }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<schema.XProduct[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(24);
  const [total, setTotal] = useState(0);
  const filter = useRef<any[]>([]);
  const match = useRef<FilterProps>({ species: { match: {} } });
  products.map((item) => {
    if (item.mode === '空间共享') {
      let fieldId = item.fieldId;
      const mapProduct = new Map(Object.entries(item));
      const mapArray = [...JSON.parse(mapProduct.get('T' + fieldId))];
      const field = mapArray[0];
      item.field = field;
      item.title = field.title;
      item.images = field.images;
      item.useInfo = field.useInfo;
      item.useInfoImage = field.useInfoImage;
      item.introduceInfo = field.introduceInfo;
      item.introduceImage = field.introduceImage;
      item.remark = item.field.remarks;
      item.latitudeAndLongitude = item.field.latitudeAndLongitude;
    }
  });
  const loadData = async (page: number, size: number) => {
    setLoading(true);
    const result = await form.loadThing({
      requireTotalCount: true,
      skip: (page - 1) * size,
      take: size,
      filter: form.parseFilter(filter.current),
      options: {
        match: {
          ...Object.keys(match.current).reduce((p, n) => {
            return { ...p, ...(match.current as any)[n].match };
          }, {}),
        },
      },
    });
    const coll = current.directory.resource.genColl('-clicks-count');
    const clicksResult: clicksCount[] = await coll.loadSpace({});
    if (clicksResult) {
      for (let i = 0; i < result.data.length; i++) {
        const item = result.data[i];
        const existingItemIndex = clicksResult.findIndex((click) => click.id == item.id);
        if (existingItemIndex == -1) {
          const insertData = {
            id: item.id,
            count: 0,
          } as clicksCount;
          const coll = current.directory.resource.genColl('-clicks-count');
          await coll.replace(insertData);
          result.data[i].clicksCount = 0;
        } else {
          result.data[i].clicksCount = clicksResult[existingItemIndex].count;
        }
      }
    }
    setProducts(result.data as schema.XProduct[]);
    setTotal(result.totalCount);
    setLoading(false);
  };
  useEffect(() => {
    loadData(page, size);
  }, []);
  useEffect(() => {
    const id = current.command.subscribe((type, cmd, args) => {
      switch (type) {
        case 'filter':
          switch (cmd) {
            case 'species':
              match.current.species = args;
              break;
            case 'all':
              filter.current = args;
              break;
          }
          loadData(page, size);
          break;
      }
    });
    return () => current.command.unsubscribe(id);
  }, []);
  return (
    <Spin spinning={loading}>
      {renderBody(products, { page, setPage, size, setSize, total, loadData })}
    </Spin>
  );
};

interface MapProps {
  current: IMallTemplate;
  products: schema.XProduct[];
  onAddCar: (product: schema.XProduct, staging: boolean) => void;
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
}

const MapMall: React.FC<MapProps> = ({ current, products, onAddCar, onPurchase }) => {
  let map: any = null;
  const [center, setCenter] = useState(<></>);
  const product = products[0];
  const [staging, setStaging] = useState(
    current.shoppingCar.products.some((a) => !a.isMultiple && a.id == product.id),
  );

  useEffect(() => {
    const id = current.shoppingCar.subscribe(() => {
      setStaging(
        current.shoppingCar.products.some((a) => !a.isMultiple && a.id == product.id),
      );
    });
    initMap();
    return () => current.shoppingCar.unsubscribe(id);
  }, []);

  const initMap = () => {
    map = new AMap.Map('map', {
      center: product.latitudeAndLongitude
        ? [
            product.latitudeAndLongitude.split(',')[0],
            product.latitudeAndLongitude.split(',')[1],
          ]
        : [120.139327, 30.28718],
      zoom: 15,
    });
    products.forEach((item) => {
      if (!item.latitudeAndLongitude) return;
      const marker = new AMap.Marker({
        position: [
          item.latitudeAndLongitude.split(',')[0],
          item.latitudeAndLongitude.split(',')[1],
        ],
      });
      marker.setMap(map);

      marker.on('click', () =>
        setCenter(
          <DataDetails
            current={current}
            data={item}
            onCancel={() => setCenter(<></>)}
            onAddCar={onAddCar.bind(this, product, staging)}
            onPurchase={onPurchase}
          />,
        ),
      );
      return marker;
    });
  };
  return (
    <>
      <div id="map" style={{ height: '500px' }}></div>
      {center}
    </>
  );
};
