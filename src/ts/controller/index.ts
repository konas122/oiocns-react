import {
  IApplication,
  IPrint,
  IFile,
  IPerson,
  ISession,
  ITarget,
  TargetType,
  DataProvider,
} from '@/ts/core';
import { common } from '@/ts/base';
import { IWorkProvider } from '../core/work/provider';
import { IPageTemplate } from '../core/thing/standard/page';
import { AuthProvider } from '../core/provider/auth';
import { IReception } from '../core/work/assign/reception';
import { HomeProvider } from '../core/provider/home';
import { XPrint } from '@/ts/base/schema';
/** 控制器基类 */
export class Controller extends common.Emitter {
  public currentKey: string;
  constructor(key: string) {
    super();
    this.currentKey = key;
  }
}
/**
 * 设置控制器
 */
class IndexController extends Controller {
  static _data: DataProvider;
  constructor() {
    super('');
  }
  /** 是否已登录 */
  get logined(): boolean {
    return this.data.user != undefined;
  }
  /** 数据提供者 */
  get data(): DataProvider {
    if (IndexController._data === undefined) {
      IndexController._data = new DataProvider(this);
    }
    return IndexController._data;
  }
  /** 授权方法 */
  get auth(): AuthProvider {
    return this.data.auth;
  }
  /** 当前用户 */
  get user(): IPerson {
    return this.data.user!;
  }
  /** 办事提供者 */
  get work(): IWorkProvider {
    return this.data.work!;
  }
  /** 主页提供者 */
  get home(): HomeProvider {
    return this.data.home!;
  }
  /** 所有相关的用户 */
  get targets(): ITarget[] {
    return this.data.targets;
  }
  /** 退出 */
  exit(): void {
    sessionStorage.clear();
    IndexController._data = new DataProvider(this);
  }
  async loadApplications(): Promise<IApplication[]> {
    const apps: IApplication[] = [];
    for (const directory of this.targets
      .filter((i) => i.session.isMyChat && i.typeName != TargetType.Group)
      .map((a) => a.directory)) {
      apps.push(...(await directory.loadAllApplication()));
    }
    return apps;
  }
  /** 加载所有当前成员能获取的打印模板 */
  async loadPrint(): Promise<XPrint[]> {
    const prints: XPrint[] = [];
    for (const directory of this.targets
      .filter((i) => i.session.isMyChat)
      .map((a) => a.directory)) {
      prints.push(...(await directory.directory.resource.printColl.all()));
    }
    return prints;
  }
  /** 查找具体打印模板 */
  async loadFindPrint(id: string, shareId?: string): Promise<XPrint | boolean> {
    let print;
    const prints = await this.loadPrint();
    // 1、先根据id查找，如果id相同返回的打印模板数量只有一个，那么直接返回这个打印模板即可
    if (prints.filter((i) => i.id == id).length == 1) {
      print = prints.filter((i) => i.id == id)[0];
    } else {
      if (shareId) {
        //2、如果返回的有多个id相同的打印模板(多单位复制同一个打印模板的情况)，那么根据传入的办事的shareId查找匹配相同分享空间内的打印模板
        print = prints.filter((i) => i.id == id).filter((i) => i.shareId == shareId)[0];
      } else {
        //3、如果返回有多个id相同的打印模板，并且没有传入的办事的shareId，那么返回第一个打印模板
        print = prints.filter((i) => i.id == id)[0];
      }
    }
    return print ?? false;
  }
  /** 加载当前单位下的全部打印模板文件用做更新当前办事所绑定的列表 */
  async loadAllFindIPrint(belongId: string): Promise<IPrint[]> {
    const prints: IPrint[] = [];
    for (const directory of this.targets
      .filter((i) => i.session.isMyChat)
      .map((a) => a.directory)) {
      if (directory.belongId == belongId) {
        prints.push(...(await directory.loadAllPrints()));
        break;
      }
    }
    return prints;
  }
  /** 加载当前单位下的预算一体化=>打印模板（目录）=>打印模板文件 */
  async loadAllDefaultIPrint(belongId: string): Promise<string[]> {
    const ids = [];
    for (const directory of this.targets
      .filter((i) => i.session.isMyChat)
      .map((a) => a.directory)) {
      if (directory.belongId == belongId) {
        const defaultPrint = directory.children.filter(
          (item) =>
            !item.groupTags.includes('已删除') && item.name.includes('预算一体化'),
        );
        if (defaultPrint.length > 0) {
          const defaultPrintContent = defaultPrint[0].children?.filter((item) =>
            item.name.includes('打印模板'),
          );
          defaultPrintContent.length > 0 &&
            ids.push(defaultPrint[0].id, defaultPrintContent[0].id);
        }
        break;
      }
    }
    return ids && ids;
  }
  /** 加载所有常用 */
  async loadCommons(): Promise<IFile[]> {
    if (this.home) {
      const files = await Promise.all(
        this.home.spaces.map((belong) => {
          return this.home.loadCommons(belong);
        }),
      );
      return files.flat();
    }
    return [];
  }
  /** 所有相关会话 */
  get chats(): ISession[] {
    const chats: ISession[] = [];
    if (this.data.user) {
      chats.push(...this.data.user.chats);
      for (const company of this.data.user.companys) {
        chats.push(...company.chats);
      }
    }
    return chats;
  }
  /** 所有相关页面 */
  async loadPages(): Promise<IPageTemplate[]> {
    const pages: IPageTemplate[] = [];
    for (const directory of this.targets.map((t) => t.directory)) {
      const templates = await directory.loadAllTemplate();
      pages.push(...templates.filter((item) => item.metadata.public));
    }
    return pages;
  }
  /** 加载所有接收任务 */
  async loadReceptions(): Promise<IReception[]> {
    const tasks: IReception[] = [];
    // 兼容旧数据
    // for (const belong of [this.user, ...this.user.companys]) {
    //   let belongTasks = await belong.loadTasks(true);
    //   for (const task of belongTasks) {
    //     if (task.metadata.thingId) {
    //       tasks.push(task);
    //       continue;
    //     }
    //     const publicColl = task.group.resource.genTargetColl<schema.XReception>(
    //       '-' + belong.resource.receptionColl.collName,
    //     );
    //     let promise = await belong.loadGroupTasks(publicColl, task.id);
    //     if (promise.length >= 1) {
    //       tasks.push(promise[0]);
    //     } else {
    //       tasks.push(task);
    //     }
    //   }
    // }
    const taskPromises = this.user.companys.map((belong) => belong.loadPublicTasks(true));
    const taskResults = await Promise.all(taskPromises);
    tasks.push(...taskResults.flat());
    tasks.sort((a, b) => {
      return (
        new Date(b.metadata.period).getTime() - new Date(a.metadata.period).getTime()
      );
    });
    return tasks;
  }
}

export default new IndexController();
