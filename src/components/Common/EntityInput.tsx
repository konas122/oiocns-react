import React, { useEffect, useState } from 'react';

import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import OpenFileDialog from '@/components/OpenFileDialog';
import { IFile } from '@/ts/core';
import { IDirectory } from '@/ts/core/thing/directory';
import { Button } from 'antd';
import {Work} from "@/ts/core/work";

interface EntityInputProps {
  value?: string;
  onChange: (e: string | undefined) => void;
  onValueChange?: (file: IFile) => void;
  typeName: string;
  directory: IDirectory;
  readonly?: boolean;
  validate?: (file: IFile[]) => Promise<boolean>;
  rootKey?: string;
}

export function EntityInput(props: EntityInputProps) {
  const [value, setValue] = useState<string | undefined>('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setValue(props.value);
  }, [props.value, props.directory]);

  function updateValue(v: string) {
    setValue(v);
    props.onChange(v);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <EntityIcon
        entityId={value}
        typeName={props.typeName}
        showName
        belong={props.directory.target.space}
      />

      <Button
        size="small"
        onClick={() => setVisible(true)}
        style={{ display: props.readonly ? 'none' : undefined }}>
        选择
      </Button>

      {visible ? (
        <OpenFileDialog
          accepts={[props.typeName]}
          rootKey={props.rootKey || props.directory.key}
          allowInherited
          onOk={async (files) => {
            let validateFlag = props.validate ? await props.validate(files) : true;
            if (validateFlag) {
              if (files[0]?.metadata.typeName == '办事') {
                let iFile = files[0] as Work;
                updateValue(iFile.metadata.primaryId);
              } else {
                updateValue(files[0]?.id);
              }
              props.onValueChange?.(files[0]);
            }
            setVisible(false);
          }}
          onCancel={() => setVisible(false)}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
