import React from 'react';
import { Card, Row, Col, Tag } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-components';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import Pie from './components/pie';
import Line from './components/line';
import Bar from './components/bar';
import Ring from './components/ring';
import cls from './index.module.less';

const { Divider } = StatisticCard;

interface IProps {
  pages: IPageTemplate | null;
}

const Board: React.FC<IProps> = ({ pages }) => {
  console.log('pages', pages);

  return (
    <div className={cls['board']}>
      <div className="cardGroup" style={{ padding: '12px', marginLeft: '8px' }}>
        <div className={cls['select-space']} style={{}}>
          <div className={cls['selectspan']}>
            <EntityIcon entityId={pages?.metadata.belongId} size={30} />
            <div style={{ fontSize: 20, color: '#15181D' }}>{pages?.metadata.name}</div>
          </div>
          <div>
            <Tag color="processing">{pages?.directory.belong.name}</Tag>
          </div>
          <div style={{ cursor: 'default', color: 'rgba(54, 110, 244, 1)' }}>
            数据切换
          </div>
          <RightOutlined />
        </div>
      </div>
      <Row gutter={16}>
        <Col span={24}>
          <Card className={cls['board-info']}>
            <div className={cls['board-title']}>资产价值统计</div>
            <Row gutter={16} className={cls['board-content']}>
              <Col
                className="gutter-row"
                span={8}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                <div className={cls['board-item']}>
                  <span className={cls['board-item-remark']}>净值</span>
                  <div>
                    <span className={cls['board-price']}>54,759.0</span>
                    <span>万</span>
                  </div>
                </div>
                <Divider type="vertical" />
              </Col>
              <Col
                className="gutter-row"
                span={8}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                <div className={cls['board-item']}>
                  <span className={cls['board-item-remark']}>原值</span>
                  <div>
                    <span className={cls['board-price']}>128,239.1</span>
                    <span>万</span>
                  </div>
                </div>
                <Divider type="vertical" />
              </Col>
              <Col className="gutter-row" span={8}>
                <div className={cls['board-item']}>
                  <span className={cls['board-item-remark']}>数量</span>
                  <div>
                    <span className={cls['board-price']}>82,454</span>
                    <span></span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col className="gutter-row" span={8}>
          <Card>
            <Ring />
          </Card>
        </Col>
        <Col className="gutter-row" span={16}>
          <Card>
            <Bar />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} className={cls['card-height-30']}>
        <Col className="gutter-row" span={8}>
          <Card>
            <Pie />
          </Card>
        </Col>
        <Col className="gutter-row" span={16}>
          <Card>
            <Line />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
export default Board;
