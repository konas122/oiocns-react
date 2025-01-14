import { IDirectory, XCollection } from '@/ts/core';
import { XReportTaskTree, XReportTree } from '@/ts/base/schema';
import { TaskSnapshotInfo } from '@/ts/base/model';
import {
  IReportTaskTree,
  ReportTaskTree,
} from '@/ts/core/work/assign/taskTree/ReportTaskTree';

export interface ITreeHolder {
  /** 树主键 */
  id: string;
  /** 空间 */
  directory: IDirectory;
  /** 树对象 */
  tree: IReportTaskTree | undefined;
  /** 从空间搜索加载树形 */
  loadTree(reload?: boolean): Promise<IReportTaskTree | undefined>;
}

export class TreeHolder implements ITreeHolder {
  constructor(id: string, info: TaskSnapshotInfo, directory: IDirectory) {
    this.id = id;
    this.info = info;
    this.directory = directory;
    this.reportTreeColl = this.directory.resource.reportTreeColl;
    this.reportTaskTreeColl = this.directory.resource.genTargetColl(
      ReportTaskTree.getCollName('报表树'),
    );
  }
  id: string;
  directory: IDirectory;
  tree: IReportTaskTree | undefined;
  info: TaskSnapshotInfo;
  reportTreeColl: XCollection<XReportTree>;
  reportTaskTreeColl: XCollection<XReportTaskTree>;

  private _treeLoaded: boolean = false;

  async loadTree(reload?: boolean | undefined): Promise<IReportTaskTree | undefined> {
    if (reload || !this._treeLoaded) {
      this._treeLoaded = true;

      let taskTree = await this.reportTaskTreeColl.loadSpace({
        options: {
          match: {
            taskId: this.info.taskId,
            period: this.info.period,
          },
        },
      });
      if (taskTree.length > 0) {
        if (taskTree.length > 1) {
          console.warn('存在多个任务树，取第一个');
        }
        this.tree = new ReportTaskTree(taskTree[0], this.directory);
        return this.tree;
      }
      return;
    }
    return this.tree;
  }
}
