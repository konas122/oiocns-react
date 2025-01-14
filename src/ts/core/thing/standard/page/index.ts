import { Command, schema } from '@/ts/base';
import { IWork } from '../../../work';
import { IDirectory } from '../../directory';
import { StandardFileInfo } from '../../fileinfo';
import { IElementHost } from '@/ts/element/standard';

export interface IPageTemplate<T = any> extends IElementHost<schema.XPageTemplate<T>> {
  /** 自定义参数 */
  params: T;
  /** 模板类型 */
  template?: string;
  /** 查找办事 */
  loadWork(workId: string): Promise<IWork | undefined>;
}

export abstract class BaseTemplate<T = any>
  extends StandardFileInfo<schema.XPageTemplate<T>>
  implements IPageTemplate<T>
{
  constructor(_metadata: schema.XPageTemplate<T>, _directory: IDirectory) {
    super(_metadata, _directory, _directory.resource.templateColl);
    this.command = new Command();
  }
  canDesign: boolean = true;
  command: Command;
  get cacheFlag() {
    return 'pages';
  }
  get params() {
    return this.metadata.params;
  }
  get template() {
    return this.metadata.template;
  }
  async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      return await super.copyTo(destination.id, destination.resource.templateColl);
    }
    return false;
  }
  async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      return await super.moveTo(destination, destination.resource.templateColl);
    }
    return false;
  }
  async loadWork(workId: string): Promise<IWork | undefined> {
    for (const app of await this.directory.target.directory.loadAllApplication()) {
      const work = await app.findWork(workId);
      if (work) {
        return work;
      }
    }
  }
}

export class PageTemplate extends BaseTemplate<any> {}
