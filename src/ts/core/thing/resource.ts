import { XCollection } from '../public/collection';
import {
  XApplication,
  XDirectory,
  XForm,
  XPrint,
  XProperty,
  XSpecies,
  XSpeciesItem,
  XTarget,
  Xbase,
  XPageTemplate,
  XThing,
  XFileLink,
  XSequence,
  XReportTree,
  XReportTreeNode,
  XDistributionTask,
  XHistoryFile,
  XHistoryFlow,
  XEntity,
  XRevision,
  XWorkDefine,
  XSubscription,
  XReception,
  XDistribution,
  XProduct,
  XDocumentTemplate,
  XView,
  XReport,
} from '../../base/schema';
import { BucketOpreates, ChatMessageType, Transfer } from '@/ts/base/model';
import { kernel, model } from '@/ts/base';
import { blobToDataUrl, encodeKey, generateUuid, sliceFile } from '@/ts/base/common';
import { PageAll } from '../public';

/** 数据核资源（前端开发） */
export class DataResource {
  private _keys: string[];
  private target: XTarget;
  private relations: string[];
  private _proLoaded: boolean = false;
  constructor(target: XTarget, relations: string[], keys: string[]) {
    this._keys = keys;
    this.target = target;
    this.relations = relations;
    this.formColl = this.genTargetColl<XForm>('standard-form');
    this.reportColl = this.genTargetColl<XReport>('standard-report');
    this.viewColl = this.genTargetColl<XView>('standard-view');
    this.printColl = this.genTargetColl<XPrint>('standard-print');
    this.transferColl = this.genTargetColl<Transfer>('standard-transfer');
    this.speciesColl = this.genTargetColl<XSpecies>('standard-species');
    this.messageColl = this.genTargetColl<ChatMessageType>('chat-messages');
    this.propertyColl = this.genTargetColl<XProperty>('standard-property');
    this.directoryColl = this.genTargetColl<XDirectory>('resource-directory');
    this.fileDirectoryColl = this.genTargetColl<XDirectory>('resource-directory-temp');
    this.applicationColl = this.genTargetColl<XApplication>('standard-application');
    this.speciesItemColl = this.genTargetColl<XSpeciesItem>('standard-species-item');
    this.templateColl = this.genTargetColl<XPageTemplate>('standard-page-template');
    this.documentColl = this.genTargetColl<XDocumentTemplate>('standard-document');
    this.reportTreeColl = this.genTargetColl<XReportTree>('standard-report-tree');
    this.reportTreeNodeColl = this.genTargetColl<XReportTreeNode>(
      'standard-report-tree-node',
    );
    this.distributionTaskColl = this.genTargetColl<XDistributionTask>(
      'resource-distribution-task',
    );
    this.thingColl = this.genTargetColl<XThing>('_system-things');
    this.fileLinkColl = this.genTargetColl<XFileLink>('resource-file-link');
    this.sequenceColl = this.genTargetColl<XSequence>('standard-sequences');
    this.revisionColl = this.genTargetColl<XRevision<any>>('standard-revision');
    this.historyFileColl = this.genTargetColl<XHistoryFile>('work-history-file');
    this.historyFlowColl = this.genTargetColl<XHistoryFlow>('work-history-flow');
    this.workDefineColl = this.genTargetColl<XWorkDefine>('work-flow-define');
    this.subscriptionColl = this.genTargetColl<XSubscription>('standard-subscribe');
    this.distributionColl = this.genTargetColl<XDistribution>('work-distribution');
    this.receptionColl = this.genTargetColl<XReception>('work-reception');
    this.taskReceptionColl = this.genTargetColl<XReception>('task-work-reception');
    this.publicTaskReceptionColl = this.genTargetColl<XReception>('-work-reception');
    this.shoppingCarColl = this.genTargetColl<XProduct>('transaction-shopping-car');
  }
  /** 表单集合 */
  formColl: XCollection<XForm>;
  /** 表格集合 */
  reportColl: XCollection<XReport>;
  /** 视图集合 */
  viewColl: XCollection<XView>;
  /** 打印模板集合 */
  printColl: XCollection<XPrint>;
  /** 属性集合 */
  propertyColl: XCollection<XProperty>;
  /** 分类集合 */
  speciesColl: XCollection<XSpecies>;
  /** 类目集合 */
  speciesItemColl: XCollection<XSpeciesItem>;
  /** 应用集合 */
  applicationColl: XCollection<XApplication>;
  /** 资源目录集合 */
  directoryColl: XCollection<XDirectory>;
  /** 迁移附件目录集合 */
  fileDirectoryColl: XCollection<XDirectory>;
  /** 群消息集合 */
  messageColl: XCollection<ChatMessageType>;
  /** 数据传输配置集合 */
  transferColl: XCollection<Transfer>;
  /** 页面模板集合 */
  templateColl: XCollection<XPageTemplate>;
  /** 文档模板集合 */
  documentColl: XCollection<XDocumentTemplate>;
  /** 报表树集合 */
  reportTreeColl: XCollection<XReportTree>;
  /** 报表树节点集合 */
  reportTreeNodeColl: XCollection<XReportTreeNode>;
  /** 分发任务集合 */
  distributionTaskColl: XCollection<XDistributionTask>;
  /** 实体集合 */
  thingColl: XCollection<XThing>;
  /** 文件引用数据集合 */
  fileLinkColl: XCollection<XFileLink>;
  /** 序列规则集合 */
  sequenceColl: XCollection<XSequence>;
  /** 历史文件集合 */
  historyFileColl: XCollection<XHistoryFile>;
  /** 历史流程集合 */
  historyFlowColl: XCollection<XHistoryFlow>;
  /** 历史变化集合 */
  revisionColl: XCollection<XRevision<any>>;
  /** 办事目录集合 */
  workDefineColl: XCollection<XWorkDefine>;
  /** 订阅集合 */
  subscriptionColl: XCollection<XSubscription>;
  /** 分发集合 */
  distributionColl: XCollection<XDistribution>;
  /** 接收任务集合 */
  receptionColl: XCollection<XReception>;
  /** 新-接收任务集合 */
  taskReceptionColl: XCollection<XReception>;
  /** 新-接收任务公共集合 */
  publicTaskReceptionColl: XCollection<XReception>;
  /** 购物车集合 */
  shoppingCarColl: XCollection<XProduct>;
  /** 资源对应的用户信息 */
  get targetMetadata() {
    return this.target;
  }
  /** 资源预加载 */
  async preLoad(reload: boolean = false): Promise<void> {
    if (this._proLoaded === false || reload) {
      this._proLoaded = true;
      await Promise.all([
        this.directoryColl.all(reload),
        this.applicationColl.all(reload),
      ]);
    }
  }
  /** 生成集合 */
  genColl<T extends Xbase>(collName: string, relations?: string[]): XCollection<T> {
    return new XCollection<T>(
      this.target,
      collName,
      relations || this.relations,
      this._keys,
    );
  }
  /** 生成用户类型的集合 */
  genTargetColl<T extends Xbase>(collName: string): XCollection<T> {
    return new XCollection<T>(this.target, collName, this.relations, this._keys);
  }
  /** 文件桶操作 */
  async bucketOpreate<R>(data: model.BucketOperateModel): Promise<model.ResultType<R>> {
    return await kernel.bucketOperate<R>(
      this.target.id,
      this.target.belongId,
      this.relations,
      data,
    );
  }
  /** 删除文件目录 */
  async deleteDirectory(directoryId: string): Promise<void> {
    await this.bucketOpreate({
      key: encodeKey(directoryId),
      operate: BucketOpreates.Delete,
    });
  }
  /** 上传文件 */
  public async fileUpdate(
    file: Blob,
    key: string,
    progress: (p: number) => void,
  ): Promise<model.FileItemModel | undefined> {
    const id = generateUuid();
    const data: model.BucketOperateModel = {
      key: encodeKey(key),
      operate: model.BucketOpreates.Upload,
    };
    progress.apply(this, [0]);
    const slices = sliceFile(file, 1024 * 1024);
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i];
      data.fileItem = {
        index: i,
        uploadId: id,
        size: file.size,
        data: [],
        dataUrl: await blobToDataUrl(s),
      };
      const res = await this.bucketOpreate<model.FileItemModel>(data);
      if (!res.success) {
        data.operate = model.BucketOpreates.AbortUpload;
        await this.bucketOpreate<boolean>(data);
        progress.apply(this, [-1]);
        return;
      }
      const finished = i * 1024 * 1024 + s.size;
      progress.apply(this, [finished]);
      if (finished === file.size && res.data) {
        return res.data;
      }
    }
  }
  async findEntityById<T extends XEntity>(
    id: string,
    typeName: string,
    shareId?: string,
  ): Promise<T | undefined> {
    let res: XEntity[] = [];
    switch (typeName) {
      case '表格':
        res = await this.reportColl.find([id]);
        break;
      case '视图':
        res = await this.viewColl.find([id]);
        break;
      case '表单':
        res = await this.formColl.find([id]);
        break;
      case '打印模板':
        res = await this.printColl.find([id]);
        break;
      case '属性':
        res = await this.propertyColl.find([id]);
        break;
      case '分类':
        res = await this.speciesColl.find([id]);
        break;
      case '分类项':
        res = await this.speciesItemColl.find([id]);
        break;
      case '迁移':
        res = await this.transferColl.find([id]);
        break;
      case '报表树':
        res = await this.reportTreeColl.find([id]);
        break;
      case '报表树节点':
        res = await this.reportTreeNodeColl.find([id]);
        break;
      case '模板':
      case '商城模板':
      case '空间模板':
        res = await this.templateColl.find([id]);
        break;
      case '文档模板':
        res = await this.documentColl.find([id]);
        break;
      case '办事':
      case '集群模板':
        res =
          (
            await this.workDefineColl.loadResult({
              options: {
                match: {
                  primaryId: id,
                  isDeleted: false,
                  applicationId: {
                    _gt_: '0',
                  },
                },
              },
            })
          ).data ?? [];
        break;
    }
    return res[0] as T;
  }
}
