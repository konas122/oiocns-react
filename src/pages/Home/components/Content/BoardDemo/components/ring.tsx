import React, { useEffect } from 'react';
import { Chart } from '@antv/g2';

const Ring: React.FC = () => {
  const chartInfo = () => {
    const data = [
      { item: '物资', count: 50, percent: 0.5 },
      { item: '房屋及构筑物', count: 16, percent: 0.16 },
      { item: '车辆', count: 3, percent: 0.03 },
      { item: '设备类', count: 30, percent: 0.3 },
      { item: '家具、用具、装具及动植物', count: 1, percent: 0.01 },
    ];

    const chart = new Chart({
      container: 'containerRing',
      autoFit: true, // 自动适应容器大小
      height: 400,
      title: '资产大类价值分布',
    });

    chart.coordinate({ type: 'theta', outerRadius: 0.8, innerRadius: 0.5 });

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

    chart
      .text()
      .style('text', '总资产')
      .style('x', '50%')
      .style('y', '56%')
      .style('dy', -25)
      .style('fontSize', 16)
      .style('fill', '#999')
      .style('textAlign', 'center');

    chart
      .text()
      .style('text', '128239.1')
      .style('x', '54%')
      .style('y', '48%')
      .style('dx', -25)
      .style('dy', 25)
      .style('fontSize', 12)
      .style('fill', '#8c8c8c')
      .style('textAlign', 'center');

    chart
      .text()
      .style('text', '万')
      .style('x', '48%')
      .style('y', '48%')
      .style('dx', 35)
      .style('dy', 25)
      .style('fontSize', 12)
      .style('fill', '#8c8c8c')
      .style('textAlign', 'center');

    chart.render();
  };

  useEffect(() => {
    chartInfo();
  }, []);
  return <div id="containerRing"></div>;
};
export default Ring;
