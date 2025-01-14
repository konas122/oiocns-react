import { kernel, model, schema } from '../../../base';
import { PageAll, directoryOperates, fileOperates } from '../../public';
import { IDirectory } from '../directory';
import { IFile } from '../fileinfo';
import { IWork, Work } from '../../work';
import { ISequence, Sequence } from './sequence';
import { applicationNew, workOperates } from '../../public/operates';
import { Form, IForm } from './form';
import { Print, IPrint } from './print';
import { DataResource } from '../resource';
import { Recorder } from '../recorder';
import { Container, IContainer } from '../container';
import { ISpecies, Species } from './species';
import { DocumentTemplate, IDocumentTemplate } from './document';
import { IReport, Report } from './report';
import { IBaseView } from './view/baseView';
import { ViewFactory } from './view/viewFactory';

/** 应用/模块接口类 */
export interface IApplication extends IContainer<schema.XApplication> {
  /** 上级模块 */
  parent: IApplication | undefined;
  /** 下级模块 */
  children: IApplication[];
  /** 排序的下级模块 */
  sortedChildren: IApplication[];
  /** 资源集合 */
  resource: DataResource;
  /** 流程定义 */
  works: IWork[];
  /** 表单 */
  forms: IForm[];
  /** 表格 */
  reports: IReport[];
  /** 打印模板 */
  prints: IPrint[];
  /** 序列 */
  sequences: ISequence[];
  /** 应用归属标签 */
  belongTags: string[];
  /** 是否有权限 */
  isAuth: boolean;
  /** 加载所有表单，报表，视图的属性 */
  load(): Promise<boolean>;
  /** 根据id查找办事 */
  findWork(id: string, applicationId?: string): Promise<IWork | undefined>;
  /** 加载办事 */
  loadWorks(reload?: boolean): Promise<IWork[]>;
  /** 加载所有办事 */
  loadAllWorks(reload?: boolean): Promise<IWork[]>;
  /** 分发应用 */
  distribute(destination: IDirectory): Promise<boolean>;
  /** 新建办事 */
  createWork(data: model.WorkDefineModel): Promise<IWork | undefined>;
  /** 加载表单 */
  loadForms(reload?: boolean): Promise<IForm[]>;
  /** 加载视图 */
  loadViews(reload?: boolean): Promise<IBaseView[]>;
  /** 加载报表 */
  loadReports(reload?: boolean): Promise<IReport[]>;
  /** 加载所有表单 */
  loadAllForms(reload?: boolean): Promise<IForm[]>;
  /** 加载所有视图 */
  loadAllViews(reload?: boolean): Promise<IBaseView[]>;
  /** 加载所有报表 */
  loadAllReports(reload?: boolean): Promise<IReport[]>;
  /** 加载打印模板 */
  loadPrint(reload?: boolean): Promise<IPrint[]>;
  /** 加载所有打印模板 */
  loadAllPrint(reload?: boolean): Promise<IPrint[]>;
  /** 加载打印模板 */
  loadDocuments(reload?: boolean): Promise<IDocumentTemplate[]>;
  /** 加载所有打印模板 */
  loadAllDocuments(reload?: boolean): Promise<IDocumentTemplate[]>;
  /**新建表单 */
  createForm(data: schema.XForm): Promise<schema.XForm | undefined>;
  /**新建视图 */
  createView(data: schema.XView): Promise<schema.XView | undefined>;
  /**新建报表 */
  createReport(data: schema.XReport): Promise<schema.XReport | undefined>;
  /** 新建模块 */
  createModule(data: schema.XApplication): Promise<schema.XApplication | undefined>;
  /** 搜索文件 */
  searchFile(
    applicationId: string,
    id: string,
    key?: 'id' | 'sourceId' | 'or',
  ): Promise<IFile | undefined>;
  /** 搜索常用文件 */
  searchComment(commont: schema.XCommon): Promise<IFile | undefined>;
  /** 创建序列 */
  createSequence(data: schema.XSequence): Promise<schema.XSequence | undefined>;
  /** 加载序列 */
  loadSequences(reload?: boolean): Promise<ISequence[]>;
  /** 清空数据 */
  clearing(notify?: boolean): Promise<boolean>;
  /** 生成应用办事分类 */
  toSpecies(dest: IDirectory): Promise<schema.XSpecies | undefined>;
}

/** 应用实现类 */
export class Application extends Container<schema.XApplication> implements IApplication {
  constructor(
    _metadata: schema.XApplication,
    _directory: IDirectory,
    _parent?: IApplication,
    _applications?: schema.XApplication[],
  ) {
    super(_metadata, _directory, _directory.resource.applicationColl);
    this.parent = _parent;
    this.resource = _directory.resource;
    this.loadChildren(_applications);
    this.recorder = new Recorder(this);
    if (_parent) {
      this.path = [..._parent.path, _metadata.id];
    }
  }
  /** 表单 */
  forms: IForm[] = [];
  views: IBaseView[] = [];
  reports: IReport[] = [];
  prints: IPrint[] = [];
  documents: IDocumentTemplate[] = [];
  works: IWork[] = [];
  sequences: ISequence[] = [];
  children: IApplication[] = [];
  parent: IApplication | undefined;
  resource: DataResource;
  private _worksLoaded: boolean = false;
  private _sequencesLoaded: boolean = false;
  private _formsLoaded: boolean = false;
  private _viewsLoaded: boolean = false;
  private _reportsLoaded: boolean = false;
  private _printsLoaded: boolean = false;
  private _docsLoaded: boolean = false;
  accepts: string[] = [
    '办事',
    '模块',
    '表单',
    '视图',
    '序列',
    '报表',
    '打印模板',
    '文档模板',
  ];
  get locationKey(): string {
    return this.key;
  }
  get cacheFlag(): string {
    return 'applications';
  }
  get isContainer(): boolean {
    return true;
  }
  get isAuth(): boolean {
    if (!this._metadata.applyAuths?.length || this._metadata.applyAuths[0] === '0') return true;
    return this.target.hasAuthoritys(this._metadata.applyAuths);
  }
  get superior(): IFile {
    return this.parent ?? this.directory;
  }
  get belongTags(): string[] {
    const tags = [];
    if (this.target.space.id != this.target.id) {
      tags.push(this.target.space.name);
    }
    tags.push(this.target.name);
    return tags;
  }
  get groupTags(): string[] {
    const tags = [...super.groupTags];
    if (this.cache.tags?.includes('常用')) {
      tags.push('常用');
    }
    tags.push(...this.belongTags);
    return tags;
  }
  private sort<T extends IFile>(cnt: T[]) {
    if (this.metadata.sorts) {
      const map = new Map(this.metadata.sorts.map((sort) => [sort.id, sort.sort]));
      return cnt.sort((f, n) => (map.get(f.id) || 0) - (map.get(n.id) || 0));
    }
    return cnt;
  }
  get sortedChildren(): IApplication[] {
    return this.sort([this, ...this.children]);
  }
  content(): IFile[] {
    const cnt = [
      ...this.children,
      ...this.works,
      ...this.forms,
      ...this.views,
      ...this.reports,
      ...this.sequences,
      ...this.prints,
      ...this.documents,
    ];
    if (this.metadata.sorts) {
      const map = new Map(this.metadata.sorts.map((sort) => [sort.id, sort.sort]));
      return cnt.sort((f, n) => (map.get(f.id) || 0) - (map.get(n.id) || 0));
    }
    return cnt.sort((a, b) => (a.metadata.updateTime < b.metadata.updateTime ? 1 : -1));
  }
  override allowCopy(destination: IDirectory): boolean {
    return ['目录', '应用', '模块'].includes(destination.typeName);
  }
  allowDistribute(destination: IDirectory): boolean {
    return (
      ['目录', '应用', '模块'].includes(destination.typeName) &&
      this.directory.target.id !== destination.target.id
    );
  }
  override allowMove(destination: IDirectory): boolean {
    return (
      ['目录', '应用', '模块'].includes(destination.typeName) &&
      destination.target.belongId == this.target.belongId
    );
  }
  async load(): Promise<boolean> {
    const allForms = await this.loadAllForms(true);
    const allViews = await this.loadAllViews(true);
    try {
      await Promise.all([
        allForms.map(async (file: any) => {
          await file.load();
        }),
        allViews.map(async (file: any) => {
          await file.load();
        }),
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }
  async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      var _isSpanBelong = super.isSpanBelong(destination);
      const appData = {
        ...this.metadata,
        shareId: destination.target.id,
        sourceId: this.metadata.sourceId ?? this.metadata.id,
        id: _isSpanBelong ? this.id : 'snowId()',
      };
      switch (destination.typeName) {
        case '目录': {
          appData.typeName = '应用';
          appData.parentId = '';
          appData.directoryId = destination.id;
          const coll = destination.resource.applicationColl;
          const application = await coll.replace(appData);
          if (application) {
            await coll.notity({
              operate: 'insert',
              data: {
                ...application,
                children: await this.recursionOperates(
                  this,
                  new Application(application, destination),
                  'copy',
                  _isSpanBelong,
                ),
              },
            });
          }
          return true;
        }
        case '应用': {
          var destApplication = destination as unknown as IApplication;
          appData.typeName = '模块';
          appData.parentId = destApplication.id;
          appData.directoryId = destApplication.directory.id;
          const directory = destApplication.directory;
          const coll = directory.resource.applicationColl;
          const appEntity = await coll.replace(appData);
          if (appEntity) {
            await coll.notity({
              operate: 'insert',
              data: {
                ...appEntity,
                children: await this.recursionOperates(
                  this,
                  new Application(appEntity, destApplication.directory, destApplication),
                  'copy',
                  _isSpanBelong,
                ),
              },
            });
          }
          return true;
        }
      }
    }
    return false;
  }
  async distribute(destination: IDirectory): Promise<boolean> {
    if (this.allowDistribute(destination)) {
      var _isSpanBelong = this.isSpanBelong(destination);
      const appData = {
        ...this.metadata,
        shareId: destination.target.id,
        id: _isSpanBelong ? this.metadata.id : 'snowId()',
      };
      switch (destination.typeName) {
        case '目录': {
          appData.typeName = '应用';
          appData.parentId = '';
          appData.directoryId = destination.id;
          const coll = destination.resource.applicationColl;
          const application = await coll.replace(appData);
          if (application) {
            await coll.notity({
              operate: 'insert',
              data: {
                ...application,
                children: await this.recursionOperates(
                  this,
                  new Application(application, destination),
                  'distribute',
                  _isSpanBelong,
                ),
              },
            });
          }
          return true;
        }
        case '应用': {
          var destApplication = destination as unknown as IApplication;
          appData.typeName = '模块';
          appData.parentId = destApplication.id;
          appData.directoryId = destApplication.directory.id;
          const directory = destApplication.directory;
          const coll = directory.resource.applicationColl;
          const appEntity = await coll.replace(appData);
          if (appEntity) {
            await coll.notity({
              operate: 'insert',
              data: {
                ...appEntity,
                children: await this.recursionOperates(
                  this,
                  new Application(appEntity, destApplication.directory, destApplication),
                  'distribute',
                  _isSpanBelong,
                ),
              },
            });
          }
          return true;
        }
      }
    }
    return false;
  }
  override async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      const applications = this.getChildren(this);
      // TODO 这里的复制存在问题
      if (destination.target.id != this.target.id) {
        for (var app of applications) {
          var works = await app.loadWorks();
          for (var work of works) {
            await work.update({
              ...work.metadata,
              shareId: destination.target.id,
              node: undefined,
              isDepreciationLock: false,
            });
          }
        }
      }
      const xApplications = applications.map((a) => a.metadata);
      const xApp = xApplications.shift();
      var directory: IDirectory;
      if (xApp) {
        switch (destination.typeName) {
          case '目录':
            xApp.parentId = '';
            xApp.typeName = '应用';
            xApp.shareId = destination.target.id;
            directory = destination;
            break;
          case '应用':
            xApp.parentId = destination.id;
            xApp.typeName = '模块';
            directory = destination.directory;
            xApp.shareId = directory.target.id;
            break;
          default:
            return false;
        }
        xApplications.unshift(xApp);
        const data = await directory.resource.applicationColl.replaceMany(
          xApplications.map((a) => {
            return { ...a, directoryId: destination.id };
          }),
        );
        if (data && data.length > 0) {
          const forms = await directory.resource.formColl.loadSpace({
            options: {
              match: {
                applicationId: { _in_: xApplications.map((a) => a.id) },
              },
            },
          });
          await directory.resource.formColl.replaceMany(
            forms.map((a) => {
              return { ...a, directoryId: directory.id };
            }),
          );
          const views = await directory.resource.viewColl.loadSpace({
            options: {
              match: {
                applicationId: { _in_: xApplications.map((a) => a.id) },
              },
            },
          });
          await directory.resource.viewColl.replaceMany(
            views.map((a) => {
              return { ...a, directoryId: directory.id };
            }),
          );
          const prints = await directory.resource.printColl.loadSpace({
            options: {
              match: {
                applicationId: { _in_: xApplications.map((a) => a.id) },
              },
            },
          });
          await directory.resource.printColl.replaceMany(
            prints.map((a) => {
              return { ...a, directoryId: directory.id };
            }),
          );
          const documents = await directory.resource.documentColl.loadSpace({
            options: {
              match: {
                applicationId: { _in_: xApplications.map((a) => a.id) },
              },
            },
          });
          await directory.resource.documentColl.replaceMany(
            documents.map((a) => {
              return { ...a, directoryId: directory.id };
            }),
          );
          await this.notify('remove', this.metadata);
          await destination.notify('reload', {
            ...destination.metadata,
            directoryId: destination.id,
          });
          destination.changCallback();
        }
      }
    }
    return false;
  }
  private async recursionOperates(
    app: IApplication,
    dest: IApplication,
    cmd: 'copy' | 'distribute',
    spanBelong: boolean = false,
  ): Promise<schema.XApplication[]> {
    const modules: schema.XApplication[] = [];
    for (const child of app.children.filter((a) => a.metadata.isDeleted !== true)) {
      const appEntity = await dest.directory.resource.applicationColl.replace({
        ...child.metadata,
        parentId: dest.id,
        shareId: dest.metadata.shareId,
        directoryId: dest.metadata.directoryId,
        sourceId: child.metadata.sourceId ?? child.metadata.id,
        id: spanBelong ? child.id : 'snowId()',
      });
      if (appEntity) {
        modules.push(
          appEntity,
          ...(await this.recursionOperates(
            child,
            new Application(appEntity, dest.directory, dest),
            cmd,
            spanBelong,
          )),
        );
      }
    }
    var works = await app.loadWorks();
    var forms = await app.loadForms();
    var views = await app.loadViews();
    var reports = await app.loadReports();
    var prints = await app.loadPrint();
    var documents = await app.loadDocuments();
    var sequences = await app.loadSequences();
    if (spanBelong) {
      var existWorks = await dest.loadWorks(true);
      var existForms = await dest.loadForms(true);
      var existViews = await dest.loadViews(true);
      var existReports = await dest.loadReports(true);
      var existPrints = await dest.loadPrint(true);
      var existDocuments = await dest.loadDocuments(true);
      var existSequences = await dest.loadSequences(true);
      works = works.filter((a) =>
        existWorks.every((s) => s.metadata.sourceId != a.metadata.sourceId),
      );
      forms = forms.filter((a) =>
        existForms.every((s) => s.metadata.sourceId != a.metadata.sourceId),
      );
      views = views.filter((a) =>
        existViews.every((s) => s.metadata.sourceId != a.metadata.sourceId),
      );
      reports = reports.filter((a) =>
        existReports.every((s) => s.metadata.sourceId != a.metadata.sourceId),
      );
      prints = prints.filter((a) =>
        existPrints.every((s) => s.metadata.sourceId != a.metadata.sourceId),
      );
      documents = documents.filter((a) =>
        existDocuments.every((s) => s.metadata.sourceId != a.metadata.sourceId),
      );
      sequences = sequences.filter((a) =>
        existSequences.every((s) => s.metadata.sourceId != a.metadata.sourceId),
      );
    }
    for (const work of works) {
      switch (cmd) {
        case 'copy':
          await work.copy(dest as unknown as IDirectory);
          break;
        case 'distribute':
          await work.distribute(dest as unknown as IDirectory);
          break;
      }
    }
    for (const form of forms.filter((a) => a.metadata.isDeleted !== true)) {
      await form.copy(dest as unknown as IDirectory);
    }
    for (const view of views.filter((a) => a.metadata.isDeleted !== true)) {
      await view.copy(dest as unknown as IDirectory);
    }
    for (const report of reports.filter((a) => a.metadata.isDeleted !== true)) {
      await report.copy(dest as unknown as IDirectory);
    }
    for (const print of prints.filter((a) => a.metadata.isDeleted !== true)) {
      await print.copy(dest as unknown as IDirectory);
    }
    for (const document of documents.filter((a) => a.metadata.isDeleted !== true)) {
      await document.copy(dest as unknown as IDirectory);
    }
    for (const sequence of sequences.filter((a) => a.metadata.isDeleted !== true)) {
      await sequence.copy(dest as unknown as IDirectory);
    }
    return modules;
  }
  async hardDelete(): Promise<boolean> {
    for (const app of this.getChildren(this)) {
      await app.clearing(false);
      this.resource.applicationColl.removeCache((i) => i.id != app.id);
    }
    return await this.notify('remove', this.metadata);
  }
  async clearing(notify: boolean = true): Promise<boolean> {
    await Promise.all([
      this.loadAllWorks(true),
      this.loadForms(true),
      this.loadViews(true),
      this.loadReports(true),
      this.loadSequences(true),
    ]);
    await Promise.all(this.forms.map((form) => form.hardDelete()));
    await Promise.all(this.views.map((view) => view.hardDelete()));
    await Promise.all(this.reports.map((report) => report.hardDelete()));
    await Promise.all(this.sequences.map((sequence) => sequence.hardDelete()));
    await Promise.all(this.works.map((work) => work.hardDelete()));
    await super.hardDelete(notify);
    return true;
  }
  async findWork(id: string, applicationId?: string): Promise<IWork | undefined> {
    if (applicationId === undefined || applicationId == this.id) {
      await this.loadWorks();
      const find = this.works.find((i) => i.id === id || i.metadata.primaryId == id);
      if (find) {
        return find;
      }
    }
    for (const item of this.children) {
      const find = await item.findWork(id, applicationId);
      if (find) {
        return find;
      }
    }
  }
  async loadWorks(reload?: boolean | undefined): Promise<IWork[]> {
    if (!this._worksLoaded || reload) {
      var res = await this.resource.workDefineColl.loadResult({
        options: {
          match: { applicationId: this.id, isDeleted: false },
          project: { resource: 0 },
        },
      });
      if (res.success) {
        this._worksLoaded = true;
        this.works = (res.data || []).map((a) => new Work(a, this));
      }
    }
    return this.works;
  }
  async loadAllWorks(reload?: boolean | undefined): Promise<IWork[]> {
    await this.loadWorks(reload);
    var allWorks = [...this.works];
    for (const child of this.children) {
      allWorks.push(...(await child.loadAllWorks(reload)));
    }
    return allWorks;
  }
  async createWork(data: model.WorkDefineModel): Promise<IWork | undefined> {
    data.applicationId = this.id;
    data.shareId = this.directory.target.id;
    data.belongId = data.belongId ?? this.directory.belongId;
    const res = await kernel.createWorkDefine(data);
    if (res.success && res.data.id) {
      await this.recorder.creating({
        coll: this.resource.workDefineColl,
        next: { ...res.data, typeName: '办事' },
      });
      let work = new Work(res.data, this);
      work.notify('insert', work.metadata);
      return work;
    }
  }
  async createModule(
    data: schema.XApplication,
  ): Promise<schema.XApplication | undefined> {
    data.parentId = this.id;
    data.typeName = '模块';
    data.directoryId = this.directory.id;
    const result = await this.directory.resource.applicationColl.insert(data);
    if (result) {
      await this.recorder.creating({
        coll: this.directory.resource.applicationColl,
        next: result,
      });
      this.notify('insert', result);
      return result;
    }
  }
  async createSequence(data: schema.XSequence): Promise<schema.XSequence | undefined> {
    data.typeName = '序列';
    data.applicationId = this.id;
    data.directoryId = this.directory.id;
    const result = await this.directory.resource.sequenceColl.insert(data);
    if (result) {
      await this.recorder.creating({ coll: this.resource.sequenceColl, next: result });
      this.resource.sequenceColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async loadSequences(reload: boolean = false): Promise<ISequence[]> {
    if (this._sequencesLoaded === false || reload) {
      this._sequencesLoaded = true;
      this.sequences =
        (
          await this.directory.resource.sequenceColl.loadSpace({
            options: {
              match: {
                applicationId: this.id,
              },
              sort: {
                createTime: -1,
              },
            },
          })
        ).map((a) => new Sequence(a, this.directory)) ?? [];
    }
    return this.sequences;
  }
  async createForm(data: schema.XForm): Promise<schema.XForm | undefined> {
    const result = await this.resource.formColl.insert({
      ...data,
      attributes: [],
      applicationId: this.id,
      directoryId: this.directory.id,
    });
    if (result) {
      await this.recorder.creating({ coll: this.resource.formColl, next: result });
      await this.resource.formColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async loadForms(reload?: boolean | undefined): Promise<IForm[]> {
    if (this._formsLoaded === false || reload) {
      this._formsLoaded = true;
      const data = await this.resource.formColl.loadSpace({
        options: { match: { applicationId: this.id } },
      });
      this.forms = data.map((i) => {
        if (i.typeName === '视图' && !i.subTypeName) i.subTypeName = '表单';
        return new Form(i, this.directory, this);
      });
    }
    return this.forms;
  }
  async createView(data: schema.XView): Promise<schema.XView | undefined> {
    const result = await this.resource.viewColl.insert({
      ...data,
      attributes: [],
      applicationId: this.id,
      directoryId: this.directory.id,
    });
    if (result) {
      await this.recorder.creating({ coll: this.resource.viewColl, next: result });
      await this.resource.viewColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async loadViews(reload?: boolean | undefined): Promise<IBaseView[]> {
    if (this._viewsLoaded === false || reload) {
      this._viewsLoaded = true;
      const data = await this.resource.viewColl.loadSpace({
        options: { match: { applicationId: this.id } },
      });
      this.views = data.map((i) => {
        return ViewFactory.createView(i, this.directory);
      });
    }
    return this.views;
  }
  async createReport(data: schema.XReport): Promise<schema.XReport | undefined> {
    const result = await this.resource.reportColl.insert({
      ...data,
      attributes: [],
      applicationId: this.id,
      directoryId: this.directory.id,
    });
    if (result) {
      await this.recorder.creating({ coll: this.resource.reportColl, next: result });
      await this.resource.reportColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async loadReports(reload?: boolean | undefined): Promise<IReport[]> {
    if (this._reportsLoaded === false || reload) {
      this._reportsLoaded = true;
      const data = await this.resource.reportColl.loadSpace({
        options: { match: { applicationId: this.id } },
      });
      this.reports = data.map((i) => new Report(i, this.directory, this));
    }
    return this.reports;
  }
  async loadAllReports(reload?: boolean | undefined): Promise<IReport[]> {
    await this.loadReports(reload);
    var allReports = [...this.reports];
    for (const child of this.children) {
      allReports.push(...(await child.loadAllReports(reload)));
    }
    return allReports;
  }
  async loadAllForms(reload?: boolean | undefined): Promise<IForm[]> {
    await this.loadForms(reload);
    var allForms = [...this.forms];
    for (const child of this.children) {
      allForms.push(...(await child.loadAllForms(reload)));
    }
    return allForms;
  }
  async loadAllViews(reload?: boolean | undefined): Promise<IBaseView[]> {
    await this.loadViews(reload);
    var allViews = [...this.views];
    for (const child of this.children) {
      allViews.push(...(await child.loadAllViews(reload)));
    }
    return allViews;
  }
  async loadPrint(reload?: boolean | undefined): Promise<IPrint[]> {
    if (this._printsLoaded === false || reload) {
      this._printsLoaded = true;
      const data = await this.resource.printColl.loadSpace({
        options: { match: { applicationId: this.id } },
      });
      this.prints = data.map((i) => new Print(i, this.directory));
    }
    return this.prints;
  }
  async loadAllPrint(reload?: boolean | undefined): Promise<IPrint[]> {
    await this.loadPrint(reload);
    var allPrints = [...this.prints];
    for (const child of this.children) {
      allPrints.push(...(await child.loadAllPrint(reload)));
    }
    return allPrints;
  }
  async loadDocuments(reload?: boolean | undefined): Promise<IDocumentTemplate[]> {
    if (this._docsLoaded === false || reload) {
      this._docsLoaded = true;
      const data = await this.resource.documentColl.loadSpace({
        options: { match: { applicationId: this.id } },
      });
      this.documents = data.map((i) => new DocumentTemplate(i, this.directory));
    }
    return this.documents;
  }
  async loadAllDocuments(reload?: boolean | undefined): Promise<IDocumentTemplate[]> {
    await this.loadDocuments(reload);
    var allDocuments = [...this.documents];
    for (const child of this.children) {
      allDocuments.push(...(await child.loadDocuments(reload)));
    }
    return allDocuments;
  }
  async loadContent(reload: boolean = false): Promise<boolean> {
    await this.loadWorks(reload);
    await this.loadForms(reload);
    await this.loadViews(reload);
    await this.loadReports(reload);
    await this.loadPrint(reload);
    await this.loadDocuments(reload);
    await this.loadSequences(reload);
    return true;
  }
  override operates(): model.OperateModel[] {
    const operates: model.OperateModel[] = [];
    if (this.directory.target.hasRelationAuth()) {
      operates.push(applicationNew);
      if (this.directory.target.user.copyFiles.size > 0) {
        operates.push(fileOperates.Parse);
      }
    }
    operates.push(directoryOperates.Refesh, workOperates.Distribute, ...super.operates());
    return operates.filter((a) => a !== fileOperates.Download);
  }
  private loadChildren(applications?: schema.XApplication[]) {
    if (applications && applications.length > 0) {
      applications
        .filter((i) => i.parentId === this.metadata.id)
        .forEach((i) => {
          this.children.push(new Application(i, this.directory, this, applications));
        });
    }
  }
  private getChildren(application: IApplication): IApplication[] {
    const applications: IApplication[] = [application];
    for (const child of application.children) {
      applications.push(...this.getChildren(child));
    }
    return applications;
  }
  async searchComment(commont: schema.XCommon): Promise<IFile | undefined> {
    if (this.id === commont.applicationId) {
      await this.loadContent();
      return this.content().find((i) => i.id === commont.id);
    } else {
      for (const item of this.children) {
        const file = await item.searchComment(commont);
        if (file) {
          return file;
        }
      }
    }
  }
  async searchFile(
    applicationId: string,
    id: string,
    key: 'id' | 'sourceId' | 'or' = 'id',
  ): Promise<IFile | undefined> {
    if (this.id === applicationId) {
      await this.loadContent();
      return this.content().find((i) => {
        switch (key) {
          case 'id':
            return i.id == id;
          case 'sourceId':
            return i.sourceId == id;
          case 'or':
            return i.sourceId == id || i.id == id;
        }
      });
    } else {
      for (const item of this.children) {
        const file = await item.searchFile(applicationId, id, key);
        if (file) {
          return file;
        }
      }
    }
  }
  override receive(operate: string, data: schema.XApplication): boolean {
    if (data.shareId === this.target.id) {
      if (data.id === this.id) {
        this.coll.removeCache((i) => i.id != data.id);
        super.receive(operate, data);
        this.coll.cache.push(this._metadata);
        (this.parent || this.directory).changCallback();
        return true;
      } else if (data.parentId === this.id) {
        switch (operate) {
          case 'insert':
            {
              this.coll.removeCache((a) => a.id !== data.id);
              this.children = this.children.filter((a) => a.id !== data.id);
              this.coll.cache.push(data);
              const children: schema.XApplication[] = [];
              if ('children' in data) {
                children.push(...(data.children as schema.XApplication[]));
              }
              this.children.push(new Application(data, this.directory, this, children));
            }
            break;
          case 'remove':
            this.coll.removeCache((i) => i.id != data.id);
            this.children = this.children.filter((a) => a.id != data.id);
            break;
          case 'reload':
            break;
          default:
            this.children.find((i) => i.id === data.id)?.receive(operate, data);
            break;
        }
        this.changCallback();
        return true;
      } else if ('applicationId' in data && data.applicationId === this.id) {
        switch (data.typeName) {
          case '办事':
          case '集群模板':
            this.workReceive(operate, data);
            break;
          case '打印模板':
            this.printReceive(operate, data as unknown as schema.XPrint);
            break;
          case '文档模板':
            this.documentReceive(operate, data as unknown as schema.XDocumentTemplate);
            break;
          case '表单':
          case '报表':
            this.formReceive(operate, data as unknown as schema.XForm);
            break;
          case '视图':
            this.viewReceive(operate, data as unknown as schema.XView);
            break;
          case '表格':
            this.reportReceive(operate, data as unknown as schema.XReport);
            break;
          case '序列':
            this.sequenceReceive(operate, data as unknown as schema.XSequence);
            break;
          default:
            break;
        }
        this.changCallback();
        return true;
      } else {
        for (const child of this.children) {
          if (child.receive(operate, data)) {
            return true;
          }
        }
      }
    }
    return false;
  }
  workReceive(operate: string, data: any): boolean {
    switch (operate) {
      case 'insert':
        if (this.works.every((i) => i.id != data.id)) {
          let work = new Work(data as unknown as schema.XWorkDefine, this);
          this.works.push(work);
        }
        break;
      case 'remove':
        this.works = this.works.filter((i) => i.id != data.id);
        break;
      case 'replace':
        this.works
          .find((i) => i.metadata.primaryId === data.primaryId)
          ?.receive(operate, data);
        break;
      case 'deleteVersion':
        this.works
          .find((i) => i.metadata.primaryId === data.primaryId)
          ?.receive(operate, data);
        break;
    }
    return true;
  }
  formReceive(operate: string, data: schema.XForm): boolean {
    switch (operate) {
      case 'insert':
        {
          this.resource.formColl.cache.push(data);
          this.forms.push(new Form(data, this.directory, this));
        }
        break;
      case 'remove':
        this.resource.formColl.removeCache((i) => i.id !== data.id);
        this.forms = this.forms.filter((a) => a.id !== data.id);
        break;
      case 'delete':
      case 'replace':
        var form = this.forms.find((a) => a.id === data.id);
        if (data && form) {
          if (operate === 'delete') {
            data = { ...data, isDeleted: true } as unknown as schema.XForm;
          }
          form.setMetadata(data);
        }
        break;
      default:
        break;
    }
    return true;
  }
  viewReceive(operate: string, data: schema.XView): boolean {
    switch (operate) {
      case 'insert':
        {
          this.resource.viewColl.cache.push(data);
          this.views.push(ViewFactory.createView(data, this.directory));
        }
        break;
      case 'remove':
        this.resource.viewColl.removeCache((i) => i.id !== data.id);
        this.views = this.views.filter((a) => a.id !== data.id);
        break;
      case 'delete':
      case 'replace':
        var view = this.views.find((a) => a.id === data.id);
        if (data && view) {
          if (operate === 'delete') {
            data = { ...data, isDeleted: true } as unknown as schema.XView;
          }
          view.setMetadata(data);
        }
        break;
      default:
        break;
    }
    return true;
  }
  reportReceive(operate: string, data: schema.XReport): boolean {
    switch (operate) {
      case 'insert':
        {
          this.resource.reportColl.cache.push(data);
          this.reports.push(new Report(data, this.directory, this));
        }
        break;
      case 'remove':
        this.resource.reportColl.removeCache((i) => i.id !== data.id);
        this.reports = this.reports.filter((a) => a.id !== data.id);
        break;
      case 'delete':
      case 'replace':
        var form = this.reports.find((a) => a.id === data.id);
        if (data && form) {
          if (operate === 'delete') {
            data = { ...data, isDeleted: true } as unknown as schema.XReport;
          }
          form.setMetadata(data);
        }
        break;
      default:
        break;
    }
    return true;
  }
  printReceive(operate: string, data: schema.XPrint): boolean {
    switch (operate) {
      case 'insert':
        {
          this.resource.printColl.cache.push(data);
          this.prints.push(new Print(data, this.directory));
        }
        break;
      case 'remove':
        this.resource.printColl.removeCache((i) => i.id !== data.id);
        this.prints = this.prints.filter((a) => a.id !== data.id);
        break;
      case 'delete':
      case 'replace':
        var print = this.prints.find((a) => a.id === data.id);
        if (data && print) {
          if (operate === 'delete') {
            data = { ...data, isDeleted: true } as unknown as schema.XPrint;
          }
          print.setMetadata(data);
        }
        break;
      default:
        break;
    }
    return true;
  }
  documentReceive(operate: string, data: schema.XDocumentTemplate): boolean {
    switch (operate) {
      case 'insert':
        {
          this.resource.documentColl.cache.push(data);
          this.documents.push(new DocumentTemplate(data, this.directory));
        }
        break;
      case 'remove':
        this.resource.documentColl.removeCache((i) => i.id !== data.id);
        this.documents = this.documents.filter((a) => a.id !== data.id);
        break;
      case 'delete':
      case 'replace':
        var document = this.documents.find((a) => a.id === data.id);
        if (data && document) {
          if (operate === 'delete') {
            data = { ...data, isDeleted: true } as unknown as schema.XDocumentTemplate;
          }
          document.setMetadata(data);
        }
        break;
      default:
        break;
    }
    return true;
  }
  sequenceReceive(operate: string, data: schema.XSequence): boolean {
    switch (operate) {
      case 'insert':
        {
          this.sequences.push(new Sequence(data, this.directory));
        }
        break;
      case 'remove':
        this.sequences = this.sequences.filter((a) => a.id !== data.id);
        break;
      case 'delete':
      case 'replace':
        var sequence = this.sequences.find((a) => a.id === data.id);
        if (data && sequence) {
          if (operate === 'delete') {
            data = { ...data, isDeleted: true } as unknown as schema.XSequence;
          }
          sequence.setMetadata(data);
        }
        break;
      default:
        break;
    }
    return true;
  }

  /** 业务办事分类 */
  async toSpecies(dest: IDirectory): Promise<schema.XSpecies | undefined> {
    const ret = await dest.standard.createSpecies({
      name: this.metadata.name,
      code: this.metadata.code,
      remark: this.metadata.remark,
      icon: this.metadata.icon,
      tags: '应用分类',
      typeName: '分类',
      belongId: dest.belongId,
      shareId: dest.target.id,
    } as schema.XSpecies);
    if (ret) {
      const genSpeciesItem = async (species: ISpecies, app: IApplication) => {
        const toSpeciesItem = (target: schema.XApplication, parentId?: string) => {
          return {
            code: target.code,
            parentId: parentId,
            name: target.name,
            info: target.id,
            remark: target.name,
            icon: target.icon,
            belongId: dest.target.space.id,
            shareId: dest.target.id,
            typeName: '分类项',
          } as unknown as schema.XSpeciesItem;
        };
        const itemRet = await species.createItem(toSpeciesItem(app.metadata));
        if (itemRet) {
          const wroks = await app.loadWorks();
          for (const wrok of wroks) {
            await species.createItem(toSpeciesItem(wrok.metadata as any, itemRet.id));
          }
          for (const child of app.children) {
            await genSpeciesItem(species, child);
          }
        }
      };
      genSpeciesItem(new Species(ret, dest), this);
    }
    return;
  }
}
