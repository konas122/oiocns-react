import React, { useState } from 'react';
import { Card, Divider } from 'antd';
import { schema } from '@/ts/base';
import { WorkNodeModel } from '@/ts/base/model';
import { IWork } from '@/ts/core';
import cls from './index.module.less';
import { Theme } from '@/config/theme';
import { Resizable } from 'devextreme-react';
import { Layout } from 'antd';
import Preview from './modal/preview';
import RuleList from './modal/index';
import FullScreenModal from '@/components/Common/fullScreen';
interface IProps {
  work: IWork;
  current: WorkNodeModel;
  primaryForms: schema.XForm[];
  detailForms: schema.XForm[];
}

const NodeRule: React.FC<IProps> = (props) => {
  const [open, setOpen] = useState(false);
  const [mainWidth, setMainWidth] = React.useState<number | string>('70%');

  return (
    <>
      <Card
        type="inner"
        style={{ marginBottom: 10 }}
        title={
          <div>
            <Divider
              type="vertical"
              style={{
                height: '16px',
                borderWidth: '4px',
                borderColor: Theme.FocusColor,
                marginLeft: '0px',
              }}
              className={cls['flowDesign-rule-divider']}
            />
            <span>规则配置</span>
          </div>
        }
        bodyStyle={{ padding: 0 }}
        extra={
          <>
            <a
              className="primary-color"
              onClick={() => {
                setOpen(true);
              }}>
              添加
            </a>
          </>
        }
      />
      <FullScreenModal
        centered
        fullScreen
        open={open}
        destroyOnClose
        width={'80vw'}
        bodyHeight={'80vh'}
        title={'规则配置'}
        onCancel={() => {
          setOpen(false);
        }}>
        <Layout>
          <Resizable
            handles={'right'}
            width={mainWidth}
            maxWidth={800}
            minWidth={400}
            onResize={(e) => setMainWidth(e.width)}>
            <Preview node={props.current} work={props.work} />
          </Resizable>
          <Layout.Content>
            <Layout.Sider
              width={'100%'}
              style={{ height: '100%', padding: '40px 20px 20px 20px' }}>
              <RuleList {...props}></RuleList>
            </Layout.Sider>
          </Layout.Content>
        </Layout>
      </FullScreenModal>
    </>
  );
};
export default NodeRule;
