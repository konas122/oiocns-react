import { kernel, model, schema } from '../../base';
import { IApplication } from '../thing/standard/application';
import { IForm, Form } from '../thing/standard/form';
import { IFile } from '../thing/fileinfo';
import { IDirectory } from '../thing/directory';
import { IWorkApply, WorkApply } from './apply';
import { entityOperates, fileOperates, TargetType } from '../public';
import { formatZhDate, getUuid } from '@/utils/tools';
import { getEndNode, isHasApprovalNode } from '@/utils/work';
import { deepClone, formatDate } from '@/ts/base/common';
import { versionOperates, workOperates } from '../public/operates';
import { IPrint, Print } from '../thing/standard/print';
import _ from 'lodash';
import { FormInfo } from '@/ts/base/model';
import { setDefaultField } from '@/ts/scripting/core/services/FormService';
import { Version, IVersion } from '../thing/standard/version';
import { IReport, Report } from '../thing/standard/report';
import { XForm, XReport } from '@/ts/base/schema';

export interface IWork extends IVersion<schema.XWorkDefine, IWork> {
  /** 我的办事 */
  isAuth: boolean;
  /** 主表 */
  primaryForms: (IForm | IReport)[];
  /** 打印模板 */
  primaryPrints: IPrint[];
  /** 所有表单 */
  readonly forms: (IForm | IReport)[];
  /** 子表 */
  detailForms: IForm[];
  /** 应用 */
  application: IApplication;
  /** 成员节点绑定信息 */
  gatewayInfo: schema.XWorkGateway[];
  /** 流程节点 */
  node: model.WorkNodeModel | undefined;
  /** 更新办事定义 */
  update(req: model.WorkDefineModel): Promise<model.ResultType<schema.XWorkDefine>>;
  /** 加载所有版本 */
  loadAllVersion(): Promise<IWork[]>;
  /** 加载明细 */
  load(): Promise<void>;
  /** 加载事项定义节点 */
  loadNode(reload?: boolean): Promise<model.WorkNodeModel | undefined>;
  /** 加载成员节点信息 */
  loadGatewayInfo(reload?: boolean): Promise<schema.XWorkGateway[]>;
  /** 删除绑定 */
  deleteGateway(id: string): Promise<boolean>;
  /** 分发办事 */
  distribute(destination: IDirectory): Promise<boolean>;
  /** 绑定成员节点 */
  bingdingGateway(
    primaryId: string,
    identity: schema.XIdentity,
    define: schema.XWorkDefine,
  ): Promise<schema.XWorkGateway | undefined>;
  /** 生成办事申请单 */
  createApply(
    taskId?: string,
    pdata?: model.InstanceDataModel,
    instanceId?: string,
    reload?: boolean,
  ): Promise<IWorkApply | undefined>;
  /** 创建默认物 */
  createThing(data: model.InstanceDataModel): Promise<void>;
  /** 通知变更 */
  notify(operate: string, data: any): void;
  /** 接收通知 */
  receive(operate: string, data: schema.XWorkDefine): boolean;
  /** 商城申领数据 */
  applyData(
    node: model.WorkNodeModel,
    items: schema.XProduct[],
  ): Promise<model.InstanceDataModel>;
}

export class Work extends Version<schema.XWorkDefine, IWork> implements IWork {
  constructor(_metadata: schema.XWorkDefine, _application: IApplication, _flag?: string) {
    _metadata.allowInitiate =
      _metadata.allowInitiate ??
      TargetType.Group != _application.directory.target.typeName;
    super(_metadata, _application.directory);
    this.application = _application;
    this.flag = _flag ?? '';
    // 默认不加载额外版本
    this._versions = [_metadata];
  }
  flag: string;
  canDesign: boolean = true;
  primaryForms: (IForm | IReport)[] = [];
  primaryPrints: IPrint[] = [];
  detailForms: IForm[] = [];
  application: IApplication;
  node: model.WorkNodeModel | undefined;
  gatewayInfo: schema.XWorkGateway[] = [];
  get locationKey(): string {
    return this.application.key;
  }
  get name(): string {
    return `${this._metadata.name} ${this.flag === '版本' ? 'v' + this.metadata.version : ''
      }`;
  }
  get isUsed(): boolean {
    return !!this._metadata.applicationId;
  }
  get cacheFlag(): string {
    return 'works';
  }
  get forms(): (IForm | IReport)[] {
    return [...this.primaryForms, ...this.detailForms];
  }
  get prints(): IPrint[] {
    return [...this.primaryPrints];
  }
  get superior(): IFile {
    return this.application;
  }
  get groupTags(): string[] {
    if (this.flag === '版本') {
      return [...super.groupTags, this.isUsed ? '在用版本' : ''].filter(Boolean);
    }
    const tags = [this.target.space.name];
    if (this.target.id != this.target.spaceId) {
      tags.push(this.target.name);
    }
    return [...tags, ...super.groupTags];
  }
  get isAuth(): boolean {
    if (this._metadata.applyAuth === '0') return true;
    return this._metadata.applyAuth
      ? this.target.hasAuthoritys([this._metadata.applyAuth])
      : true;
  }
  allowCopy(destination: IDirectory): boolean {
    return this.typeName != '集群模板' && ['应用', '模块'].includes(destination.typeName);
  }
  allowDistribute(destination: IDirectory): boolean {
    return (
      this.typeName != '集群模板' &&
      ['应用', '模块'].includes(destination.typeName) &&
      this.directory.target.id !== destination.target.id
    );
  }
  allowMove(destination: IDirectory): boolean {
    return (
      this.typeName != '集群模板' &&
      ['应用', '模块'].includes(destination.typeName) &&
      destination.id !== this.metadata.applicationId &&
      destination.target.belongId == this.target.belongId
    );
  }
  async delete(_notity: boolean = false): Promise<boolean> {
    if (this.application) {
      const res = await kernel.deleteWorkDefine({
        id: this.id,
        shareId: this.metadata.shareId,
      });
      if (res.success) {
        await this.recorder.remove({
          coll: this.directory.resource.workDefineColl,
          next: this.metadata,
        });
        this.application.works = this.application.works.filter((a) => a.id != this.id);
        this.notify('remove', this.metadata);
        this.application.changCallback();
      }
      return res.success;
    }
    return false;
  }
  hardDelete(_notity: boolean = false): Promise<boolean> {
    return this.delete(_notity);
  }
  async rename(_name: string): Promise<boolean> {
    const res = await this.update({
      ...this.metadata,
      name: _name,
      node: undefined,
    })
    return res.success;
  }
  async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      const app = destination as unknown as IApplication;
      const isSameTarget = this.directory.target.id === destination.target.id;
      var node = deepClone(await this.loadNode());
      var entNode = getEndNode(node);
      if (node && node.code) {
        delete node.children;
        delete node.branches;
      } else {
        node = {
          code: `node_${getUuid()}`,
          type: '起始',
          name: '发起',
          num: 1,
          forms: [],
          executors: [],
          formRules: [],
          primaryPrints: [],
          primaryForms: [],
          detailForms: [],
        } as unknown as model.WorkNodeModel;
      }
      node.children = entNode;
      const data = {
        ...this.metadata,
        sourceId: this.metadata.sourceId ?? this.id,
        node: node && node.code ? node : undefined,
        id: '0',
      };
      if (isSameTarget) {
        const uuid = getUuid();
        data.code = `${this.metadata.code}-${uuid}`;
        data.name = `${this.metadata.name} - 副本${uuid}`;
      }
      const res = await app.createWork(data);
      return res != undefined;
    }
    return false;
  }
  async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      var node = await this.loadNode();
      const app = destination as unknown as IApplication;
      const work = await app.createWork({
        ...this.metadata,
        node: node,
      });
      if (work) {
        this.notify('workRemove', this.metadata);
        return true;
      }
    }
    return false;
  }
  async distribute(destination: IDirectory): Promise<boolean> {
    if (this.allowDistribute(destination)) {
      const app = destination as unknown as IApplication;
      var node = deepClone(await this.loadNode());
      var hasApprovalNode = isHasApprovalNode(node);
      var entNode = getEndNode(node);
      if (node && node.code) {
        delete node.children;
        delete node.branches;
      } else {
        node = {
          code: `node_${getUuid()}`,
          type: '起始',
          name: '发起',
          num: 1,
          forms: [],
          executors: [],
          formRules: [],
          primaryPrints: [],
          primaryForms: [],
          detailForms: [],
        } as unknown as model.WorkNodeModel;
      }
      node.children = {
        id: '0',
        primaryId: '0',
        num: 0,
        type: hasApprovalNode ? '审批' : '抄送',
        destType: '其他办事',
        destName: `[${this.target.name}]${this.name}`,
        defineId: '0',
        belongId: '0',
        code: 'JGNODE' + getUuid(),
        name: '监管办事',
        destId: this.metadata.id,
        destShareId: this.metadata.shareId,
        resource: '{}',
        children: entNode,
        branches: undefined,
        primaryPrints: [],
        primaryForms: [],
        detailForms: [],
        formRules: [],
        forms: [],
        executors: [],
        encodes: [],
        print: [],
        splitRules: [],
        authoritys: [],
        containCompany: true,
        printData: { attributes: [], type: '' },
        documentConfig: {
          propMapping: {},
          nodeMapping: {},
          templates: [],
        },
      };
      const data = {
        ...this.metadata,
        sourceId: this.metadata.sourceId ?? this.id,
        node: node && node.code ? node : undefined,
        id: '0',
      };
      const res = await app.createWork(data);
      return res != undefined;
    }
    return false;
  }
  content(): IFile[] {
    if (this.node) {
      const ids =
        [...this.node.primaryForms, ...this.node.detailForms]?.map((i) => i.id) ?? [];
      return this.forms.filter((a) => ids.includes(a.id));
    }
    return [];
  }
  async loadContent(_reload: boolean = false): Promise<boolean> {
    await this.loadNode(_reload);
    await this.loadGatewayInfo(true);
    return this.forms.length > 0;
  }
  async update(data: model.WorkDefineModel): Promise<model.ResultType<schema.XWorkDefine>> {
    data.id = this.id;
    data.primaryId = this.metadata.primaryId;
    data.applicationId = this.metadata.applicationId;
    data.shareId = this.directory.target.id;
    data.belongId = this.directory.target.belongId;
    data.updateTime = formatZhDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const res = await kernel.createWorkDefine(data);
    if (res.success && res.data.id) {
      if (res.data.id != this.id) {
        this.notify('remove', this.metadata);
        this.notify('insert', res.data);
      } else {
        this.notify('replace', res.data);
      }
    }
    return res;
  }
  async loadGatewayInfo(reload: boolean = false): Promise<schema.XWorkGateway[]> {
    if (this.gatewayInfo.length == 0 || reload) {
      const destId = this.canDesign
        ? this.directory.target.id
        : this.directory.target.spaceId;
      const res = await kernel.queryWorkGateways({
        defineId: this.id,
        shareId: this._metadata.shareId,
        targetId: destId,
      });
      if (res.success && res.data) {
        this.gatewayInfo = res.data.result || [];
      }
    }
    return this.gatewayInfo;
  }
  async deleteGateway(id: string): Promise<boolean> {
    const res = await kernel.deleteWorkGateway({ id });
    if (res.success) {
      this.gatewayInfo = this.gatewayInfo.filter((a) => a.id != id);
    }
    return res.success;
  }
  async bingdingGateway(
    primaryId: string,
    identity: schema.XIdentity,
    define: schema.XWorkDefine,
  ): Promise<schema.XWorkGateway | undefined> {
    const res = await kernel.createWorkGeteway({
      primaryId: primaryId,
      defineName: define.name,
      defineId: define.primaryId,
      defineShareId: define.shareId,
      identityId: identity.id,
      memberId: this.directory.target.spaceId,
      shareId: this.metadata.shareId,
    });
    if (res.success) {
      this.gatewayInfo = this.gatewayInfo.filter((a) => a.nodeId != primaryId);
      this.gatewayInfo.push({ ...res.data, define, identity });
    }
    return res.data;
  }

  /** 加载所有版本 */
  async loadAllVersion(reload = false): Promise<Work[]> {
    if (reload) {
      const versions = await this.application.resource.workDefineColl.loadSpace({
        take: 20,
        skip: 0,
        options: {
          project: { resource: 0 },
          match: {
            primaryId: this.metadata.primaryId,
            shareId: this.metadata.shareId,
            isDeleted: false,
          },
          sort: { updateTime: -1 },
        },
      });
      this._versions = versions;
    }
    return this._versions.map((m) => new Work(m, this.application, '版本'));
  }
  async switchToVersion(): Promise<boolean> {
    await this.load();
    const res = await kernel.switchWorkDefine({
      id: this.metadata.id,
      shareId: this.metadata.shareId,
      applicationId: this.application.metadata.id,
      primaryId: this.metadata.primaryId,
    });
    if (res.success) {
      this.notify('replace', {
        ...this._metadata,
        applicationId: this.application.metadata.id,
      });
    }
    return res.success;
  }
  async deleteVersion(): Promise<boolean> {
    if (!this.isUsed && (await this.delete())) {
      this.notify('deleteVersion', this.metadata);
    }
    return true;
  }

  async load() {
    const versions = await this.application.resource.workDefineColl.loadSpace({
      options: {
        match: {
          id: this.id,
          shareId: this.metadata.shareId,
        },
      },
    });
    this.setMetadata(Object.assign(versions[0], this._metadata));
  }
  async loadNode(reload: boolean = false): Promise<model.WorkNodeModel | undefined> {
    if (this.node === undefined || reload) {
      const res = await kernel.queryWorkNodes({
        id: this.metadata.id,
        shareId: this.metadata.shareId,
      });
      if (res.success) {
        this.node = res.data;
        this.primaryPrints = [];
        this.primaryForms = [];
        this.detailForms = [];
        await this.recursionForms(this.node);
      }
    }
    return this.node;
  }
  async createApply(
    taskId: string = '0',
    pdata?: model.InstanceDataModel,
    instanceId: string = '0',
    _reload: boolean = true,
  ): Promise<IWorkApply | undefined> {
    await this.loadNode(_reload);
    if (this.node && this.forms.length > 0) {
      const data: model.InstanceDataModel = {
        data: {},
        fields: {},
        primary: {},
        node: this.node,
        rules: [],
        reception: pdata?.reception,
      };
      if (pdata?.primary) {
        Object.keys(pdata.primary).forEach((k) => {
          data.primary[k] = pdata.primary[k];
        });
      }
      this.forms.forEach((form) => {
        data.fields[form.id] = form.fields;
        if (pdata && pdata.data[form.id]) {
          const after = pdata.data[form.id]?.at(-1);
          if (after) {
            data.data[form.id] = [{ ...after, nodeId: this.node!.id }];
          }
        }
      });
      await this.createThing(data);
      return new WorkApply(
        {
          id: instanceId,
          hook: '',
          taskId: taskId,
          title: this.name,
          defineId: this.metadata.primaryId,
          shareId: this.target.id,
        } as model.WorkInstanceModel,
        data,
        this.directory.target,
        this.primaryPrints,
        this.primaryForms,
        this.detailForms,
        this.metadata.applyType,
        this.metadata,
      );
    }
  }
  async createThing(data: model.InstanceDataModel): Promise<void> {
    await this.loadNode();
    if (this.node) {
      for (const form of this.primaryForms) {
        if (!data.data[form.id]) {
          const res = await kernel.createThing(this.directory.spaceId, [], form.name);
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const item = res.data[0];
            await setDefaultField(item, form.fields, this.directory.target.space);
            data.data[form.id] = [
              {
                before: [],
                after: [item],
                rules: [],
                formName: form.name,
                creator: this.directory.userId,
                createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
                nodeId: this.node.id,
              },
            ];
          }
        }
      }
    }
  }

  async applyData(
    node: model.WorkNodeModel,
    items: schema.XProduct[],
  ): Promise<model.InstanceDataModel> {
    const instance: model.InstanceDataModel = {
      data: {},
      node: node,
      fields: {},
      primary: {},
      rules: [],
    };
    const fields = [
      'id',
      'code',
      'name',
      'chainId',
      'belongId',
      'createUser',
      'createTime',
      'updateUser',
      'updateTime',
    ];
    for (const form of this.detailForms) {
      instance.fields[form.id] = await form.loadFields();
      instance.data[form.id] = [
        {
          nodeId: node.id,
          formName: form.name,
          before: [],
          after: items.map((item) => {
            const data: any = {};
            for (const field of fields) {
              if (item[field]) {
                data[field] = item[field];
              }
            }
            for (const field of form.fields) {
              if (item[field.code]) {
                data[field.id] = item[field.code];
              }
            }
            return data;
          }),
          creator: this.userId,
          createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
          rules: [],
        },
      ];
    }
    return instance;
  }
  override operates(): model.OperateModel[] {
    var operates: model.OperateModel[] = [];
    if (this.flag === '版本') {
      if (!this.metadata.applicationId) {
        operates = [versionOperates.Used, versionOperates.Delete];
      }
      return operates;
    }
    operates = [workOperates.Distribute, ...super.operates()];
    if (this.isInherited) {
      operates.push({ sort: 3, cmd: 'workForm', label: '查看表单', iconType: 'newForm' });
    }
    if (this.userId != this.spaceId && this.target.space.hasRelationAuth()) {
      if (this.companyCache.tags?.includes('常用')) {
        operates.unshift(fileOperates.DelCompanyCommon);
      } else {
        operates.unshift(fileOperates.SetCompanyCommon);
      }
    }
    if (this.cache.tags?.includes('常用')) {
      operates.unshift(fileOperates.DelCommon);
    } else {
      operates.unshift(fileOperates.SetCommon);
    }
    if (this.typeName == '集群模板') {
      operates = operates.filter(
        (a) =>
          ![fileOperates.Copy, fileOperates.Move, workOperates.Distribute].includes(a),
      );
    }
    if (this.metadata.hasGateway) {
      operates.push({
        sort: 4,
        cmd: 'fillWork',
        label: '关联我的办事',
        iconType: '办事',
      });
    }
    if (operates.includes(entityOperates.Delete)) {
      operates.push(entityOperates.HardDelete);
    }
    return operates
      .filter((i) => i != fileOperates.Download)
      .filter((i) => i != entityOperates.Delete);
  }
  private async recursionForms(node: model.WorkNodeModel) {
    node.primaryForms = [];
    node.detailForms = [];
    node.print = [];
    node.formRules = [];
    node.executors = [];
    node.buttons = [];
    node.forms = [];
    if (node.resource) {
      const resource = JSON.parse(node.resource);
      if (Array.isArray(resource)) {
        node.primaryForms = resource;
        node.formRules = [];
        node.executors = [];
      } else {
        node.primaryForms = resource.primaryForms ?? [];
        node.detailForms = resource.detailForms ?? [];
        node.forms = resource.forms ?? [];
        node.print = resource.print;
        node.formRules = resource.formRules;
        node.executors = resource.executors;
        node.buttons = resource.buttons;
        node.documentConfig = resource.documentConfig || {
          propMapping: {},
          nodeMapping: {},
          templates: [],
        };
        if (resource.forms) {
          node.detailForms = await this.directory.resource.formColl.find(
            resource.forms
              .filter((a: schema.XForm) => 'typeName' in a && a.typeName == '子表')
              .map((s: schema.XForm) => s.id),
          );
          const formsList = await this.directory.resource.formColl.find(
            resource.forms
              .filter((a: schema.XForm) => 'typeName' in a && a.typeName == '主表')
              .map((s: schema.XForm) => s.id),
          );
          const reportsList = await this.directory.resource.reportColl.find(
            resource.forms
              .filter((a: schema.XReport) => 'typeName' in a && a.typeName == '主表')
              .map((s: schema.XReport) => s.id),
          );
          node.primaryForms = [...formsList, ...reportsList];
        } else {
          resource.primaryForms && node.forms.push(...resource.primaryForms);
          resource.detailForms && node.forms.push(...resource.detailForms);
        }
      }
    }
    const formMap =
      node.forms.reduce<Dictionary<FormInfo>>((a, v) => {
        if (!a[v.id]) {
          // 检查id是否已经存在于a中
          a[v.id] = v; // 如果不存在，添加到a中
        }
        return a;
      }, {}) ?? {};
    node.detailForms = _.orderBy(node.detailForms, (a) => formMap[a.id].order);
    node.primaryForms = _.orderBy(node.primaryForms, (a) => formMap[a.id].order);
    node.primaryPrints = await this.directory.resource.printColl.find(
      node.print?.map((s) => s.id),
    );
    for (const a of node.primaryPrints) {
      const print = new Print({ ...a, id: a.id + '_' }, this.directory);
      await print.loadFields();
      this.primaryPrints.push(print);
    }

    for (const a of node.primaryForms) {
      if (a.typeName === '表单' || a.typeName === '报表') {
        const form = new Form({ ...(a as XForm), id: a.id + '_' }, this.directory);
        await form.loadFields();
        this.primaryForms.push(form);
      } else if (a.typeName === '表格') {
        const report = new Report({ ...(a as XReport), id: a.id + '_' }, this.directory);
        await report.loadFields();
        this.primaryForms.push(report);
      }
    }
    for (const a of node.detailForms) {
      const form = new Form({ ...a, id: a.id + '_' }, this.directory);
      await form.loadFields();
      this.detailForms.push(form);
    }
    if (node.children) {
      await this.recursionForms(node.children);
    }
    if (node.branches) {
      for (const branch of node.branches) {
        if (branch.children) {
          await this.recursionForms(branch.children);
        }
      }
    }
  }
  notify(operate: string, data: any): void {
    this.application.notify(operate, {
      ...data,
      applicationId: this.application.metadata.id,
      directoryId: this.application.metadata.directoryId,
    });
  }
  receive(operate: string, data: schema.XWorkDefine): boolean {
    if (data && data.primaryId === this.metadata.primaryId) {
      switch (operate) {
        case 'replace':
          {
            this.setMetadata(data, true);
            this.loadContent(true).then(() => {
              this.changCallback();
            });
            //设置在用版本为第一
            let result: schema.XWorkDefine[] = [];
            this._versions.forEach((v) => {
              if (v.id === data.id) {
                result.unshift(Object.assign(v, data) as any);
              } else {
                v.applicationId = 0 as any;
                result.push(v);
              }
            });
            this._versions = result;
            this.directory.changCallback('versionChange', true);
          }
          break;
        case 'deleteVersion':
          {
            this._versions = this._versions.filter((v) => v.id !== data.id);
            this.directory.changCallback('versionChange', true);
          }
          break;
        default:
          break;
      }
    }
    return true;
  }
}
