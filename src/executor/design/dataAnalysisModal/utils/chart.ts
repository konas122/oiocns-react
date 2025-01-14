import { Chart } from '@antv/g2';
import { isArrayWithMinLength } from './index';

const get2dTooltipConfig = (unit: string) => {
  try {
    return {
      title: (d: any) => d.item,
      items: [
        (d: any) => ({
          name: d.item,
          value: `${d?.count?.toLocaleString()}${unit}`,
          channel: 'y',
        }),
      ],
    };
  } catch (error) {
    return {};
  }
};

const get3dTooltipConfig = (
  xName: string,
  yName: string,
  zName: string,
  scatterUnitStr: string,
  aggregateUnitStr: string,
) => {
  try {
    return {
      title: (d: any) => {
        let value = d[xName ?? 'letter'];
        if (typeof value === 'number') {
          value = value.toLocaleString();
        }
        return value + scatterUnitStr;
      },
      items: [
        (d: any) => ({
          name: d[yName ?? 'name'],
          value: `${d[zName ?? 'count']?.toLocaleString()}${aggregateUnitStr}`,
          channel: 'y',
        }),
      ],
    };
  } catch (error) {
    return {};
  }
};

// 通用的 legend 配置
const get3dLegendConfig = (chartData: any, config?: any) => ({
  color: {
    maxRows: isArrayWithMinLength(chartData) ? 2 : 1,
    itemLabelFill: config?.chartTextColor || '#000',
  },
});

// 通用的 axis 配置
const get3dXAxisConfig = (unit: string, config?: any) => ({
  labelFormatter: (datum: any) => {
    return `${datum}${unit}`;
  },
  titleFill: config?.chartTextColor || '#000',
  labelFill: config?.chartTextColor || '#000',
});

const get3dYAxisConfig = (zName: string, config?: any) => ({
  title: zName,
  titleFill: config?.chartTextColor || '#000',
  labelFill: config?.chartTextColor || '#000',
});

// 饼图&环形图
export const renderPieOrDonutChart = (
  chartRef: Chart,
  chartType: string,
  aggregateUnitStr: string,
  config?: any,
) => {
  chartRef.coordinate({
    type: 'theta',
    outerRadius: 0.8,
    ...(chartType === 'DonutChart' && { innerRadius: 0.5 }),
  });
  chartRef
    .interval()
    .transform({ type: 'stackY' })
    .encode('y', 'percent')
    .encode('color', 'item')
    .legend({
      color: {
        position: 'bottom',
        layout: { justifyContent: 'center' },
        maxRows: 1,
        itemLabelFill: config?.chartTextColor || '#000',
      },
    })
    .label({
      position: 'outside',
      text: (data: any) =>
        `${data.item}: ${data.count.toLocaleString()}${aggregateUnitStr}`,
      fill: config?.chartTextColor || '#000',
      // stroke: config?.chartTextColor || '#ddd',
      connectorStroke: config?.chartTextColor || '#000',
    })
    .tooltip((data: any) => ({
      name: data.item,
      value: `${(data.percent * 100).toFixed(2)}%`,
    }));
};
// 玫瑰图
export const renderRoseChart = (
  chartRef: Chart,
  aggregateUnitStr: string,
  config?: any,
) => {
  chartRef.coordinate({ type: 'polar', outerRadius: 0.85 });
  chartRef
    .interval()
    .encode('x', 'item')
    .encode('y', 'count')
    .encode('color', 'item')
    .scale('y', { type: 'sqrt' })
    .scale('x', { padding: 0 })
    .axis(false)
    .label({
      position: 'outside',
      text: (data: any) =>
        `${data.item}: ${data.count.toLocaleString()}${aggregateUnitStr}`,
      fill: config?.chartTextColor || '#000',
      // stroke: config?.chartTextColor || '#ddd',
      connectorStroke: config?.chartTextColor || '#000',
    })
    .legend({
      color: {
        layout: {
          justifyContent: 'center',
        },
        maxRows: 1,
        itemLabelFill: config?.chartTextColor || '#000',
      },
    })
    .animate('enter', { type: 'waveIn' })
    .tooltip(get2dTooltipConfig(aggregateUnitStr));
};
// 漏斗图
export const renderFunnelChart = (
  chartRef: Chart,
  aggregateUnitStr: string,
  config?: any,
) => {
  chartRef.coordinate({
    transform: [{ type: 'transpose' }],
  });
  chartRef
    .interval()
    .encode('x', 'item')
    .encode('y', 'count')
    .encode('color', 'item')
    .encode('shape', 'funnel')
    .transform({ type: 'symmetryY' })
    .scale('x', { padding: 0 })
    .animate('enter', { type: 'fadeIn' })
    .label({
      text: (d: any) => `${d.item}\u0020\u0020${d.count}${aggregateUnitStr}`,
      position: 'inside',
      render: (text: string) => {
        return `
          <div style="left:-50%;top:-15px;position:relative;font-size:14px;color:${
            config?.chartTextColor || '#000'
          }">${text}</div>
        `;
      },
    })
    .legend({
      color: {
        maxRows: 1,
        itemLabelFill: config?.chartTextColor || '#000',
      },
    })
    .tooltip(get2dTooltipConfig(aggregateUnitStr))
    .axis(false);
};
// 折线图
export const renderLineChart = (
  chartData: any,
  chartRef: Chart,
  xName: string,
  yName: string,
  zName: string,
  aggregateUnitStr: string,
  scatterUnitStr: string,
  flag?: string,
  config?: any,
) => {
  chartRef
    .scale('x', { range: [0, 1] })
    .scale('y', { nice: true })
    .line()
    .slider('y', isArrayWithMinLength(chartData) && flag === 'inner' ? {} : null)
    .slider('x', isArrayWithMinLength(chartData) && flag === 'inner' ? {} : null)
    .axis('x', get3dXAxisConfig(scatterUnitStr, config))
    .axis('y', get3dYAxisConfig(zName, config))
    .encode('shape', 'smooth')
    .legend(get3dLegendConfig(chartData, config))
    .tooltip(get3dTooltipConfig(xName, yName, zName, scatterUnitStr, aggregateUnitStr));
  chartRef.point().encode('shape', 'point').tooltip(false);
};
// 柱状图
export const renderBarChart = (
  chartData: any,
  chartRef: Chart,
  xName: string,
  yName: string,
  zName: string,
  aggregateUnitStr: string,
  scatterUnitStr: string,
  flag?: string,
  config?: any,
) => {
  chartRef
    .interval()
    .transform({ type: 'dodgeX' })
    .style({
      minWidth: 12,
    })
    .slider('y', isArrayWithMinLength(chartData) && flag === 'inner' ? {} : null)
    .slider('x', isArrayWithMinLength(chartData) && flag === 'inner' ? {} : null)
    .axis('x', get3dXAxisConfig(scatterUnitStr, config))
    .axis('y', get3dYAxisConfig(zName, config))
    .legend(get3dLegendConfig(chartData, config))
    .tooltip(get3dTooltipConfig(xName, yName, zName, scatterUnitStr, aggregateUnitStr))
    .interaction('elementHighlight', { background: true });
};
// 散点图
export const renderScatterPlot = (
  chartData: any,
  chartRef: Chart,
  xName: string,
  yName: string,
  zName: string,
  aggregateUnitStr: string,
  scatterUnitStr: string,
  flag?: string,
  config?: any,
) => {
  chartRef
    .point()
    .slider('y', isArrayWithMinLength(chartData) && flag === 'inner' ? {} : null)
    .slider('x', isArrayWithMinLength(chartData) && flag === 'inner' ? {} : null)
    .axis('x', get3dXAxisConfig(scatterUnitStr, config))
    .axis('y', get3dYAxisConfig(zName, config))
    .legend(get3dLegendConfig(chartData, config))
    .tooltip(get3dTooltipConfig(xName, yName, zName, scatterUnitStr, aggregateUnitStr));
};
// 面积图
export const renderAreaChart = (
  chartData: any,
  chartRef: Chart,
  xName: string,
  yName: string,
  zName: string,
  aggregateUnitStr: string,
  scatterUnitStr: string,
  flag?: string,
  config?: any,
) => {
  chartRef
    .area()
    .style('fillOpacity', 0.3)
    .slider('y', isArrayWithMinLength(chartData) && flag === 'inner' ? {} : null)
    .slider('x', isArrayWithMinLength(chartData) && flag === 'inner' ? {} : null)
    .axis('x', get3dXAxisConfig(scatterUnitStr, config))
    .axis('y', get3dYAxisConfig(zName, config))
    .tooltip(get3dTooltipConfig(xName, yName, zName, scatterUnitStr, aggregateUnitStr));
  chartRef
    .line()
    .style('strokeWidth', 2)
    .legend(get3dLegendConfig(chartData, config))
    .tooltip(false);
};

// 迷你饼图
export const renderSmallPieChart = (chartRef: Chart) => {
  chartRef.coordinate({ type: 'theta' });
  chartRef
    .interval()
    .transform({ type: 'stackY' })
    .encode('y', 'percent')
    .encode('color', 'item')
    .style('radius', 4)
    .style('stroke', '#fff')
    .style('lineWidth', 1)
    .animate('enter', { type: 'waveIn' })
    .axis(false)
    .legend(false)
    .tooltip((data: any) => ({
      name: data.item,
      value: `${(data.percent * 100).toFixed(2)}%`,
    }));
};

// 迷你环形图
export const renderSmallDonutChart = (chartRef: Chart) => {
  chartRef.coordinate({ type: 'theta', outerRadius: 0.8, innerRadius: 0.5 });
  chartRef
    .interval()
    .transform({ type: 'stackY' })
    .encode('y', 'percent')
    .encode('color', 'item')
    .legend(false)
    .tooltip((data: any) => ({
      name: data.item,
      value: `${(data.percent * 100).toFixed(2)}%`,
    }));
};

// 迷你折线图
export const renderSmallLineChart = (
  chartRef: Chart,
  xName: string,
  yName: string,
  zName: string,
  aggregateUnitStr: string,
  scatterUnitStr: string,
) => {
  chartRef
    .line()
    .encode('shape', 'smooth')
    .animate('enter', { type: 'fadeIn' })
    .legend(false)
    .tooltip(get3dTooltipConfig(xName, yName, zName, scatterUnitStr, aggregateUnitStr))
    .axis(false);
};

// 迷你柱状图
export const renderSmallBarChart = (chartRef: Chart) => {
  chartRef.interval().legend(false).axis(false);
};

// 迷你面积图
export const renderSmallAreaChart = (
  chartRef: Chart,
  xName: string,
  yName: string,
  zName: string,
  aggregateUnitStr: string,
  scatterUnitStr: string,
) => {
  chartRef
    .area()
    .encode('shape', 'smooth')
    .scale('y', { zero: true })
    .style('fill', 'linear-gradient(-90deg, #D4E3FC 0%, #0052D9 100%)')
    .style('fillOpacity', 0.6)
    .animate('enter', { type: 'fadeIn' })
    .legend(false)
    .tooltip(get3dTooltipConfig(xName, yName, zName, scatterUnitStr, aggregateUnitStr))
    .axis(false);
};
