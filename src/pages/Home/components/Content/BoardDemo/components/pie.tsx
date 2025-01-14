import React, { useEffect } from 'react';
import { Chart } from '@antv/g2';

const Pie: React.FC = () => {
  const chartInfo = () => {
    const data = [
      { item: '新入', count: 32, percent: 0.032 },
      { item: '闲置', count: 3, percent: 0.2 },
      { item: '公用', count: 18, percent: 0.01 },
      { item: '自用', count: 99.4, percent: 0.994 },
      { item: '待报废', count: 7, percent: 0.03 },
    ];

    const chart = new Chart({
      container: 'containerPie',
      autoFit: true,
      height: 400,
      title: '资产持有状况',
    });

    chart.coordinate({ type: 'theta', outerRadius: 0.8 });

    chart
      .interval()
      .data(data)
      .transform({ type: 'stackY' })
      .encode('y', 'percent')
      .encode('color', 'item')
      .legend('color', { position: 'bottom', layout: { justifyContent: 'center' } })
      .label({
        position: 'outside',
        text: (data: any) => `${data.item}: ${data.percent * 100}%`,
      })
      .tooltip((data) => ({
        name: data.item,
        value: `${data.percent * 100}%`,
      }));

    chart.render();
  };

  useEffect(() => {
    chartInfo();
  }, []);
  return <div id="containerPie"></div>;
};
export default Pie;
