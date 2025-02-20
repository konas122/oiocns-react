import React, { ReactNode } from 'react';
import cls from './index.module.less';
import { getResouces } from '@/config/location';

import { Carousel } from 'antd';

const authLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const resources = getResouces();
  return (
    <div className={cls.auth_body}>
      <div
        className={cls.slider}
        style={{
          backgroundImage: `url(/img/${resources.location}/passport/background.png)`,
        }}>
        <Carousel
          autoplay
          draggable
          autoplaySpeed={4000}
          style={{ height: '100vh', display:'flex', alignItems:'center', cursor: 'pointer' }}
          dots={{ className: 'carousel' }}>
          {resources.passport.map((index) => {
            return (
              <div key={index}>
                <img
                  key={index}
                  className={cls.sliderImg}
                  src={`/img/${resources.location}/passport/page${index}.png`}
                  alt=""
                />
              </div>
            );
          })}
        </Carousel>
      </div>
      <div className={cls.content}>
        <div className={cls.auth}>{children}</div>
        <div className={cls.copyright}>
          {resources.unitName !== '' && (
            <div className={cls.copyrightZh}>
              主办单位：
              <a
                href={resources.unitPage}
                target="_blank"
                style={{ color: '#8a8a8a' }}
                rel="noopener noreferrer">
                {resources.unitName}
              </a>
            </div>
          )}
          <div className={cls.copyrightZh}>
            技术支持：
            <a
              href="https://assetcloud.orginone.cn/#/"
              target="_blank"
              style={{ color: '#8a8a8a' }}
              rel="noopener noreferrer">
              资产云开放协同创新中心
            </a>
          </div>
          <div className={cls.copyrightEn}>
            <a
              href="https://orginone.cn"
              target="_blank"
              style={{ color: '#8a8a8a' }}
              rel="noopener noreferrer">
              Powered by Orginone
            </a>
          </div>
          <div className={cls.copyrightEn}>
            <a
              href="https://beian.miit.gov.cn"
              target="_blank"
              style={{ color: '#8a8a8a' }}
              rel="noopener noreferrer">
              备案号:浙ICP备2024055135号
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
export default authLayout;
