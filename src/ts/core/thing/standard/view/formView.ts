import { model } from '@/ts/base';
import { LoadOptions, LoadResult } from '@/ts/base/model';
import { XThing } from '@/ts/base/schema';
import { ReportTree } from '../reporttree/ReportTree';
import { IBaseView, BaseView } from './baseView';

export interface IFormView extends IBaseView {
  allowView: boolean;
  _treeLoaded: boolean;
  /** 加载组织菜单 */
  _speciesLoaded: boolean;
  //成员树
  memberTree: any[];
  /** 组织树 */
  organizationTree: any[];
  /** 加载组织菜单 */
  loadNodeTree(): Promise<any[]>;
  /** 加载分类菜单 */
  loadSpeciesMenu(): Promise<any[]>;
  /** 查询表数据 */
  loadThing(loadOptions: LoadOptions<XThing>): Promise<LoadResult<XThing[]>>;
}
/** 表单视图 */
export class FormView extends BaseView implements IFormView {
  _treeLoaded: boolean = false;
  memberTree: any[] = [];
  organizationTree: any[] = [];
  _memberTreeLoaded = false;
  _speciesLoaded = false;
  get spaceId(): string {
    return this.directory.spaceId;
  }
  get treeId(): string {
    return this.metadata.options?.organizationTree || '';
  }
  get allowView(): boolean {
    return (
      this.directory.target.belongId !== this.spaceId &&
      this.metadata.options?.allowMemberView !== true
    );
  }

  override async loadContent() {
    await this.load();
    await this.loadFields();
    return true;
  }

  async loadNodeTree(reload = false) {
    if (!this._treeLoaded || reload) {
      const treeInfo = await this.directory.resource.reportTreeColl.find([this.treeId!]);
      if (Array.isArray(treeInfo) && treeInfo.length > 0) {
        const _field = treeInfo[0];
        const treeCurrent = new ReportTree(_field, this.directory);
        let nodes = await treeCurrent.loadNodes();
        const root = nodes.find((n) => {
          if (_field.belongId == this.spaceId) {
            return n.id == _field.rootNodeId;
          }
          return n.targetId == this.spaceId;
        });
        if (!root) return [];
        nodes.forEach((n: any) => {
          n['rootCode'] = root.code;
          n['typeName'] = '组织树';
        });
        this.organizationTree = await treeCurrent.loadSubTree(root);
      }
      this._treeLoaded = true;
    }

    return this.organizationTree;
  }
  //加载集群成员/单位组织 树
  async loadMemberTree() {
    if (this.isGroupSpace) {
      //加载 成员
      console.log('加载成员');
    }
    //成员树
    return [];
  }
  async loadSpeciesMenu() {
    const result = [];
    let treeNodes = [];
    this.changCallback('view', 'treeLoading', true);
    if (this.treeId) {
      treeNodes = await this.loadNodeTree();
    } else {
      treeNodes = await this.loadMemberTree();
    }
    treeNodes.length > 0 && result.push(...treeNodes);

    for (const filed of this.fields.filter((i) => i.options?.species)) {
      const rootCode = filed.options?.viewFilterKey || filed.code;
      let item = {
        ...filed,
        rootCode,
        checkable: false,
        children: [],
        typeName: '分类项',
      };
      this.loopLookups(item, filed.lookups ?? []);
      result.push(item);
    }
    this.changCallback('view', 'treeLoading', false);
    return result;
  }
  loopLookups(node: any, lookups: model.FiledLookup[], pid?: string) {
    const children = lookups.filter((i) => i.parentId == (pid ? pid : void 0));
    if (children.length > 0) {
      node.children = children.map((item) => ({
        rootCode: node.rootCode,
        name: item.text,
        id: item.id,
        checkable: false,
        parentId: pid,
        value: item.value,
        children: [],
        typeName: '分类项',
      }));
      node.children.forEach((i: any) => this.loopLookups(i, lookups, i.id));
    }
  }

  override async loadThing(loadOptions: LoadOptions): Promise<LoadResult<any>> {
    loadOptions = loadOptions || {};
    loadOptions.filter = this.parseFilter(loadOptions?.filter ?? []);
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = loadOptions.options.match || {};
    loadOptions.options.match.isDeleted = false;
    loadOptions.options.match = { ...loadOptions.options.match, ...this.parseClassify() };
    //虚拟列
    if (this.fields.some((item) => item.id.includes('virtualColumn'))) {
      loadOptions.formId = this.id;
    }
    //办事查询
    if (this.viewType === 'work') {
      loadOptions.options = Object.assign(loadOptions.options, {
        project: {
          data: 0,
          records: 0,
        },
      });
    }
    // 没有过滤条件，没有分类条件
    if (!loadOptions.filter?.length && Object.keys(this.parseClassify()).length === 0) {
      return { data: [], totalCount: 0 } as any;
    }
    const res = await this.thingColl.loadResult(this.updataSort(loadOptions));
    res.data = Array.isArray(res.data) ? res.data : [];
    res.totalCount = res.totalCount ?? 0;
    res.groupCount = res.groupCount ?? 0;
    return res;
  }
}
