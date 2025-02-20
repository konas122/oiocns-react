import { MonacoEditor } from '@/components/Common/MonacoEditor';
import FullScreenModal from '@/components/Common/fullScreen';
import {
  ApartmentOutlined,
  CheckOutlined,
  FileOutlined,
  RightCircleOutlined,
} from '@ant-design/icons';
import { Layout, Menu, message } from 'antd';
import React, { ReactNode, useContext, useState } from 'react';
import { ViewerHost } from '../../../open/page/view/ViewerHost';
import ViewerManager from '../../../open/page/view/ViewerManager';
import { DesignContext, PageContext } from '@/components/PageElement/render/PageContext';
import TreeManager from './TreeManager';
import ElementProps from './config/ElementProps';
import css from './designer.module.less';

export interface DesignerProps {
  ctx: DesignContext;
}

const stringify = (ctx: DesignContext) => {
  return JSON.stringify(ctx.view.rootChildren, null, 2);
};

const Coder: React.FC<{}> = () => {
  const ctx = useContext<DesignContext>(PageContext as any);
  const [data, setData] = useState<string>(stringify(ctx));
  ctx.view.subscribe((type, cmd) => {
    if (type == 'elements' && cmd == 'change') {
      setData(stringify(ctx));
    } else if (type == 'props' && cmd == 'change') {
      setData(stringify(ctx));
    }
  });
  return <MonacoEditor value={data} language="json" onChange={setData} />;
};

export function DesignerHost({ ctx }: DesignerProps) {
  const [active, setActive] = useState<string>();
  const [status, setStatus] = useState(false);
  const [center, setCenter] = useState(<></>);
  const [showProps, setShowProps] = useState(ctx.view.showProps);
  ctx.view.subscribe((type, cmd, args) => {
    if (type == 'elements' && cmd == 'change') {
      setStatus(!status);
    } else if (type == 'current' && cmd == 'showProps') {
      setShowProps(args);
    }
  });

  function renderTabs() {
    return [
      {
        key: 'tree',
        label: '元素树',
        icon: <ApartmentOutlined />,
      },
      {
        key: 'data',
        label: 'JSON 数据',
        icon: <FileOutlined />,
      },
      {
        key: 'preview',
        label: '预览',
        icon: <RightCircleOutlined />,
      },
      {
        key: 'save',
        label: '保存',
        icon: <CheckOutlined />,
      },
    ];
  }

  const Configuration: { [key: string]: ReactNode } = {
    tree: <TreeManager />,
    data: <Coder />,
  };

  const RootRender = ctx.view.components.rootRender as any;
  return (
    <PageContext.Provider value={ctx}>
      <div className={css.content}>
        <Layout.Sider collapsedWidth={60} collapsed={true}>
          <Menu
            items={renderTabs()}
            mode={'inline'}
            selectedKeys={active ? [active] : []}
            onSelect={(info) => {
              switch (info.key) {
                case 'save':
                  ctx.view.update().then(() => message.success('保存成功！'));
                  break;
                case 'preview':
                  setCenter(
                    <FullScreenModal
                      open
                      centered
                      fullScreen
                      destroyOnClose
                      width={'80vw'}
                      bodyHeight={'80vh'}
                      title={'页面预览'}
                      onCancel={() => setCenter(<></>)}>
                      <ViewerHost ctx={{ view: new ViewerManager(ctx.view.pageInfo) }} />
                    </FullScreenModal>,
                  );
                  break;
                default:
                  setActive(info.key);
                  break;
              }
            }}
            onDeselect={() => setActive(undefined)}
          />
        </Layout.Sider>
        <div className={`${active ? css.designConfig : ''} is-full-height`}>
          {active ? Configuration[active] : <></>}
        </div>
        <div className="o-page-host" style={{ flex: 'auto' }}>
          <RootRender element={ctx.view.rootElement} />
        </div>
        {showProps && (
          <div className="is-full-height">
            <ElementProps />
          </div>
        )}
      </div>
      {center}
    </PageContext.Provider>
  );
}
