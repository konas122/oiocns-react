import { PageElement } from '@/ts/element/PageElement';
import HostManagerBase from '@/components/PageElement/render/HostManager';
import { IDisposable } from '@/ts/base/common';
import { ElementInit } from '@/ts/element/ElementTreeManager';
import { IElementHost, XElementHost } from '@/ts/element/standard';

export default class DesignerManager<E extends XElementHost = XElementHost>
  extends HostManagerBase<'design', E>
  implements IDisposable
{
  constructor(pageFile: IElementHost<E>) {
    super('design', pageFile);
    this.currentElement = this.rootElement;
    if (this.page.typeName == '文档模板') {
      this.accepts = ['Container', 'Document'];
    } else {
      this.accepts = ['Container', 'Element', 'Template'];
    }
  }

  dispose() {
    this.currentElement = null;
  }

  async update() {
    return await this.pageInfo.update(this.pageInfo.metadata);
  }

  /** 获取或设置根元素的子元素 */
  get rootChildren(): readonly PageElement[] {
    return this.treeManager.root.children;
  }
  set rootChildren(v: PageElement[]) {
    try {
      this.treeManager.root.children = v;
      this.treeManager.changeParent(v, this.treeManager.root.id);
      this.currentElement = null;
    } catch (error) {
      super.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private _showProps = true;
  get showProps() {
    return this._showProps;
  }
  set showProps(e) {
    this._showProps = e;
    this.emitter('current', 'showProps', e);
  }

  private _currentElement: PageElement | null = null;
  get currentElement() {
    return this._currentElement;
  }
  set currentElement(e) {
    this._currentElement = e;
    this.emitter('current', 'change');
  }

  readonly accepts: string[];

  addElement<E extends PageElement>(
    kind: E['kind'],
    name: string,
    slotName = 'default',
    parentId?: string,
    params: ElementInit<E> = {},
  ): E {
    try {
      const e = this.treeManager.createElement(kind, name, slotName, parentId, params);
      this.currentElement = e;
      this.emitter('elements', 'change');
      return e as any;
    } catch (error) {
      super.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  removeElement(e: PageElement, recursive?: boolean) {
    try {
      this.treeManager.removeElement(e, recursive);
      this.emitter('elements', 'change');
      this.currentElement = null;
    } catch (error) {
      super.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  changeElement(e: PageElement, targetId: string, slotName: string = 'default') {
    try {
      this.treeManager.changeParent([e], targetId, slotName);
      this.emitter('elements', 'change');
    } catch (error) {
      super.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  moveElement(e: PageElement, targetId: string, position: number) {
    try {
      this.treeManager.moveElement(e, targetId, position);
      this.emitter('elements', 'change');
    } catch (error) {
      super.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
