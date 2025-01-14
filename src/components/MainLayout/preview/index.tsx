import React, { useEffect, useState } from 'react';
import DataPreview from '@/components/DataPreview';
import { command } from '@/ts/base';

/** 实体预览 */
const EntityPreview: React.FC<{ flag?: string }> = (props) => {
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
    return () => {
      command.unsubscribe(id);
    };
  }, []);

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <DataPreview
        entity={entity}
        flag={props.flag}
        finished={() => setEntity(undefined)}
      />
    </div>
  );
};

export default EntityPreview;
