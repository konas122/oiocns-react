import React, { useEffect } from 'react';
import { Chart } from '@antv/g2';
const LineChart: React.FC<any> = (fsSize: any) => {
  if (!fsSize) {
    return <></>;
  }
  const chartInfo = () => {
    const data = [
      {
        item: '使用',
        count: fsSize.fsSize,
        percent: fsSize.fsSize / fsSize.fsTotal,
      },
      {
        item: '总量',
        count: fsSize.fsSize,
        percent: 1 - fsSize.fsSize / fsSize.fsTotal,
      },
    ];
    const chart = new Chart({
      container: 'container',
      autoFit: true,
    });
    chart.coordinate({ type: 'theta', outerRadius: 0.8, innerRadius: 0.5 });
    chart
      .interval()
      .data(data)
      .transform({ type: 'stackY' })
      .encode('y', 'percent')
      .encode('color', 'item')
      .tooltip((data) => ({
        name: data.item,
        value: `${(data.percent * 100).toFixed(2)}%`,
      }));
    chart.legend(false);
    chart.render();
  };
  useEffect(() => {
    chartInfo();
  }, []);
  return <div id="container" style={{ width: '200px' }}></div>;
};
export default LineChart;
