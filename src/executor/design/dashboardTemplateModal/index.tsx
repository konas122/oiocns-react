import FullScreenModal from '@/components/Common/fullScreen';
import { Button, Checkbox, Divider, Empty } from 'antd';
import * as dev from 'devextreme-react';
import { Resizable as DxResizable } from 'devextreme-react';
import { ItemDragging } from 'devextreme-react/list';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import CardConfig from './components/cardConfig';
import Dashboard from './components/dashboard';
import PageConfig from './components/pageConfig';
import DataAnalysisModal from '../dataAnalysisModal';
import styles from './index.module.less';
import { IBaseView } from '@/ts/core/thing/standard/view/baseView';
interface IProps {
  current: IBaseView;
  finished: () => void;
}

const ChartItem = React.memo(
  ({
    item,
    onToggleHide,
    onToggleConfig,
    onRemoveView,
    onUpdateChart,
  }: {
    item: any;
    onToggleHide: () => void;
    onToggleConfig: () => void;
    onRemoveView: () => void;
    onUpdateChart: () => void;
  }) => {
    return (
      <div key={item.id} className={styles['dashboardTemplateModal-aside-result-box']}>
        <div className={styles['dashboardTemplateModal-aside-result-box-img']}>
          <img src={item.thumbnail} alt="" style={{ width: '100%' }} />
        </div>
        <div className={styles['dashboardTemplateModal-aside-result-box-name']}>
          {item?.cardConfig?.name || item?.name}
        </div>
        <div className={styles['dashboardTemplateModal-aside-result-box-extra']}>
          <div>
            <Checkbox checked={!item.isHide} onChange={onToggleHide}>
              {item.isHide ? '隐藏' : '显示'}
            </Checkbox>
          </div>
          <div className={styles['dashboardTemplateModal-aside-result-box-extra-btns']}>
            <a onClick={onUpdateChart}>编辑</a>
            <Divider type="vertical" />
            <a onClick={onToggleConfig}>配置</a>
            <Divider type="vertical" />
            <a onClick={onRemoveView}>删除</a>
          </div>
        </div>
      </div>
    );
  },
);
const Resizable = React.memo(DxResizable);

/**
 * 数据看板弹窗
 * @param param0
 * @returns
 */
const DashboardTemplateModal: React.FC<IProps> = ({ current, finished }) => {
  const [visiblePageConfig, setVisiblePageConfig] = useState(false);
  const [visibleCardConfig, setVisibleCardConfig] = useState(false);
  const [visibleChartConfig, setVisibleChartConfig] = useState(false);
  const [currentCard, setCurrentCard] = useState<any>([]);
  const [currentChart, setCurrentChart] = useState<any>({});
  // 页面配置
  const [pageConfig, setPageConfig] = useState<any>({});
  const [chartList, setChartList] = useState<any>([]);
  const [asideWidth, setAsideWidth] = useState<number | string>('20%');
  // 是否应该重新加载物
  const shouldReRequest = useRef<boolean>(true);

  useEffect(() => {
    handleSetChartList();
    const { config } = current?.metadata;
    if (config) {
      setPageConfig(config);
    }

    return () => {
      shouldReRequest.current = true;
    };
  }, [current?.metadata]);

  /**
   * 设置图表
   */
  const handleSetChartList = () => {
    const { chartList } = current?.metadata;
    if (Array.isArray(chartList) && chartList.length > 0) {
      setChartList(chartList);
    }
  };

  /**
   * 移除图表
   */
  const handleRemoveView = useCallback(
    (item: any) => {
      setChartList((prevChartList: any) =>
        prevChartList.filter((i: any) => i.id !== item.id),
      );
    },
    [current],
  );

  /**
   * 更新图表状态（显示/隐藏）
   */
  const handleUpdateChartState = useCallback(
    (row: any) => {
      setChartList((prevChartList: any) => {
        const updatedChartList = prevChartList.map((item: any) =>
          item.id === row.id ? { ...item, isHide: !item.isHide } : item,
        );
        return updatedChartList;
      });
    },
    [current],
  );

  /**
   * 在列表项移动到另一个位置后执行的函数
   */
  const handleReorder = useCallback(
    (e: { fromIndex: number; toIndex: number }) => {
      setChartList((prevChartList: any) => {
        const updatedChartList = [...prevChartList];
        const [movedItem] = updatedChartList.splice(e.fromIndex, 1);
        updatedChartList.splice(e.toIndex, 0, movedItem);
        current.metadata.chartList = updatedChartList;
        return updatedChartList;
      });
    },
    [current.metadata],
  );

  /**
   * 更新图表卡片配置
   */
  const handleUpdateChartCardConfig = useCallback(
    (record: any, values: any) => {
      setChartList((prevChartList: any) => {
        const updatedChartList = prevChartList.map((item: any) => {
          if (item.id === record.id) {
            return {
              ...item,
              cardConfig: values,
            };
          }
          return item;
        });
        return updatedChartList;
      });
      setVisibleCardConfig(false);
    },
    [current],
  );

  const resizableProps = useMemo(
    () => ({
      handles: 'right',
      width: asideWidth,
      maxWidth: 600,
      minWidth: 250,
      onResize: (e: any) => setAsideWidth(e.width),
    }),
    [asideWidth],
  );

  return (
    <FullScreenModal
      open
      centered
      fullScreen={false}
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={'数据模板配置'}
      onSave={async () => {
        await current.update({
          chartList: chartList,
          config: pageConfig,
        } as any);
        finished();
      }}
      onCancel={finished}>
      {chartList && Array.isArray(chartList) && chartList.length > 0 ? (
        <div className={styles['dashboardTemplateModal']}>
          <Resizable {...resizableProps}>
            <div className={styles['dashboardTemplateModal-aside']}>
              <div className={styles['dashboardTemplateModal-aside-result']}>
                {chartList.length > 0 && (
                  <dev.List
                    dataSource={chartList}
                    height={'100%'}
                    width={'100%'}
                    pageLoadMode="scrollBottom"
                    noDataText=""
                    onItemReordered={handleReorder}
                    itemRender={(item) => (
                      <ChartItem
                        key={item.id}
                        item={item}
                        onToggleHide={() => handleUpdateChartState(item)}
                        onToggleConfig={() => {
                          setCurrentCard(item);
                          setVisibleCardConfig(true);
                        }}
                        onRemoveView={() => handleRemoveView(item)}
                        onUpdateChart={() => {
                          setCurrentChart(item);
                          setVisibleChartConfig(true);
                        }}
                      />
                    )}>
                    <ItemDragging
                      data={chartList}
                      autoScroll
                      allowReordering
                      dropFeedbackMode="push"
                      dragDirection="vertical"
                    />
                  </dev.List>
                )}
              </div>
              <div className={styles['dashboardTemplateModal-aside-footer']}>
                <Button
                  style={{ width: '100%' }}
                  onClick={() => setVisiblePageConfig(true)}>
                  页面配置
                </Button>
              </div>
            </div>
          </Resizable>
          <div className={styles['dashboardTemplateModal-main']}>
            <div className={styles['dashboardTemplateModal-main-content']}>
              {chartList.filter((item) => !item.isHide).length > 0 ? (
                <Dashboard
                  reload={shouldReRequest.current}
                  current={current}
                  pageConfig={pageConfig}
                  chartList={chartList}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="请选择图表"
                  style={{ marginTop: '20%' }}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无数据"
          style={{ marginTop: '20%' }}
        />
      )}
      {/* 页面配置 */}
      {visiblePageConfig && (
        <PageConfig
          current={current}
          pageConfig={_.cloneDeep(pageConfig)}
          onUpdateConfig={(values) => {
            setPageConfig(values);
          }}
          finished={() => {
            setVisiblePageConfig(false);
          }}
        />
      )}
      {/* 卡片配置 */}
      {visibleCardConfig && (
        <CardConfig
          current={current}
          currentCard={currentCard}
          finished={(values) => {
            shouldReRequest.current = false;
            values
              ? handleUpdateChartCardConfig(currentCard, values)
              : setVisibleCardConfig(false);
          }}
        />
      )}
      {/* 图表配置（编辑） */}
      {visibleChartConfig && (
        <DataAnalysisModal
          finished={(flag) => {
            flag && handleSetChartList();
            setVisibleChartConfig(false);
          }}
          chart={currentChart}
          current={current as any}
        />
      )}
    </FullScreenModal>
  );
};
export default DashboardTemplateModal;
