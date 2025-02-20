import { kernel, model, schema } from '../../base';

/** 授权方法提供者 */
export class AuthProvider {
  // 授权成功事件
  private onAuthed: (user: schema.XTarget) => Promise<void>;
  constructor(authed: (user: schema.XTarget) => Promise<void>) {
    this.onAuthed = authed;
    kernel.tokenAuth().then(async (success) => {
      if (success) {
        await this.onAuthed(kernel.user!);
      }
    });
  }
  /**
   * 获取动态密码
   * @param {RegisterType} params 参数
   */
  public async dynamicCode(
    params: model.DynamicCodeModel,
  ): Promise<model.ResultType<model.DynamicCodeModel>> {
    return await kernel.auth<model.DynamicCodeModel>('DynamicPwd', params);
  }
  /**
   * 根据权限发送提醒
   * @param {RegisterType} params 参数
   */
  public async sendNotice(params: model.NoticeModel): Promise<model.ResultType<boolean>> {
    return await kernel.auth<boolean>('SendNotice', params);
  }
  /**
   * 登录
   * @param {RegisterType} params 参数
   */
  public async login(
    params: model.LoginModel,
  ): Promise<model.ResultType<model.TokenResultModel>> {
    let res = await kernel.auth<model.TokenResultModel>('Login', params);
    if (res.success) {
      await this.onAuthed(res.data.target);
    }
    return res;
  }
  /**
   * 注册用户
   * @param {RegisterType} params 参数
   */
  public async register(
    params: model.RegisterModel,
  ): Promise<model.ResultType<model.TokenResultModel>> {
    let res = await kernel.auth<model.TokenResultModel>('Register', params);
    if (res.success) {
      await this.onAuthed(res.data.target);
    }
    return res;
  }
  /**
   * 变更密码
   * @param account 账号
   * @param password 密码
   * @param privateKey 私钥
   * @returns
   */
  public async resetPassword(
    params: model.ResetPwdModel,
  ): Promise<model.ResultType<model.TokenResultModel>> {
    let res = await kernel.auth<model.TokenResultModel>('ResetPwd', params);
    if (res.success) {
      await this.onAuthed(res.data.target);
    }
    return res;
  }
}
