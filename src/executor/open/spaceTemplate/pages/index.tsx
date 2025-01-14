import Banner from '@/pages/Home/components/Common/BannerImg';
import { LoadBanner } from '@/pages/Home/components/Common/bannerDefaultConfig';
import { schema } from '@/ts/base';
import { IForm } from '@/ts/core';
import { ISpaceTemplate } from '@/ts/core/thing/standard/page/spaceTemplate';
import { SearchOutlined, ShoppingCartOutlined, FileImageOutlined, GlobalOutlined } from '@ant-design/icons';
import {
  Badge,
  Col,
  Drawer,
  Empty,
  Input,
  Layout,
  Pagination,
  Row,
  Space,
  Spin,
} from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import { ScrollView, TreeView } from 'devextreme-react';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Product } from '../widget/product';
import cls from './../index.module.less';
import { RightCar } from './shoppingCar';
import DataDetails from '../components/dataDetails';

interface IProps {
  current: ISpaceTemplate;
}

export const SpaceTemplate: React.FC<IProps> = ({ current }) => {
  return (
    <Layout className={cls.dataSharing}>
      <Header>
        <Banner
          bannerImg={LoadBanner('assetModule')}
          target={current.directory.target}
          bannerkey={current.id}
        />
      </Header>
      <HotBody current={current} />
      <ContentBody current={current} />
    </Layout>
  );
};

interface IHotGroup {
  current: ISpaceTemplate;
}

const HotBody: React.FC<IHotGroup> = ({ current }) => {
  const [hot, setHot] = useState<IForm>();
  useEffect(() => {
    const id = current.subscribe(async () => setHot(await current.loadHot()));
    return () => current.unsubscribe(id);
  }, []);
  if (!hot) {
    return <></>;
  }
  return (
    <div className={cls.cardInfo}>
      <div className={cls.header}>
        <div className={cls.title}>{'推荐场地'}</div>
      </div>
      <Provider
        current={current}
        form={hot}
        renderBody={(products) => {
          return (
            <ScrollView direction="horizontal" showScrollbar="always">
              <Space direction="horizontal" size={[24, 16]}>
                {products.map((item) => {
                  return <Product key={item.id} current={current} product={item} />;
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

const ContentBody: React.FC<IProps> = ({ current }) => {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<IForm>();
  const [mapVisible, setMapVisible] = useState(false);
  const toggleView = (mapV: boolean) => {
    setMapVisible(mapV);
  }
  const loadContent = async () => {
    setLoading(true);
    setForm(await current.loadForm());
    setLoading(false);
  };
  useEffect(() => {
    const id = current.subscribe(() => loadContent());
    return () => current.unsubscribe(id);
  }, []);
  if (loading) {
    return <Spin />;
  }
  if (!form) {
    return (
      <Empty>
        <span>未绑定商品表单</span>
      </Empty>
    );
  }
  return (
    <Spin spinning={loading}>
      <Content className={cls.content}>
        <Filter current={current} form={form} />
        <Layout className={cls.productList}>
          <div className={cls.cardInfo}>
          <Group mapVisible={mapVisible} toggleView={toggleView} current={current} form={form} />
            <Provider
              current={current}
              form={form}
              mapVisible={mapVisible}
              renderBody={(products, loader) => {
                return (
                  <Space direction="vertical" align="center">
                    <Row gutter={[16, 24]}>
                      {products.map((item) => {
                        return (
                          <Col key={item.id} span={6} style={{ maxWidth :'unset'}}>
                            <Product current={current} product={item} />
                          </Col>
                        );
                      })}
                    </Row>
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
                  </Space>
                );
              }}
            />
          </div>
        </Layout>
      </Content>
    </Spin>
  );
};

interface IGroup extends DataProps {
  mapVisible: boolean;
  toggleView: (mapV: boolean) => void;
}

const Group: React.FC<IGroup> = ({ current, form, mapVisible, toggleView }) => {
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
      <div className={cls.title}>{'共享空间'}</div>
      <Space size={20}>
        <Badge count={length}>
          {
            mapVisible ? (
              <FileImageOutlined style={{ fontSize: 24, marginRight: 24 }} onClick={() => toggleView(false)} />
              ) : (
              <GlobalOutlined style={{ fontSize: 24, marginRight: 24 }} onClick={() => toggleView(true)} />
            )
          }
          <ShoppingCartOutlined
            style={{ fontSize: 24 }}
            onClick={() => setVisible(true)}
          />
          <Drawer
            title="购物车"
            size={'large'}
            onClose={() => setVisible(false)}
            open={visible}>
            <RightCar page={current} />
          </Drawer>
        </Badge>
        <Input
          size="large"
          placeholder="搜索"
          style={{ width: '240px' }}
          onPressEnter={(e) => {
            const reduce = form.fields
              .filter((item) => item.valueType == '描述型')
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
      </Space>
    </div>
  );
};

const Filter: React.FC<DataProps> = ({ current, form }) => {
  const lookups = form.fields.flatMap((item) => item.lookups ?? []);
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
        selectNodesRecursive={false}
        selectByClick={true}
        onSelectionChanged={(e) => {
          const match: any = {};
          const userData: string[] = [];
          for (const { itemData } of e.component.getSelectedNodes()) {
            if (itemData?.value?.startsWith('T')) {
              match[itemData.value] = { _exists_: true };
            } else if (itemData?.value?.startsWith('S')) {
              userData.push(itemData.value);
            }
          }
          current.command.emitter('filter', 'species', { match, userData });
        }}
      />
    </div>
  );
};

interface FilterProps {
  species: { userData: string[]; match: any };
}

interface ProviderProps extends DataProps {
  renderBody: (products: schema.XProduct[], loader: PageLoader) => ReactNode;
  mapVisible?: boolean;
}

interface PageLoader {
  page: number;
  setPage: (page: number) => void;
  size: number;
  setSize: (size: number) => void;
  total: number;
  loadData: (page: number, size: number) => Promise<void>;
}

const Provider: React.FC<ProviderProps> = ({ current, form, renderBody, mapVisible  }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<schema.XProduct[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(24);
  const [total, setTotal] = useState(0);
  const filter = useRef<any[]>([]);
  const match = useRef<FilterProps>({ species: { userData: [], match: {} } });
  products.map((item) => {
    let fieldId = item.fieldId;
    const mapProduct = new Map(Object.entries(item));
    const mapArray =[...JSON.parse(mapProduct.get("T"+fieldId))];
    const field=mapArray[0];
    item.field=field
  });
  const loadData = async (page: number, size: number) => {
    setLoading(true);
    const result = await form.loadThing({
      requireTotalCount: true,
      userData: match.current.species.userData,
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
      {mapVisible ?
      <MapSpeac current={current} products={products} />
      : renderBody(products, { page, setPage, size, setSize, total, loadData })}
    </Spin>
  );
};

interface MapProps {
  current: ISpaceTemplate;
  products: schema.XProduct[];
}

const MapSpeac:React.FC<MapProps> = ({ current, products }) => {
  let map:any = null;
  const [center, setCenter] = useState(<></>);
  const product = products[0]
  const [staging, setStaging] = useState(
    current.shoppingCar.products.some((a) => !a.isMultiple && a.id == product.id),
  );
  useEffect(() => {
    console.log(product)
    initMap()
  }, []);

  const initMap = () => {
    map = new AMap.Map('map', {
      center: product.field.latitudeAndLongitude ?  [product.field.latitudeAndLongitude.split(',')[0], product.field.latitudeAndLongitude.split(',')[1]] : [120.139327,30.28718],
      zoom: 15,
    });

    const markers = products.map((item) => {
      if (!item.field.latitudeAndLongitude) return;
      const marker = new AMap.Marker({
         position:  [item.field.latitudeAndLongitude.split(',')[0], item.field.latitudeAndLongitude.split(',')[1]] ,
      });
      marker.setMap(map);

      marker.on('click', () =>
        setCenter(
          <DataDetails
            current={current}
            data={item}
            onCancel={() => setCenter(<></>)}
          />,
        )
      );
      return marker;
    });
  }
  return (
    <>
      <div id='map' style={{ height: '500px' }}></div>
      {center}
    </>
  );
};

