import { registerRenderer, textRenderer, numericRenderer } from "handsontable/renderers";
import { CellProperties } from "handsontable/settings";
import lessToJS from 'less-vars-to-js';

import './index.less';
import style from './index.less?raw';

const vars: Dictionary<string> = lessToJS(style);

/** 渲染特性背景色 **/
registerRenderer('customStylesRenderer', (hotInstance, TD, ...rest) => {
  const cell: CellProperties = rest.at(-1);
  if (cell.type == 'numeric') {
    numericRenderer(hotInstance, TD, ...rest);
  } else {
    textRenderer(hotInstance, TD, ...rest);
  }

  if (cell.readOnly) {
    TD.classList.add('is-readonly');
  }
  if (cell.renderType == 'computed') {
    TD.classList.add('is-computed');
    TD.style.background = vars['@computed-cell-background'];
    if (cell.readOnly) {
      TD.style.background = vars['@computed-cell-background--readonly'];
    }
  } else {
    TD.classList.add('is-input');
    TD.style.background = vars['@input-cell-background'];
    if (cell.readOnly) {
      TD.style.background = vars['@input-cell-background--readonly'];
    }
  }
});
