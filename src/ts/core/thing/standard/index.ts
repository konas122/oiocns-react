import { model, schema } from '../../../base';
import { Directory, IDirectory } from '../directory';
import { IStandard } from '../fileinfo';
import { DataResource } from '../resource';
import { Application, IApplication } from './application';
import { Form, IForm } from './form';
import { IPrint, Print } from './print';
import { IPageTemplate, PageTemplate } from './page';
import { IProperty, Property } from './property';
import { ISpecies, Species } from './species';
import { ITransfer, Transfer } from './transfer';
import { DistributionTask, IDistributionTask } from './distributiontask';
import { IReportTree } from './reporttree';
import { ReportTree } from './reporttree/ReportTree';
import { MallTemplate } from './page/mallTemplate';
import { DocumentTemplate, IDocumentTemplate } from './document';
import { IBaseView } from './view/baseView';
import { ViewFactory } from './view/viewFactory';
import { IReport, Report } from './report';

export class StandardFiles {
  /** 目录对象 */
  directory: IDirectory;
  /** 表单 */
  forms: IForm[] = [];
  /** 表格 */
  reports: IReport[] = [];
  /** 视图 */
  views: IBaseView[] = [];
  //这里增加一个打印模板的类型和初始值
  print: IPrint[] = [];
  /** 迁移配置 */
  transfers: ITransfer[] = [];
  /** 属性 */
  propertys: IProperty[] = [];
  /** 分类字典 */
  specieses: ISpecies[] = [];
  /** 目录 */
  directorys: IDirectory[] = [];
  /** 应用 */
  applications: IApplication[] = [];
  /** 目录下级应用实体 */
  xApplications: schema.XApplication[] = [];
  /** 页面模板 */
  templates: IPageTemplate[] = [];
  /** 打印模板 */
  documents: IDocumentTemplate[] = [];
  /** 报表树 */
  reportTrees: IReportTree[] = [];
  /** 分发任务 */
  distributionTasks: IDistributionTask[] = [];
  /** 文件夹加载完成标志 */
  directoryLoaded: boolean = false;
  /** 表单加载完成标志 */
  formLoaded: boolean = false;
  /** 表格加载完成标志 */
  reportLoaded: boolean = false;
  /** 视图加载完成标识 */
  viewLoaded: boolean = false;
  /** 打印模板加载完成标志 */
  printLoaded: boolean = false;
  /** 应用加载完成标志 */
  applicationLoaded: boolean = false;
  /** 模板加载完成标志 */
  TemplateLoaded: boolean = false;
  /** 文档模板加载完成标志 */
  documentsLoaded: boolean = false;
  /** 迁移配置加载完成标志 */
  transfersLoaded: boolean = false;
  /** 分类字典加载完成标志 */
  speciesesLoaded: boolean = false;
  /** 属性加载完成标志 */
  propertysLoaded: boolean = false;
  /** 报表树加载完成标志 */
  reportTreesLoaded: boolean = false;
  /** 序列加载完成标志 */
  sequencesLoaded: boolean = false;
  /** 分发任务加载完成标志 */
  distributionTaskLoaded: boolean = false;
  constructor(_directory: IDirectory) {
    this.directory = _directory;
    if (this.directory.parent === undefined) {
      subscribeNotity(this.directory);
    }
  }
  get id(): string {
    return this.directory.directoryId;
  }
  get resource(): DataResource {
    return this.directory.resource;
  }
  get standardFiles(): IStandard[] {
    return [
      ...this.forms,
      ...this.reports,
      ...this.views,
      ...this.print,
      ...this.transfers,
      ...this.propertys,
      ...this.specieses,
      ...this.directorys,
      ...this.applications,
      ...this.templates,
      ...this.documents,
      ...this.reportTrees,
      ...this.distributionTasks,
    ];
  }
  async loadStandardFiles(reload: boolean = false): Promise<IStandard[]> {
    await Promise.all([
      this.loadForms(reload),
      this.loadReports(reload),
      this.loadViews(reload),
      this.loadApplications(reload),
      this.loadPropertys(reload),
      this.loadSpecieses(reload),
      this.loadTemplates(reload),
      this.loadDocuments(reload),
      this.loadReportTrees(reload),
      this.loadPrints(reload),
      this.loadTransfers(reload),
      this.loadDistributionTasks(reload),
    ]);
    return this.standardFiles as IStandard[];
  }
  async loadForms(reload: boolean = false): Promise<IForm[]> {
    if (this.formLoaded === false || reload) {
      this.formLoaded = true;
      const data = await this.resource.formColl.loadSpace({
        options: [
          { match: { directoryId: this.id, applicationId: { _exists_: false } } },
          {
            project: {
              attributes: 0,
            },
          },
        ],
      });
      this.forms = data.map((i) => {
        if (i.typeName === '视图' && !i.subTypeName) i.subTypeName = '表单';
        return new Form(i, this.directory);
      });
    }
    return this.forms;
  }
  async loadReports(reload: boolean = false): Promise<IReport[]> {
    if (this.reportLoaded === false || reload) {
      this.reportLoaded = true;
      const data = await this.resource.reportColl.loadSpace({
        options: [
          { match: { directoryId: this.id, applicationId: { _exists_: false } } },
          {
            project: {
              sheets: 0,
            },
          },
        ],
      });
      this.reports = data.map((i) => new Report(i, this.directory));
    }
    return this.reports;
  }
  async loadViews(reload: boolean = false): Promise<any[]> {
    if (this.viewLoaded === false || reload) {
      this.viewLoaded = true;
      const data = await this.resource.viewColl.loadSpace({
        options: [
          { match: { directoryId: this.id } },
          {
            project: {
              options: 0,
            },
          },
        ],
      });
      this.views = data.map((i) => ViewFactory.createView(i, this.directory));
    }
    return this.views;
  }
  async loadPrints(reload: boolean = false): Promise<IPrint[]> {
    if (this.printLoaded === false || reload) {
      this.printLoaded = true;
      const data = await this.resource.printColl.loadSpace({
        options: { match: { directoryId: this.id } },
      });
      this.print = data
        .filter((a) => a.applicationId == undefined)
        .map((i) => new Print(i, this.directory));
    }
    return this.print;
  }
  async loadPropertys(reload: boolean = false): Promise<IProperty[]> {
    if (this.propertysLoaded === false || reload) {
      this.propertysLoaded = true;
      const data = await this.resource.propertyColl.loadSpace({
        options: { match: { directoryId: this.id } },
      });
      this.propertys = data.map((i) => new Property(i, this.directory));
    }
    return this.propertys;
  }
  async loadSpecieses(reload: boolean = false): Promise<ISpecies[]> {
    if (this.speciesesLoaded === false || reload) {
      this.speciesesLoaded = true;
      const data = await this.resource.speciesColl.loadSpace({
        options: { match: { directoryId: this.id } },
      });
      this.specieses = data.map((i) => new Species(i, this.directory));
    }
    return this.specieses;
  }
  async loadTransfers(reload: boolean = false): Promise<ITransfer[]> {
    if (this.transfersLoaded === false || reload) {
      this.transfersLoaded = true;
      const data = await this.resource.transferColl.loadSpace({
        options: { match: { directoryId: this.id } },
      });
      this.transfers = data.map((i) => new Transfer(i, this.directory));
    }
    return this.transfers;
  }
  async loadApplications(reload: boolean = false): Promise<IApplication[]> {
    if (this.applicationLoaded === false || reload) {
      this.applicationLoaded = true;
      this.xApplications = this.resource.applicationColl.cache.filter(
        (i) => i.directoryId === this.id,
      );
      this.applications = this.xApplications
        .filter((a) => !(a.parentId && a.parentId.length > 5))
        .map((a) => new Application(a, this.directory, undefined, this.xApplications));
    }
    return this.applications;
  }
  async loadDirectorys(reload: boolean = false): Promise<IDirectory[]> {
    if (this.directoryLoaded === false || reload) {
      this.directoryLoaded = true;
      var dirs = this.resource.directoryColl.cache.filter(
        (i) => i.directoryId === this.id,
      );
      this.directorys = dirs.map(
        (a) => new Directory(a, this.directory.target, this.directory),
      );
      for (const dir of this.directorys) {
        await dir.standard.loadDirectorys();
      }
    }
    return this.directorys;
  }
  async loadTemplates(reload: boolean = false): Promise<IPageTemplate[]> {
    if (this.TemplateLoaded === false || reload) {
      this.TemplateLoaded = true;
      const data = await this.resource.templateColl.loadSpace({
        options: { match: { directoryId: this.id } },
      });
      this.templates = data.map((i) => {
        switch (i.typeName) {
          case '商城模板':
            return new MallTemplate(i, this.directory);
          case '空间模板':
            return new MallTemplate(i, this.directory);
          default:
            return new PageTemplate(i, this.directory);
        }
      });
    }
    return this.templates;
  }
  async loadDocuments(reload: boolean = false): Promise<IDocumentTemplate[]> {
    if (this.documentsLoaded === false || reload) {
      this.documentsLoaded = true;
      const data = await this.resource.documentColl.loadSpace({
        options: { match: { directoryId: this.id } },
      });
      this.documents = data.map((i) => new DocumentTemplate(i, this.directory));
    }
    return this.documents;
  }
  async loadReportTrees(reload: boolean = false): Promise<IReportTree[]> {
    if (this.reportTreesLoaded === false || reload) {
      this.reportTreesLoaded = true;
      const data = await this.resource.reportTreeColl.loadSpace({
        options: { match: { directoryId: this.id } },
      });
      this.reportTrees = data.map((i) => new ReportTree(i, this.directory));
    }
    return this.reportTrees;
  }
  async loadDistributionTasks(reload: boolean = false): Promise<IDistributionTask[]> {
    if (this.distributionTaskLoaded === false || reload) {
      this.distributionTaskLoaded = true;
      const data = await this.resource.distributionTaskColl.loadSpace({
        options: { match: { directoryId: this.id } },
      });
      this.distributionTasks = data.map((i) => new DistributionTask(i, this.directory));
    }
    return this.distributionTasks;
  }
  async createForm(data: schema.XForm): Promise<schema.XForm | undefined> {
    const result = await this.resource.formColl.insert({
      ...data,
      attributes: [],
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.formColl,
        next: result,
      });
      await this.resource.formColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createReport(data: schema.XReport): Promise<schema.XReport | undefined> {
    const result = await this.resource.reportColl.insert({
      ...data,
      attributes: [],
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.reportColl,
        next: result,
      });
      await this.resource.reportColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createView(data: schema.XView): Promise<schema.XView | undefined> {
    // console.log('createView', data);

    const result = await this.resource.viewColl.insert({
      ...data,
      attributes: [],
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.viewColl,
        next: result,
      });
      await this.resource.viewColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createPrint(data: schema.XPrint): Promise<schema.XPrint | undefined> {
    const result = await this.resource.printColl.insert({
      ...data,
      directoryId: this.id,
    });
    if (result) {
      await this.resource.printColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createSpecies(data: schema.XSpecies): Promise<schema.XSpecies | undefined> {
    const result = await this.resource.speciesColl.insert({
      ...data,
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.speciesColl,
        next: result,
      });
      await this.resource.speciesColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createProperty(data: schema.XProperty): Promise<schema.XProperty | undefined> {
    data.directoryId = this.id;
    const result = await this.resource.propertyColl.insert({
      ...data,
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.propertyColl,
        next: { ...result, typeName: '属性' },
      });
      await this.resource.propertyColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createTransfer(data: model.Transfer): Promise<model.Transfer | undefined> {
    const result = await this.resource.transferColl.insert({
      ...data,
      envs: [],
      nodes: [],
      edges: [],
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.transferColl,
        next: result,
      });
      await this.resource.transferColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createApplication(
    data: schema.XApplication,
  ): Promise<schema.XApplication | undefined> {
    const result = await this.resource.applicationColl.insert({
      ...data,
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.applicationColl,
        next: result,
      });
      await this.resource.applicationColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createTemplate(
    data: schema.XPageTemplate,
  ): Promise<schema.XPageTemplate | undefined> {
    const result = await this.resource.templateColl.insert({
      ...data,
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.templateColl,
        next: result,
      });
      await this.resource.templateColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createDocumentTemplate(
    data: schema.XDocumentTemplate,
  ): Promise<schema.XDocumentTemplate | undefined> {
    const result = await this.resource.documentColl.insert({
      ...data,
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.documentColl,
        next: result,
      });
      await this.resource.documentColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createReportTree(
    data: schema.XReportTree,
  ): Promise<schema.XReportTree | undefined> {
    const result = await this.resource.reportTreeColl.insert({
      ...data,
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.reportTreeColl,
        next: result,
      });
      await this.resource.reportTreeColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async createDistributionTask(
    data: schema.XDistributionTask,
  ): Promise<schema.XDistributionTask | undefined> {
    const result = await this.resource.distributionTaskColl.insert({
      ...data,
      directoryId: this.id,
    });
    if (result) {
      await this.directory.recorder.creating({
        coll: this.resource.distributionTaskColl,
        next: result,
      });
      await this.resource.distributionTaskColl.notity({
        data: result,
        operate: 'insert',
      });
      return result;
    }
  }
  async delete() {
    await Promise.all(this.standardFiles.map((item) => item.hardDelete()));
    const fileLinks = this.resource.fileLinkColl.cache.filter(
      (i) => i.directoryId === this.id,
    );
    await this.directory.resource.fileLinkColl.removeMany(fileLinks);
  }
  async moveStandradFile(resource: DataResource): Promise<void> {
    await this.loadStandardFiles();
    await resource.formColl.replaceMany(this.forms.map((a) => a.metadata));
    await resource.viewColl.replaceMany(this.views.map((a) => a.metadata));
    await resource.reportColl.replaceMany(this.reports.map((a) => a.metadata));
    await resource.printColl.replaceMany(this.print.map((a) => a.metadata));
    await resource.transferColl.replaceMany(this.transfers.map((a) => a.metadata));
    await resource.speciesColl.replaceMany(this.specieses.map((a) => a.metadata));
    await resource.propertyColl.replaceMany(this.propertys.map((a) => a.metadata));
    await resource.reportTreeColl.replaceMany(this.reportTrees.map((a) => a.metadata));
    await resource.documentColl.replaceMany(this.documents.map((a) => a.metadata));
  }
  async copyStandradFile(
    to: DataResource,
    directoryId: string,
    isSameBelong: boolean,
  ): Promise<void> {
    await this.loadStandardFiles();
    await to.formColl.replaceMany(
      this.forms.map((a) => {
        return { ...a.metadata, id: isSameBelong ? 'snowId()' : a.id, directoryId };
      }),
    );
    await to.viewColl.replaceMany(
      this.views.map((a) => {
        return { ...a.metadata, id: isSameBelong ? 'snowId()' : a.id, directoryId };
      }),
    );
    await to.printColl.replaceMany(
      this.print.map((a) => {
        return { ...a.metadata, id: isSameBelong ? 'snowId()' : a.id, directoryId };
      }),
    );
    await to.transferColl.replaceMany(
      this.transfers.map((a) => {
        return { ...a.metadata, id: isSameBelong ? 'snowId()' : a.id, directoryId };
      }),
    );
    await to.speciesColl.replaceMany(
      this.specieses.map((a) => {
        return { ...a.metadata, id: isSameBelong ? 'snowId()' : a.id, directoryId };
      }),
    );
    await to.propertyColl.replaceMany(
      this.propertys.map((a) => {
        return { ...a.metadata, id: isSameBelong ? 'snowId()' : a.id, directoryId };
      }),
    );
    await to.reportTreeColl.replaceMany(
      this.reportTrees.map((a) => {
        return { ...a.metadata, id: isSameBelong ? 'snowId()' : a.id, directoryId };
      }),
    );
    await to.documentColl.replaceMany(
      this.documents.map((a) => {
        return { ...a.metadata, id: isSameBelong ? 'snowId()' : a.id, directoryId };
      }),
    );
    if (!isSameBelong) {
      for (const species of this.specieses) {
        await species.loadItems();
        await to.speciesItemColl.replaceMany(species.items);
      }
      const nodes = await this.resource.reportTreeNodeColl.loadSpace({
        options: {
          match: {
            treeId: {
              _in_: this.reportTrees.map((a) => a.id),
            },
          },
        },
      });
      await to.reportTreeNodeColl.replaceMany(nodes);
    }
    // TODO 同归属拷贝
  }
}

/** 订阅标准文件变更通知 */
const subscribeNotity = (directory: IDirectory) => {
  directory.resource.formColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XForm>(directory, '表单', data);
  });
  directory.resource.reportColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XReport>(directory, '表格', data);
  });
  directory.resource.viewColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XView>(directory, '视图', data);
  });
  directory.resource.printColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XPrint>(directory, '打印模板', data);
  });
  directory.resource.directoryColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XDirectory>(directory, '目录', data);
  });
  directory.resource.propertyColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XProperty>(directory, '属性', data);
  });
  directory.resource.speciesColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XSpecies>(directory, '分类', data);
  });
  directory.resource.transferColl.subscribe([directory.key], (data) => {
    subscribeCallback<model.Transfer>(directory, '迁移', data);
  });
  directory.resource.applicationColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XApplication>(directory, '应用', data);
  });
  directory.resource.templateColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XPageTemplate>(directory, '模板', data);
  });
  directory.resource.documentColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XDocumentTemplate>(directory, '文档模板', data);
  });
  directory.resource.sequenceColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XPageTemplate>(directory, '序列', data);
  });
  directory.resource.reportTreeColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XReportTree>(directory, '报表树', data);
  });
  directory.resource.distributionTaskColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XDistributionTask>(directory, '任务', data);
  });
  directory.resource.shoppingCarColl.subscribe([directory.key], (data) => {
    subscribeCallback<schema.XMallTemplate>(directory, '购物车', data);
  });
};

/** 订阅回调方法 */
function subscribeCallback<T extends schema.XStandard>(
  directory: IDirectory,
  typeName: string,
  data?: { operate?: string; data?: T },
): boolean {
  if (data && data.operate && data.data) {
    const entity = data.data;
    const operate = data.operate;
    if (directory.id === entity.directoryId) {
      if (
        ['模块'].includes(entity.typeName) ||
        ('applicationId' in entity && (entity as any).applicationId)
      ) {
        for (const app of directory.standard.applications) {
          if (app.receive(operate, entity)) {
            return true;
          }
        }
        return false;
      }
      switch (operate) {
        case 'insert':
        case 'remove':
          standardFilesChanged(directory, typeName, operate, entity);
          break;
        case 'reload':
          directory.loadContent(true).then(() => {
            directory.changCallback();
          });
          return true;
        case 'reloadFiles':
          directory.loadFiles(true).then(() => {
            directory.changCallback();
            directory.sysDirectory.changCallback();
          });
          return true;
        default:
          directory.standard.standardFiles
            .find((i) => i.id === entity.id)
            ?.receive(operate, entity);
          break;
      }
      directory.changCallback();
      return true;
    }
    for (const subdir of directory.standard.directorys) {
      if (subscribeCallback(subdir, typeName, data)) {
        return true;
      }
    }
  }
  return false;
}

/** 目录中标准文件的变更 */
function standardFilesChanged(
  directory: IDirectory,
  typeName: string,
  operate: string,
  data: any,
): void {
  switch (typeName) {
    case '表单':
      directory.standard.forms = ArrayChanged(
        directory.standard.forms,
        operate,
        data,
        () => new Form(data, directory),
      );
      break;
    case '表格':
      directory.standard.reports = ArrayChanged(
        directory.standard.reports,
        operate,
        data,
        () => new Report(data, directory),
      );
      break;
    case '视图':
      directory.standard.views = ArrayChanged(
        directory.standard.views,
        operate,
        data,
        () => ViewFactory.createView(data, directory),
      );
      break;
    case '打印模板':
      directory.standard.print = ArrayChanged(
        directory.standard.print,
        operate,
        data,
        () => new Print(data, directory),
      );
      break;
    case '属性':
      directory.standard.propertys = ArrayChanged(
        directory.standard.propertys,
        operate,
        data,
        () => new Property(data, directory),
      );
      break;
    case '分类':
      directory.standard.specieses = ArrayChanged(
        directory.standard.specieses,
        operate,
        data,
        () => new Species(data, directory),
      );
      break;
    case '迁移':
      directory.standard.transfers = ArrayChanged(
        directory.standard.transfers,
        operate,
        data,
        () => new Transfer(data, directory),
      );
      break;
    case '报表树':
      directory.standard.reportTrees = ArrayChanged(
        directory.standard.reportTrees,
        operate,
        data,
        () => new ReportTree(data, directory),
      );
      break;
    case '任务':
      directory.standard.distributionTasks = ArrayChanged(
        directory.standard.distributionTasks,
        operate,
        data,
        () => new DistributionTask(data, directory),
      );
      break;
    case '模板':
    case '商城模板':
      directory.standard.templates = ArrayChanged(
        directory.standard.templates,
        operate,
        data,
        () => {
          switch (data.typeName) {
            case '商城模板':
              return new MallTemplate(data, directory);
            default:
              return new PageTemplate(data, directory);
          }
        },
      );
      break;
    case '文档模板':
      directory.standard.documents = ArrayChanged(
        directory.standard.documents,
        operate,
        data,
        () => new DocumentTemplate(data, directory),
      );
      break;
    case '目录':
      directory.standard.directorys = ArrayChanged(
        directory.standard.directorys,
        operate,
        data,
        () => new Directory(data, directory.target, directory),
      );
      if (operate === 'insert') {
        directory.resource.directoryColl.cache.push(data);
      } else {
        directory.resource.directoryColl.removeCache((i) => i.id != data.id);
      }
      break;
    case '应用':
      if (data.typeName === '模块') {
        directory.standard.applications.forEach((i) => i.receive(operate, data));
      } else {
        var modules: schema.XApplication[] = [];
        if ('children' in data && Array.isArray(data.children)) {
          modules = data.children as schema.XApplication[];
        }
        directory.standard.applications = ArrayChanged(
          directory.standard.applications,
          operate,
          data,
          () => new Application(data, directory, undefined, modules),
        );
        if (operate === 'insert') {
          directory.resource.applicationColl.cache.push(data, ...modules);
        } else {
          directory.resource.applicationColl.removeCache((i) => i.id != data.id);
        }
      }
      break;
  }
}

/** 数组元素操作 */
function ArrayChanged<T extends IStandard>(
  arr: T[],
  operate: string,
  data: schema.XStandard,
  create: () => T,
): T[] {
  if (operate === 'remove') {
    return arr.filter((i) => i.id != data.id);
  }
  if (operate === 'insert') {
    const index = arr.findIndex((i) => i.id === data.id);
    if (index > -1) {
      arr[index].setMetadata(data);
    } else {
      arr.push(create());
    }
  }
  return arr;
}
