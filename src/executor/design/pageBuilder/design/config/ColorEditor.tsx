import React from 'react';
import { IExistTypeEditor } from './IExistTypeEditor';
import { ColorBox } from 'devextreme-react';

export const ColorEditor: IExistTypeEditor<string> = function ColorEditor(props) {
  return <ColorBox value={props.value} onValueChange={props.onChange} />;
};
