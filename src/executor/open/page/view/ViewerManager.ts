import HostManagerBase from '@/components/PageElement/render/HostManager';
import { IDisposable } from '@/ts/base/common';
import { IElementHost, XElementHost } from '@/ts/element/standard';

export default class ViewerManager<E extends XElementHost = XElementHost>
  extends HostManagerBase<'view', E>
  implements IDisposable
{
  constructor(pageFile: IElementHost<E>) {
    super('view', pageFile);
  }

  dispose() {
    console.info('ViewerManager disposed');
  }
}
