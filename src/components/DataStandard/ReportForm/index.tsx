import { IForm } from '@/ts/core';
import React, { useState } from 'react';
import Config from './config';
import { Resizable } from 'devextreme-react';
import { Layout } from 'antd';
import ReportRender from './report';
import { Emitter } from '@/ts/base/common';
import useCtrlUpdate from '@/hooks/useCtrlUpdate';
import { XFloatRowsInfo } from './types';

import './register';

interface IReportDesignProps {
  current: IForm;
}

/** 办事报表设计器 */
const WorkFormDesign: React.FC<IReportDesignProps> = ({ current }) => {
  const [key] = useCtrlUpdate(current);
  const [selectIndex, setSelectIndex] = React.useState<number>(-1);
  const [selectRow, setSelectRow] = React.useState<XFloatRowsInfo | undefined>();
  const [mainWidth, setMainWidth] = React.useState<number>(400);
  const [notifyEmitter] = useState(new Emitter());
  return (
    <Layout key={key}>
      <Layout.Content>
        {React.useMemo(
          () => (
            <ReportRender
              current={current}
              onItemSelected={setSelectIndex}
              onRowSelected={setSelectRow}
              notityEmitter={notifyEmitter}
            />
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
              <Config
                current={current}
                index={selectIndex}
                rowInfo={selectRow}
                notifyEmitter={notifyEmitter}
              />
            ),
            [current, selectIndex, selectRow],
          )}
        </Layout.Sider>
      </Resizable>
    </Layout>
  );
};

export default WorkFormDesign;
