import React, { useState } from 'react';
import {TextBox} from 'devextreme-react';
import { ITextBoxOptions } from 'devextreme-react/text-box';
import { IDomEditor } from '@wangeditor/editor';
import _ from "lodash";
import {Button, message} from "antd";
import { EditModal } from '@/executor/tools/editModal';

const MapEditItem: React.FC<ITextBoxOptions> = (props) => {
  const [isValid, setIsValid] = useState(props.isValid);
  const [editor, setEditor] = useState<IDomEditor | null>(null); // 存储 editor 实例
  const onChanged = React.useCallback((e: IDomEditor) => {
    const html = e.getHtml();
    setIsValid(e.getText().length > 0);
    if (html) {
      props.onValueChanged?.apply(this, [{ value: html } as any]);
    }
  }, []);

  // 点击选择数据
  const onClick = () => {
    EditModal.mapSelectModal({
      onSave: (lnglat) => {
        if (lnglat[0]) setEditor(lnglat[0].text +','+ lnglat[1].text)
      },
      latlng: editor ? editor.split(',').map((item:any)=>({text:item})):[],
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'end',
      }}>
      <TextBox
        {...(_.omit(props, ['width']) as any)}
        style={{ width: '100%' }}
        value={editor}
        placeholder="请勿手动输入，点击右侧选择数据操作"
        onValueChange={(e) => {
          if (!e) setEditor(null);
        }}
      />
      <Button
        style={{ marginLeft: 10 }}
        type="default"
        onClick={onClick}>
        选择数据
      </Button>
    </div>
  );
};

export default MapEditItem;
