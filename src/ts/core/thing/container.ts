import { schema } from '@/ts/base';
import { IStandardFileInfo, StandardFileInfo } from './fileinfo';
import { ITarget } from '..';

export interface IContainer<T extends schema.XContainer = schema.XContainer>
  extends IStandardFileInfo<T> {
  /** 操作对象 */
  target: ITarget;
  /** 更新排序 */
  updateSorts: (sorts: schema.Sort[]) => Promise<T | undefined>;
}

export abstract class Container<T extends schema.XContainer>
  extends StandardFileInfo<T>
  implements IContainer<T>
{
  async updateSorts(sorts: schema.Sort[]) {
    const result = await this.coll.update(this.metadata.id, { _set_: { sorts } });
    if (result && Object.keys(result).length > 0) {
      this._metadata = result;
      this.coll.notity({ operate: 'replace', data: result }, true);
    }
    return result;
  }
}
