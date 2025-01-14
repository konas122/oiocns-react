import React from 'react';
import cls from './index.module.less';

type EndNodeProps = {
  onInsertNode: Function;
  onDelNode: Function;
  onSelected: Function;
  isGroupWork: boolean;
  config: any;
  isEdit: boolean;
};

/**
 * 流程节点
 * @returns
 */
const EndNode: React.FC<EndNodeProps> = (props: EndNodeProps) => {
  return (
    <div className={`${cls['node']}}`}>
      <div className={cls['all-process-end']} onClick={() => props.onSelected()}>
        <div className={cls['process-content']}>
          <div className={cls['process-left']}>{props.config.name}</div>
          <div className={cls['process-right']}>
            <div className={cls['process-right_send']}>数据归档</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndNode;
