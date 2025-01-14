import { IPerson, Person } from '../target/person';
import { command, common, schema } from '../../base';
import { IWorkProvider, WorkProvider } from '../work/provider';
import { AuthProvider } from './auth';
import { ITarget } from '../target/base/target';
import { HomeProvider } from './home';

/** 当前用户提供层 */
export class DataProvider {
  private _auth: AuthProvider;
  private _inited: boolean = false;
  private _emiter: common.Emitter;
  private _user: IPerson | undefined;
  private _work: IWorkProvider | undefined;
  private _home: HomeProvider | undefined;
  constructor(emiter: common.Emitter) {
    this._emiter = emiter;
    this._auth = new AuthProvider(async (data) => {
      await this._loadUser(data);
    });
  }
  /** 授权方法 */
  get auth(): AuthProvider {
    return this._auth;
  }
  /** 当前用户 */
  get user(): IPerson | undefined {
    return this._user;
  }
  /** 办事提供层 */
  get work(): IWorkProvider | undefined {
    return this._work;
  }
  /** 主页提供层 */
  get home(): HomeProvider | undefined {
    return this._home;
  }
  /** 是否完成初始化 */
  get inited(): boolean {
    return this._inited;
  }
  /** 所有相关的用户 */
  get targets(): ITarget[] {
    const targets: ITarget[] = [];
    if (this._user) {
      targets.push(...this._user.targets);
      for (const company of this._user.companys) {
        targets.push(...company.targets);
      }
    }
    return targets;
  }
  /** 加载用户 */
  private async _loadUser(person: schema.XTarget) {
    this._user = new Person(person);
    this._work = new WorkProvider(this);
    this._home = new HomeProvider(this);
    this.refresh();
  }
  /** 重新加载数据 */
  public async refresh() {
    this._inited = false;
    await this._user!.deepLoad(true);
    await this._home!.loadConfig();
    this._inited = true;
    this._emiter.changCallback();
    command.emitterFlag('', true);
  }
}
