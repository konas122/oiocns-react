import { IForm } from '@/ts/core';
import { Chart } from '@antv/g2';
import { Empty, Radio, Space } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { chartType2D, chartType3D } from '../../config';
import styles from '../../index.module.less';
import {
  lookupsFieldUnitById
} from '../../utils';
import {
  renderAreaChart,
  renderBarChart,
  renderFunnelChart,
  renderLineChart,
  renderPieOrDonutChart,
  renderRoseChart,
  renderScatterPlot,
} from '../../utils/chart';

interface IProps {
  current: IForm;
  formData: any;
  dataSource: any;
  isCaptureContent: boolean;
  hasValidAttributesAndData: any;
  onUpdateFormData: Function;
}

const Charts: React.FC<IProps> = ({
  current,
  formData,
  dataSource,
  isCaptureContent,
  onUpdateFormData,
  hasValidAttributesAndData,
}) => {
  const {
    aggregateDimension,
    scatterDimensionRaw,
    flattenDimensionRaw,
    aggregateDimensionRaw,
    mode,
  } = formData;
  const chartRef = useRef<Chart | null>(null);
  const chartId = 'dataAnalysis-chart-container';
  const [chartType, setChartType] = useState('');
  const [chartData, setChartData] = useState<any>([]);
  // 散列纬度单位
  const [scatterUnitStr, setScatterUnitStr] = useState<any>('');
  // 汇总纬度单位
  const [aggregateUnitStr, setAggregateUnitStr] = useState<any>('');
  const xName = scatterDimensionRaw?.caption;
  const yName = flattenDimensionRaw?.caption;
  const zName = aggregateDimensionRaw?.caption;
  useEffect(() => {
    const handleResize = _.debounce(() => {
      chartRef.current && chartRef.current.render();
    }, 300);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // 清理图表实例，防止内存泄漏
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (formData['chartType']) {
      setChartType(formData['chartType']);
    } else {
      if (mode === '2d') {
        setChartType('PieChart');
      } else {
        setChartType('LineChart');
      }
    }
  }, [formData]);

  const isEmptyData = useCallback(() => {
    return Array.isArray(chartData) && chartData.length === 0;
  }, [chartData]);

  useEffect(() => {
    if (hasValidAttributesAndData()) {
      const fetchData = async () => {
        try {
          if (aggregateDimension === 'count') {
            setAggregateUnitStr('个');
          } else {
            const unitResult1 = await lookupsFieldUnitById(
              current,
              aggregateDimensionRaw?.propId || '',
            );
            setAggregateUnitStr(unitResult1 ?? '');
          }
          const fieldType = scatterDimensionRaw?.fieldType;
          if (fieldType == '货币型' || fieldType == '数值型') {
            const unitResult2 = await lookupsFieldUnitById(
              current,
              scatterDimensionRaw?.propId || '',
            );
            setScatterUnitStr(unitResult2 ?? '');
          }
          setChartData(dataSource);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchData();
    } else {
      console.log('未配置属性或数据源');
    }
  }, [dataSource]);

  const initializeChart = (containerId: string) => {
    return new Chart({
      container: containerId,
      autoFit: true,
    });
  };

  useEffect(() => {
    if (!hasValidAttributesAndData()) return;
    if (isEmptyData()) return;
    if (chartRef.current) {
      chartRef.current.destroy(); // 先销毁已有图表实例
    }
    // 创建新的图表实例
    chartRef.current = initializeChart(chartId);
    chartRef.current.data(chartData);
    if (mode === '3d') {
      chartRef.current
        .encode('x', xName ?? 'letter')
        .encode('y', zName ?? 'count')
        .encode('color', yName ?? 'name');
    }

    switch (chartType) {
      case 'PieChart': // 饼状图
      case 'DonutChart': // 环形图
        renderPieOrDonutChart(chartRef.current, chartType, aggregateUnitStr);
        break;
      case 'RoseChart': // 玫瑰图
        renderRoseChart(chartRef.current, aggregateUnitStr);
        break;
      case 'FunnelChart': // 漏斗图
        renderFunnelChart(chartRef.current, aggregateUnitStr);
        break;
      case 'LineChart': // 折线图
        renderLineChart(
          chartData,
          chartRef.current,
          xName,
          yName,
          zName,
          aggregateUnitStr,
          scatterUnitStr,
        );
        break;
      case 'BarChart': // 柱状图
        renderBarChart(
          chartData,
          chartRef.current,
          xName,
          yName,
          zName,
          aggregateUnitStr,
          scatterUnitStr,
        );
        break;
      case 'ScatterPlot': // 散点图
        renderScatterPlot(
          chartData,
          chartRef.current,
          xName,
          yName,
          zName,
          aggregateUnitStr,
          scatterUnitStr,
        );
        break;
      case 'AreaChart': // 面积图
        renderAreaChart(
          chartData,
          chartRef.current,
          xName,
          yName,
          zName,
          aggregateUnitStr,
          scatterUnitStr,
        );
        break;
      default:
        break;
    }
    chartRef.current.render();
  }, [chartType, chartData]);

  return (
    <>
      {!hasValidAttributesAndData() || isEmptyData() ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '100px 0' }}
          description="暂无数据"
        />
      ) : (
        <>
          {hasValidAttributesAndData() && !isCaptureContent && (
            <div className={styles['dataAnalysisModal-content-affix']}>
              <Radio.Group
                defaultValue={chartType}
                onChange={(event) => {
                  const value = event.target.value;
                  const chartItem = (
                    formData['mode'] === '2d' ? chartType2D : chartType3D
                  ).filter((item) => item.id === value);
                  onUpdateFormData({
                    chartType: value,
                    thumbnail: chartItem[0]?.img,
                  });
                  setChartType(value);
                }}>
                <Space direction="vertical">
                  {formData['mode'] == '2d' ? (
                    <>
                      {chartType2D.map((item) => {
                        return (
                          <Radio key={item.id} value={item.id}>
                            {item.text}
                          </Radio>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {chartType3D.map((item) => {
                        return (
                          <Radio key={item.id} value={item.id}>
                            {item.text}
                          </Radio>
                        );
                      })}
                    </>
                  )}
                </Space>
              </Radio.Group>
            </div>
          )}
          <div
            id={chartId}
            style={{
              width: '92%',
              height: '100%',
              textAlign: 'center',
              marginLeft: '1%',
            }}
          />
        </>
      )}
    </>
  );
};
export default Charts;
