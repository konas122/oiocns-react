import React, { useState } from 'react';
import { Card, CardProps } from 'antd';
import styles from './index.module.less';
import SpeciesModal from '@/executor/design/speciesModal';

const PageCard: React.FC<CardProps> = (props: CardProps) => {
  
  
  const { children, className = '', tabList = [], ...otherProps } = props;
    

  const [activeTabKey, setActiveTabKey] = useState<string>('Items');

  const onTabChange = (key: string) => {
    
    setActiveTabKey(key);
  };


  const contentListNoTitle: Record<string, React.ReactNode> = {
    Items: children,
    // Item1: <SpeciesModal />,
    Item1: <>159</>,
  };
  
  return (
    <Card
      className={className + styles[`card-wrap`]}
      tabList={tabList}
      bordered={false}
      onTabChange={onTabChange}
      headStyle={{ borderBottom: 0, fontSize: 12 }}
      {...otherProps}>
      {contentListNoTitle[activeTabKey]}
    </Card>
  );
};

export default PageCard;
