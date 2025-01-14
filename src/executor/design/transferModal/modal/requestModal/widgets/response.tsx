import { MonacoEditor } from '@/components/Common/MonacoEditor';
import { ITransfer } from '@/ts/core';
import React, { useEffect, useState } from 'react';

interface IProps {
  transfer: ITransfer;
}

export const toJsonString = (value: any): string => {
  const typeName = typeof value;
  try {
    if (typeName === 'string') {
      return JSON.stringify(JSON.parse(value), null, 2);
    } else if (typeName === 'object') {
      return JSON.stringify(value, null, 2);
    } else if (typeName === 'undefined') {
      return '';
    } else {
      return `${value}`;
    }
  } catch (error) {
    return `${value}`;
  }
};

const Response: React.FC<IProps> = ({ transfer }) => {
  const [value, setValue] = useState<string>();
  useEffect(() => {
    const id = transfer.command.subscribe((type, cmd, args) => {
      if (type == 'request' && cmd == 'onValueChange') {
        setValue(toJsonString(args));
      }
    });
    return () => {
      transfer.command.unsubscribe(id);
    };
  });
  return <MonacoEditor value={value} language="json" onChange={setValue} />;
};

export default Response;
