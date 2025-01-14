import React, { useEffect } from 'react';
import { Chart } from '@antv/g2';

const Bar: React.FC = () => {
  const chartInfo = () => {
    const chart = new Chart({
      container: 'containerBar',
      autoFit: true, // 自动适应容器大小
      height: 400,
      title: '资产大类数量',
    });

    chart
      .interval()
      .data([
        { genre: '物资', sold: 41000 },
        { genre: '房屋及构筑物', sold: 0 },
        { genre: '车辆', sold: 0 },
        { genre: '设备类', sold: 39300 },
        { genre: '文物和陈列品', sold: 0 },
        { genre: '图书、档案', sold: 0 },
        { genre: '无形资广家具、用具、装具及动植物', sold: 2358 },
      ])
      .encode('x', 'genre')
      .encode('y', 'sold')
      .encode('color', 'genre');

    chart.render();
  };

  useEffect(() => {
    chartInfo();
  }, []);
  return <div id="containerBar"></div>;
};
export default Bar;
