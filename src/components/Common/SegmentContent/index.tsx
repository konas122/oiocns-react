import React, { useEffect, useRef } from 'react';
import style from './index.module.less';
import { Segmented, Space, Divider, Typography, Affix } from 'antd';
import useStorage from '@/hooks/useStorage';
import OrgIcons from '../GlobalComps/orgIcons';

type segmentedTypes = 'icon' | 'table' | 'list';

interface IProps {
  height?: number | string;
  descriptions: string;
  children?: React.ReactNode; // 子组件
  onSegmentChanged: (type: segmentedTypes) => void;
  currentTag?: string;
  onScrollEnd?: () => void;
}
/**
 * 存储-文件系统
 */
const SegmentContent: React.FC<IProps> = ({
  height,
  children,
  descriptions,
  onSegmentChanged,
  currentTag,
  onScrollEnd,
}: IProps) => {
  const [segmented, setSegmented] = useStorage('segmented', 'list');
  const parentRef = useRef<any>();
  useEffect(() => {
    parentRef.current.scrollTop = 0;
  }, [currentTag]);
  return (
    <div style={{ height: height }} className={style.pageCard}>
      <div
        className={style.mainContent}
        ref={parentRef}
        onScroll={(e) => {
          if (
            e.currentTarget.scrollHeight - e.currentTarget.clientHeight <=
            e.currentTarget.scrollTop + 10
          ) {
            onScrollEnd?.apply(this, []);
          }
        }}>
        {children && children}
      </div>
      <Affix style={{ position: 'absolute', right: 10, bottom: 0 }}>
        <Segmented
          value={segmented}
          onChange={(value) => {
            setSegmented(value as segmentedTypes);
            onSegmentChanged(value as segmentedTypes);
          }}
          options={[
            {
              value: 'list',
              icon: <OrgIcons type={'icons/list'} size={22} />,
            },
            {
              value: 'icon',
              icon: <OrgIcons type={'icons/icon'} size={22} />,
            },
            // {
            //   value: 'table',
            //   icon: (
            //     <fa.FaTable
            //       fontSize={20}
            //       color={segmented === 'table' ? 'blue' : Theme.FocusColor}
            //     />
            //   ),
            // },
          ]}
        />
      </Affix>
      <Affix style={{ position: 'absolute', left: 10, bottom: 0 }}>
        <Space split={<Divider type="vertical" />}>
          <Typography.Link>{descriptions}</Typography.Link>
        </Space>
      </Affix>
    </div>
  );
};
export default SegmentContent;
