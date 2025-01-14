import { IView } from '@/ts/core';
import React, { useState } from 'react';
import Config from './config';
import { Resizable } from 'devextreme-react';
import { Layout } from 'antd';
import ReportRender from './report';
import { Emitter } from '@/ts/base/common';
import useCtrlUpdate from '@/hooks/useCtrlUpdate';

interface IProps {
  current: IView;
}

/** 办事报表设计器 */
const ReportViewDesign: React.FC<IProps> = ({ current }) => {
  const [key] = useCtrlUpdate(current);
  const [mainWidth, setMainWidth] = React.useState<number>(400);
  const [notifyEmitter] = useState(new Emitter());

  return (
    <Layout key={key}>
      <Layout.Content>
        {React.useMemo(
          () => (
            <ReportRender current={current} notityEmitter={notifyEmitter} />
          ),
          [current],
        )}
      </Layout.Content>
      <Resizable
        handles={'right'}
        width={mainWidth}
        maxWidth={800}
        minWidth={400}
        onResize={(e) => setMainWidth(e.width)}>
        <Layout.Sider width={'100%'} style={{ height: '100%' }}>
          {React.useMemo(
            () => (
              <Config current={current} index={-1} notifyEmitter={notifyEmitter} />
            ),
            [current],
          )}
        </Layout.Sider>
      </Resizable>
    </Layout>
  );
};

export default ReportViewDesign;
