import { GLOBAL_FORM_ID } from '../consts';
import { NodeRef } from '../ref/refs';

export abstract class GraphNodeBase<T extends string> {
  readonly type: T;
  /** 节点的名称（唯一标识） */
  abstract readonly name: string;
  /** 节点的描述 */
  abstract readonly label?: string;
  /** 节点的值 */
  abstract readonly value: any;
  /** 节点解析出的引用 */
  abstract readonly refs: NodeRef[];

  isVisited = false;
  formId = GLOBAL_FORM_ID;

  constructor(type: T) {
    this.type = type;
  }

  toString() {
    return `[${this.type}]${this.name}`;
  }
}
