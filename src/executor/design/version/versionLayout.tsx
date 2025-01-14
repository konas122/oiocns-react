import React, { ReactNode } from 'react';
import { Layout } from 'antd';
import useStorage from '@/hooks/useStorage';
import { Resizable } from 'devextreme-react';
import DesignPreview from './designPreview';

type LayoutType = {
  previewFlag?: string;
  children?: React.ReactNode; // 子组件
  emptyCompent?: ReactNode;
  showList?: boolean;
  finished(): void;
};
const { Content, Sider } = Layout;

const VersionLayout: React.FC<LayoutType> = (props) => {
  const [mainWidth, setMainWidth] = useStorage<string | number>('designWidth', '40%');

  const previewCtx = React.useMemo(() => {
    return <DesignPreview flag={props.previewFlag} finished={props.finished} />;
  }, []);
  return (
    <Layout className={'main_layout'}>
      <Layout className={'body'}>
        <Resizable
          handles={'right'}
          width={props.showList ? mainWidth : 0}
          style={{ transition: 'width 0.3s' }}
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

export default VersionLayout;
