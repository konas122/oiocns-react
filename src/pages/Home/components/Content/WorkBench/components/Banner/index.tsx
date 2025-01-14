import React from 'react';
import BannerImg from '../../../../Common/BannerImg';
import cls from '../../index.module.less';
import { LoadBanner } from '../../../../Common/bannerDefaultConfig';
import { IBelong } from '@/ts/core';

interface IProps {
  space: IBelong;
}
const Banner: React.FC<IProps> = (props) => {
  const defaultImgs = LoadBanner('workBench');

  return (
    <>
      <div className={cls['bannerImg-space']}>
        <BannerImg bannerkey="workbench" target={props.space} bannerImg={defaultImgs} />
      </div>
    </>
  );
};
export default Banner;
