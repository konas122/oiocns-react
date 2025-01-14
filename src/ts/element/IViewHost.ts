import { ElementMeta } from './ElementMeta';
import { IComponentFactory } from './IComponentFactory';
import ElementTreeManager from './ElementTreeManager';
import ElementFactory from './ElementFactory';
import { IElementHost, XElementHost } from './standard';

export type HostMode = 'design' | 'view';
export interface PageBuilderStaticContext<TComponent> {
  components: Dictionary<TComponent>;
  metas: Dictionary<ElementMeta>;
}

export interface IViewHost<
  T extends HostMode,
  E extends XElementHost = XElementHost,
  F extends IComponentFactory<any, any> = IComponentFactory<any, any>,
> {
  readonly mode: T;
  treeManager: ElementTreeManager;
  components: F;
  elements: ElementFactory;

  readonly pageInfo: IElementHost<E>;

  readonly page: E;

  error(message: string): void;
  warning(message: string): void;
}
