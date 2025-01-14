import { XEntity, XStandard } from '@/ts/base/schema';
import { PageElement } from '../PageElement';
import { IStandardFileInfo } from '@/ts/core/thing/fileinfo';
import { Command } from '@/ts/base';

export interface ElementHost {
  rootElement: PageElement;
}

export interface XElementHost extends XStandard, ElementHost {}

export interface IElementHost<T extends XElementHost = XElementHost>
  extends IStandardFileInfo<T> {
  /** 触发器 */
  command: Command;
}

export interface SEntity {
  id: string;
  name: string;
  typeName?: string;
  [key: string]: any;
}
