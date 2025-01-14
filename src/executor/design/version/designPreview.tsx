import React, { useEffect, useState } from 'react';
import { command } from '@/ts/base';
import FlowDesign from '@/components/Common/FlowDesign';

/** 实体预览 */
const DesignPreview: React.FC<{ flag?: string; finished: () => void }> = (props) => {
  if (!(props.flag && props.flag.length > 0)) return <></>;
  const [entity, setEntity] = useState<any>();
  useEffect(() => {
    const id = command.subscribe((type, flag, ...args: any[]) => {
      if (type != 'preview' || flag != props.flag) return;
      if (args && args.length > 0) {
        setEntity(args[0]);
      } else {
        setEntity(undefined);
      }
    });
    return () => command.unsubscribe(id);
  }, []);
  if (!entity) return <></>;
  const Content = () => {
    switch (entity.typeName) {
      case '办事':
        return (
          <FlowDesign current={entity} isEdit={entity.isUsed} finished={props.finished} />
        );
      default:
        return <></>;
    }
  };

  return Content();
};

export default DesignPreview;
