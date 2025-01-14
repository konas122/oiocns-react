import LoadingView from '@/components/Common/Loading';
import orgCtrl from '@/ts/controller';
import { orgAuth } from '@/ts/core/public';
import { Form } from '@/ts/core/thing/standard/form';
import { formatDate } from '@/utils';
import message from '@/utils/message';
import { getUuid, shareOpenLink } from '@/utils/tools';
import { SyncOutlined } from '@ant-design/icons';
import { Chart } from '@antv/g2';
import { Button, Empty, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  generateAggregationPipeline,
  lookupsFieldUnitById,
  mergeConditions,
  simplifyNum,
  transformConditions,
  transformDataForDisplay,
} from '../../../dataAnalysisModal/utils';
import {
  renderAreaChart,
  renderBarChart,
  renderFunnelChart,
  renderLineChart,
  renderPieOrDonutChart,
  renderRoseChart,
  renderScatterPlot,
  renderSmallAreaChart,
  renderSmallBarChart,
  renderSmallDonutChart,
  renderSmallLineChart,
  renderSmallPieChart,
} from '../../../dataAnalysisModal/utils/chart';
import styles from './index.module.less';
interface IProps {
  current: any;
  pageConfig: any;
  chartList: any;
  reload: boolean;
  flag?: string;
}

/**
 * 数据看板
 * @param param0
 * @returns
 */
const Dashboard: React.FC<IProps> = ({
  reload,
  current,
  chartList,
  pageConfig,
  flag = 'inner',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cacheUpdateTime, setCacheUpdateTime] = useState(
    current?.metadata?.chartDataUpdateTime ??
      formatDate(Date.now(), 'yyyy-MM-dd HH:mm:ss.S'),
  );
  const [pageStyles, setPageStyles] = useState<any>({});
  const [newChartList, setNewChartList] = useState<any>([]);
  const currentCompanys = orgCtrl.user.companys.find(
    (cItem) => cItem.belongId === current.spaceId,
  );
  let metaForm = new Form((current as any).metadata, current?.directory);
  useEffect(() => {
    (async () => {
      if (pageConfig) {
        let newBgImg = null;
        if (pageConfig?.bgImg) {
          newBgImg = JSON.parse(pageConfig?.bgImg);
        }
        setPageStyles(() => {
          const pageStyles = {
            ...pageConfig,
            bgImg: newBgImg,
          };
          return pageStyles;
        });
      }
      if (Array.isArray(chartList) && chartList.length > 0) {
        // 图表均有数据源
        const hasDataSource = chartList.every(
          (item) =>
            item.dataSource &&
            Array.isArray(item.dataSource) &&
            item.dataSource.length > 0,
        );
        if (hasDataSource || !reload) {
          chartList.forEach(async (item) => {
            item.key = getUuid();
            await calculateTotalCount(item.dataSource, item);
          });
          setNewChartList(chartList);
          setLoaded(true);
          return;
        }
        reload && fetchData(chartList);
      } else {
        setLoaded(true);
      }
    })();
  }, [chartList, pageConfig, reload]);

  const updateChartCache = (chartList: any) => {
    if (Array.isArray(chartList) && chartList.length > 0) {
      const updateTime = formatDate(Date.now(), 'yyyy-MM-dd HH:mm:ss.S');
      current.metadata.chartList = chartList;
      current.metadata.chartDataUpdateTime = updateTime;
      current.update();
      setCacheUpdateTime(updateTime);
    }
  };

  const calculateTotalCount = async (data: any[], item: any) => {
    const { mode, scatterDimensionRaw, aggregateDimension, aggregateDimensionRaw } = item;
    const fieldType = scatterDimensionRaw?.fieldType;

    const totalCount = data.reduce((accumulator, currentItem) => {
      try {
        return (
          accumulator +
          (currentItem[
            mode === '2d' ? 'count' : aggregateDimensionRaw?.caption ?? 'count'
          ] || 0)
        );
      } catch (error) {
        console.log('error', error);
      }
    }, 0);
    const totalValues = simplifyNum(totalCount ?? 0);
    if (typeof totalValues === 'object') {
      item.totalCount = totalValues.num;
      item.totalUnit = totalValues.unit;
    } else {
      item.totalCount = totalValues;
    }

    let scatterUnitStr = '',
      aggregateUnitStr = '';
    if (aggregateDimension === 'count') {
      aggregateUnitStr = '个';
    } else {
      const unitResult1 = await lookupsFieldUnitById(
        metaForm,
        aggregateDimensionRaw?.propId || '',
      );
      aggregateUnitStr = unitResult1 ?? '';
    }
    if (fieldType == '货币型' || fieldType == '数值型') {
      const unitResult2 = await lookupsFieldUnitById(
        metaForm,
        scatterDimensionRaw?.propId || '',
      );
      scatterUnitStr = unitResult2 ?? '';
    }
    item.unit1 = aggregateUnitStr;
    item.unit2 = scatterUnitStr;
  };

  // 加载数据源
  const fetchData = async (list: any) => {
    try {
      setLoading(true);
      list.forEach((item: any) => {
        item.key = getUuid(); // 保证二次打开页面图表能正常渲染
        item.dataSource = [];
      });

      const threads = list.map(async (item: any) => {
        let isCopy = false;
        let currentCompanys = orgCtrl.user.companys.find(
          (cItem) => cItem.belongId === item.spaceId,
        );
        if (!currentCompanys) {
          currentCompanys = orgCtrl.user.companys.find(
            (cItem) => cItem.belongId === current.spaceId,
          );
          isCopy = true;
        }
        if (currentCompanys?.targets) {
          const targetId = isCopy ? (current as any)?.target?.id : item.targetId;
          const subCompanys = currentCompanys.targets.find(
            (dItem) => dItem.id === targetId,
          );
          if (subCompanys) {
            metaForm = new Form((current as any).metadata, subCompanys.directory);
          }
        }
        const metaData = await metaForm.loadReferenceForm(item.formId);
        if (metaData) {
          const dirs = await metaForm.directory.loadAllDirectory();
          const dirItem = dirs.filter((item) => item.id === metaData.directoryId);
          if (Array.isArray(dirItem) && dirItem.length > 0) {
            // 实例化图表表单
            const chartForm = new Form(metaData, dirItem[0]);
            const filterExpStr = metaData?.options?.dataRange?.filterExp;
            const authExpStr = metaData?.options?.dataRange?.authExp;
            let conditionsValues: any = [];
            if (item?.conditions) {
              conditionsValues = await transformConditions(item.conditions, metaForm);
            }
            if (filterExpStr) {
              const filterExp =
                typeof filterExpStr === 'string'
                  ? JSON.parse(filterExpStr)
                  : filterExpStr;

              conditionsValues = conditionsValues
                ? mergeConditions(filterExp, conditionsValues)
                : filterExp;
            }
            if (authExpStr) {
              const authExpResult = chartForm.parseAuthExp(authExpStr);
              const authExp =
                typeof authExpResult === 'string'
                  ? JSON.parse(authExpResult)
                  : authExpResult;
              conditionsValues = conditionsValues
                ? mergeConditions(authExp, conditionsValues)
                : authExp;
            }
            const loadOptions: any = {
              belongId: current.belongId,
              filter: conditionsValues,
              userData: [],
              options: {
                match: {
                  isDeleted: false,
                },
                project: {
                  _id: 0,
                  archives: 0,
                },
              },
            };

            const {
              mode,
              scatterDimension,
              scatterDimensionRaw,
              scatterDimensionIndex,
              flattenDimension,
              flattenDimensionRaw,
              aggregateDimension,
              aggregateDimensionRaw,
              aggregateDimensionIndex,
            } = item;
            const pipeline = generateAggregationPipeline({
              hashDimension: scatterDimension,
              summaryDimension: aggregateDimension,
              tileDimension: flattenDimension,
              totalIndicators: aggregateDimensionIndex,
            });
            loadOptions.group = pipeline;

            const type1Regex = /^T\d{18}$/;
            if (type1Regex.test(scatterDimension)) {
              loadOptions.options.match[scatterDimension] = {
                _ne_: null,
                _exists_: true,
              };
            }
            if (type1Regex.test(flattenDimension) && mode === '3d') {
              loadOptions.options.match[flattenDimension] = {
                _ne_: null,
                _exists_: true,
              };
            }
            const pipelineResult = await chartForm.loadChartSummary(loadOptions);
            let speciesIds = [];
            if (scatterDimensionRaw?.speciesId) {
              speciesIds.push(scatterDimensionRaw.speciesId);
            }
            if (flattenDimensionRaw?.speciesId) {
              speciesIds.push(flattenDimensionRaw.speciesId);
            }
            const lookups = await chartForm.loadItems(speciesIds);
            const result = await transformDataForDisplay({
              data: pipelineResult,
              mode,
              hashDimension: scatterDimensionRaw,
              summaryDimension: aggregateDimensionRaw,
              tileDimension: flattenDimensionRaw,
              dimensionIndex: scatterDimensionIndex,
              lookups,
            });
            item.dataSource = result;
            await calculateTotalCount(result, item);
          } else {
            throw {
              message: `未找到表单${item.formId}目录，请检查！`,
              code: 404,
            };
          }
        } else {
          throw {
            message: `未找到引用表单${item.formId}，请检查！`,
            code: 404,
          };
        }
      });
      await Promise.all(threads);
      setNewChartList(list);
      updateChartCache(list);
      setLoaded(true);
      setLoading(false);
    } catch (error: any) {
      error?.message && message.error(error.message);
      setLoaded(true);
      setLoading(false);
    }
  };

  /**
   * 渲染图表
   * @param obj
   * @returns
   */
  const renderChart = async (obj: any) => {
    if (!obj.dataSource) {
      return null;
    }
    let {
      id,
      key,
      chartType,
      scatterDimensionRaw,
      flattenDimensionRaw,
      aggregateDimensionRaw,
      mode,
      cardConfig,
      unit1,
      unit2,
    } = obj;
    const xName = scatterDimensionRaw?.caption;
    const yName = flattenDimensionRaw?.caption;
    const zName = aggregateDimensionRaw?.caption;
    unit1 = unit1 ?? '';
    unit2 = unit2 ?? '';
    try {
      const chartData = obj.dataSource;
      const chart = new Chart({
        container: key ?? id,
        autoFit: true,
      });
      chart.animate(false);
      chart.data(chartData);
      if (mode === '3d') {
        chart
          .encode('x', xName ?? 'letter')
          .encode('y', zName ?? 'count')
          .encode('color', yName ?? 'name');
      }
      if (
        cardConfig &&
        cardConfig?.style === 'default' &&
        (cardConfig?.size === 'medium' || cardConfig?.size === 'small')
      ) {
        switch (chartType) {
          case 'PieChart': // 饼状图
          case 'RoseChart': // 玫瑰图
          case 'FunnelChart': // 漏斗图
            renderSmallPieChart(chart);
            break;
          case 'DonutChart': // 环形图
            renderSmallDonutChart(chart);
            break;
          case 'LineChart': // 折线图
            renderSmallLineChart(chart, xName, yName, zName, unit1, unit2);
            break;
          case 'BarChart': // 柱状图
            renderSmallBarChart(chart);
            break;
          case 'ScatterPlot': // 散点图
          case 'AreaChart': // 面积图
            renderSmallAreaChart(chart, xName, yName, zName, unit1, unit2);
            break;
          default:
            break;
        }
      } else {
        switch (chartType) {
          case 'PieChart': // 饼状图
          case 'DonutChart': // 环形图
            renderPieOrDonutChart(chart, chartType, unit1, cardConfig);
            break;
          case 'RoseChart': // 玫瑰图
            renderRoseChart(chart, unit1, cardConfig);
            break;
          case 'FunnelChart': // 漏斗图
            renderFunnelChart(chart, unit1, cardConfig);
            break;
          case 'LineChart': // 折线图
            renderLineChart(
              chartData,
              chart,
              xName,
              yName,
              zName,
              unit1,
              unit2,
              flag,
              cardConfig,
            );
            break;
          case 'BarChart': // 柱状图
            renderBarChart(
              chartData,
              chart,
              xName,
              yName,
              zName,
              unit1,
              unit2,
              flag,
              cardConfig,
            );
            break;

          case 'ScatterPlot': // 散点图
            renderScatterPlot(
              chartData,
              chart,
              xName,
              yName,
              zName,
              unit1,
              unit2,
              flag,
              cardConfig,
            );
            break;
          case 'AreaChart': // 面积图
            renderAreaChart(
              chartData,
              chart,
              xName,
              yName,
              zName,
              unit1,
              unit2,
              flag,
              cardConfig,
            );
            break;
          default:
            break;
        }
      }
      return chart;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <>
      {loaded ? (
        <>
          {newChartList && Array.isArray(newChartList) && newChartList.length > 0 ? (
            <div
              className={styles.chartsContainer}
              style={{
                background: pageStyles?.bgImg
                  ? `url(${shareOpenLink(
                      pageStyles?.bgImg?.shareLink,
                    )}) no-repeat center / 100% 100%`
                  : 'none',
                backgroundColor: pageStyles?.bgColor || '#f8f8f8',
                height: pageStyles?.heightValue
                  ? `${pageStyles?.heightValue}${pageStyles?.heightUnit}`
                  : '100%',
                width: pageStyles?.widthValue
                  ? `${pageStyles?.widthValue}${pageStyles?.widthUnit}`
                  : '100%',
                overflowX: 'hidden',
                overflowY: 'scroll',
                paddingBottom: `${flag === 'home' ? '100px' : '0px'}`,
              }}>
              <div className={styles.charts_header}>
                <span className={styles.charts_header_time}>
                  上次更新时间：{cacheUpdateTime}
                </span>

                {currentCompanys?.hasAuthoritys([
                  orgAuth.SuperAuthId,
                  orgAuth.RelationAuthId,
                  orgAuth.DataAuthId,
                ]) && (
                  <span className={styles.charts_header_refresh}>
                    <Button
                      className={styles.charts_header_refresh_btn}
                      type="text"
                      icon={<SyncOutlined size={12} />}
                      loading={loading}
                      onClick={() => {
                        fetchData(chartList);
                      }}>
                      更新
                    </Button>
                  </span>
                )}
              </div>

              {!loading ? (
                <>
                  {Array.isArray(newChartList) &&
                    newChartList
                      .filter((item) => !item.isHide)
                      .map((item, index) => {
                        const {
                          cardConfig,
                          name,
                          aggregateDimensionRaw,
                          aggregateDimension,
                          totalCount,
                          totalUnit,
                          unit1,
                        } = item;

                        const cardStyles = {
                          background: cardConfig?.bg
                            ? `url(${shareOpenLink(
                                JSON.parse(cardConfig.bg)?.shareLink,
                              )}) no-repeat center / 100% 100%`
                            : cardConfig?.cardBgColor || '#ffffff',
                          boxShadow: cardConfig?.bg
                            ? 'none'
                            : '0px 1px 2px 0px #0000001a',
                          width: `${
                            cardConfig?.style == 'custom'
                              ? cardConfig?.widthValue + cardConfig?.widthUnit
                              : cardConfig?.size === 'large'
                              ? 'calc(50% - 10px)'
                              : cardConfig?.size === 'medium' ||
                                cardConfig?.size === 'small'
                              ? 'calc(33.33% - 10px)'
                              : 'calc(50% - 10px)'
                          }`,
                          height: `${
                            cardConfig?.style == 'custom'
                              ? cardConfig?.heightValue + cardConfig?.heightUnit
                              : cardConfig?.size === 'large'
                              ? '444px'
                              : cardConfig?.size === 'medium'
                              ? '176px'
                              : cardConfig?.size === 'small'
                              ? '120px'
                              : '444px'
                          }`,
                        };
                        return (
                          <>
                            {cardConfig &&
                            cardConfig?.style === 'default' &&
                            (cardConfig?.size === 'medium' ||
                              cardConfig?.size === 'small') ? (
                              <div
                                key={item.key}
                                className={`${styles.item} ${styles.item_box}`}
                                style={{
                                  ...cardStyles,
                                  flexDirection:
                                    cardConfig?.size === 'medium' ? 'column' : 'row',
                                }}>
                                <div
                                  className={styles.item_box_left}
                                  style={{
                                    padding:
                                      cardConfig?.size === 'medium'
                                        ? '12px 0px 0px'
                                        : '24px',
                                    width: cardConfig?.size === 'medium' ? '100%' : '50%',
                                    textAlign:
                                      cardConfig?.size === 'medium' ? 'center' : 'left',
                                  }}>
                                  <div
                                    className={styles.item_box_left_index}
                                    style={{
                                      color:
                                        cardConfig?.indexNameColor ||
                                        'rgba(0, 0, 0, 0.6)',
                                    }}>
                                    {cardConfig?.indexName ||
                                      aggregateDimensionRaw?.caption ||
                                      '数量'}
                                  </div>
                                  <div className={styles.item_box_left_number}>
                                    {/* 数值 */}
                                    <span
                                      style={{
                                        color:
                                          cardConfig?.indexValueColor ||
                                          'rgba(0, 0, 0, 0.9)',
                                      }}>
                                      {totalCount}
                                    </span>

                                    {/* 单位 */}
                                    <span
                                      className={styles.item_box_left_number_unit}
                                      style={{
                                        color:
                                          cardConfig?.indexValueUnitColor ||
                                          'rgba(0, 0, 0, 0.9)',
                                      }}>
                                      {aggregateDimension === 'count'
                                        ? '个'
                                        : `${totalUnit ? totalUnit : ''}${
                                            unit1 ? unit1 : ''
                                          }`}
                                    </span>
                                  </div>
                                </div>
                                <div className={styles.item_box_right}>
                                  <ChartItem renderChart={renderChart} item={item} />
                                </div>
                              </div>
                            ) : (
                              <div
                                key={item.key}
                                className={styles.item}
                                style={cardStyles}>
                                <div className={styles.item_head}>
                                  {cardConfig?.icon && (
                                    <img
                                      className={styles.item_head_icon}
                                      src={shareOpenLink(
                                        JSON.parse(cardConfig?.icon)?.shareLink,
                                      )}
                                    />
                                  )}
                                  <span
                                    className={styles.item_head_title}
                                    style={{
                                      color: cardConfig?.nameColor || '#000',
                                    }}>
                                    {cardConfig?.name ?? name}
                                  </span>
                                </div>
                                <div className={styles.item_content}>
                                  <ChartItem renderChart={renderChart} item={item} />
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })}
                </>
              ) : (
                <div
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    paddingTop: '15%',
                  }}>
                  <Spin size="large" />
                  <p style={{ paddingTop: 14 }}>数据更新中...</p>
                </div>
              )}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无数据"
              style={{ marginTop: '20%' }}
            />
          )}
        </>
      ) : (
        <LoadingView text="配置信息加载中..." />
      )}
    </>
  );
};

const ChartItem = ({ renderChart, item }) => {
  useEffect(() => {
    let chartObj: any, timer: any;
    timer = setTimeout(() => {
      const renderChartItem = async () => {
        // 使用 renderChart 创建图表实例
        chartObj = await renderChart(item);
        // 渲染图表
        chartObj && chartObj.render();
      };
      renderChartItem();
    }, 100);

    // 处理窗口大小变化
    const handleResize = () => {
      chartObj && chartObj.render();
    };
    window.addEventListener('resize', handleResize);

    // 清理图表和事件监听器
    return () => {
      try {
        window.removeEventListener('resize', handleResize);
        chartObj && chartObj.destroy(); // 销毁图表实例
        clearTimeout(timer);
      } catch (error) {
        console.log('error', error);
      }
    };
  }, [renderChart, item.key, item.id]);
  return <div id={item.key ?? item.id} style={{ width: '100%', height: '100%' }}></div>;
};

export default React.memo(Dashboard);
