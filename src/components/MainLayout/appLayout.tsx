import { Layout } from 'antd';
import React, { ReactNode } from 'react';
import { Resizable } from 'devextreme-react';
import useStorage from '@/hooks/useStorage';
import EntityPreview from './preview';
const { Content, Sider } = Layout;

/**
 * 内容区模板类
 */
type AppLayoutType = {
  previewFlag?: string;
  children?: React.ReactNode; // 子组件
  emptyCompent?: ReactNode;
};

/**
 * 内容区模板
 *
 * 包含：左侧、内容区顶部(面包屑、操作区)、内容区
 * @returns
 */
const AppLayout: React.FC<AppLayoutType> = (props) => {
  const [mainWidth, setMainWidth] = useStorage<string | number>('mainWidth', '40%');
  const previewCtx = React.useMemo(() => {
    return <EntityPreview flag={props.previewFlag} emptyCompent={props.emptyCompent} />;
  }, []);
  return (
    <Layout className={'main_layout'}>
      <Layout className={'body'}>
        <Resizable
          handles={'right'}
          width={mainWidth}
          onResize={(e) => setMainWidth(e.width)}>
          <Sider className={'content'} width={'100%'}>
            {props.children}
          </Sider>
        </Resizable>
        <Content className={'content'}>{previewCtx}</Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
