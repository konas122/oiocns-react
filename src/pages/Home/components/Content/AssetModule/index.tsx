import React, { useEffect, useState } from 'react';
import { Empty } from 'antd';
import { IApplication, IFile } from '@/ts/core';
import RenderCard from './renderCard';
import BannerImg from '../../Common/BannerImg';
import { LoadBanner } from '../../Common/bannerDefaultConfig';

const AssetModule: React.FC<{
  reLoad?: boolean;
  selectXApp?: IApplication;
}> = ({ reLoad, selectXApp }) => {
  const [bannerImg, setBannerImg] = useState<any[]>([]);
  const defaultImgs = LoadBanner('assetModule');
  useEffect(() => {
    setBannerImg(defaultImgs ?? []);
  }, []);
  useEffect(() => {
    setBannerImg(defaultImgs ?? []);
  }, [reLoad]);
  useEffect(() => {
    if (selectXApp) {
      if (selectXApp.metadata.banners) {
        setBannerImg([JSON.parse(selectXApp.metadata.banners)]);
      } else {
        setBannerImg(defaultImgs ?? []);
        // setBannerImg([
        //   {
        //     key: '1',
        //     name: '首页图片',
        //     url: ' /img/home/head.png',
        //   },
        // ]);
      }
    }
  }, [selectXApp]);
  /** 渲染模块 */
  const renderModule = () => {
    if (selectXApp) {
      return (
        <React.Fragment>
          {selectXApp.sortedChildren.map((item) => (
            <RenderCard key={item.id} app={item} />
          ))}
        </React.Fragment>
      );
    }
    return (
      <div className="cardGroup">
        <div className="cardItem">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="应用暂无模块" />
        </div>
      </div>
    );
  };

  /** 渲染应用 */
  const renderApp = () => {
    return (
      <React.Fragment>
        <div style={{ width: '100%' }}>
          {selectXApp && (
            <BannerImg
              bannerkey="app"
              target={selectXApp.target.space}
              bannerImg={bannerImg}></BannerImg>
          )}
        </div>
        {renderModule()}
      </React.Fragment>
    );
  };
  return <div className="workbench-content">{renderApp()}</div>;
};
export default AssetModule;
