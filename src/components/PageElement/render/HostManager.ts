import ElementFactory from '@/ts/element/ElementFactory';
import ElementTreeManager from '@/ts/element/ElementTreeManager';
import ReactComponentFactory from './ReactComponentFactory';
import { HostMode, IViewHost } from '@/ts/element/IViewHost';
import staticContext from '..';
import { PageElement } from '@/ts/element/PageElement';
import { useEffect } from 'react';
import { IElementHost, XElementHost } from '@/ts/element/standard';
import { message } from 'antd';

export default class HostManagerBase<
  T extends HostMode,
  E extends XElementHost = XElementHost,
> implements IViewHost<T, E, ReactComponentFactory>, EventTarget
{
  readonly mode: T;
  treeManager: ElementTreeManager;
  components: ReactComponentFactory;
  elements: ElementFactory;

  readonly pageInfo: IElementHost<E>;

  constructor(mode: T, pageFile: IElementHost<E>) {
    this.mode = mode;
    this.pageInfo = pageFile;

    const componentFactory = new ReactComponentFactory();
    componentFactory.registerComponents(staticContext.components);
    this.components = componentFactory;

    this.elements = new ElementFactory(staticContext.metas);

    this.treeManager = new ElementTreeManager(
      this.elements,
      pageFile.metadata.rootElement,
    );
  }

  get page(): E {
    return this.pageInfo.metadata;
  }

  /** 获取根元素 */
  get rootElement(): Readonly<PageElement> {
    return this.treeManager.root;
  }

  /** 订阅变动 */
  subscribe(onChange: (type: string, cmd: string, args: any) => void) {
    useEffect(() => {
      const subId = this.pageInfo.command.subscribe((type, cmd, args) => {
        onChange(type, cmd, args);
      });
      return () => {
        this.pageInfo.command.unsubscribe(subId);
      };
    });
  }

  /** 触发变动 */
  emitter(type: string, cmd: string, args?: any) {
    this.pageInfo.command.emitter(type, cmd, args);
  }

  //#region EventTarget

  protected _event = new EventTarget();
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
  ): void {
    this._event.addEventListener(type, callback);
  }
  dispatchEvent(event: Event): boolean {
    return this._event.dispatchEvent(event);
  }
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
  ): void {
    this._event.removeEventListener(type, callback);
  }

  //#endregion

  error(msg: string): void {
    message.error(msg);
  }
  warning(msg: string): void {
    message.warning(msg);
  }
}
