import React, { useEffect } from 'react';
import { Chart } from '@antv/g2';

const Line: React.FC = () => {
  const chartInfo = () => {
    const data = [
      { month: '1月', city: '今年', temperature: 7 },
      { month: '1月', city: '去年同期', temperature: 3.9 },
      { month: '2月', city: '今年', temperature: 6.9 },
      { month: '2月', city: '去年同期', temperature: 4.2 },
      { month: '3月', city: '今年', temperature: 9.5 },
      { month: '3月', city: '去年同期', temperature: 5.7 },
      { month: '4月', city: '今年', temperature: 14.5 },
      { month: '4月', city: '去年同期', temperature: 8.5 },
      { month: '5月', city: '今年', temperature: 18.4 },
      { month: '5月', city: '去年同期', temperature: 11.9 },
      { month: '6月', city: '今年', temperature: 21.5 },
      { month: '6月', city: '去年同期', temperature: 15.2 },
      { month: '7月', city: '今年', temperature: 25.2 },
      { month: '7月', city: '去年同期', temperature: 17 },
      { month: '8月', city: '今年', temperature: 26.5 },
      { month: '8月', city: '去年同期', temperature: 16.6 },
      { month: '9月', city: '今年', temperature: 23.3 },
      { month: '9月', city: '去年同期', temperature: 14.2 },
      { month: '10月', city: '今年', temperature: 18.3 },
      { month: '10月', city: '去年同期', temperature: 10.3 },
      { month: '11月', city: '今年', temperature: 13.9 },
      { month: '11月', city: '去年同期', temperature: 6.6 },
      { month: '12月', city: '今年', temperature: 9.6 },
      { month: '12月', city: '去年同期', temperature: 4.8 },
    ];

    const chart = new Chart({
      container: 'containerLine',
      autoFit: true,
      height: 400,
      title: '资产价值变化',
    });

    chart
      .data(data)
      .encode('x', 'month')
      .encode('y', 'temperature')
      .encode('color', 'city')
      .scale('x', {
        range: [0, 1],
      })
      .scale('y', {
        nice: true,
      })
      .axis('y', { labelFormatter: (d: any) => d });

    chart.line().encode('shape', 'smooth');

    chart.point().encode('shape', 'point').tooltip(false);

    chart.render();
  };

  useEffect(() => {
    chartInfo();
  }, []);
  return <div id="containerLine"></div>;
};
export default Line;
