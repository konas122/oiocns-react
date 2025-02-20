/* eslint-disable no-unused-vars */
import * as signalR from '@microsoft/signalr';
import { logger } from '../common';
import { IDisposable } from '../common/lifecycle';
import { badRequest, ResultType } from '../model';
import { TxtHubProtocol } from '../protocol';
import { createLogger } from '@microsoft/signalr/dist/esm/Utils';
/**
 * 存储层Hub
 */
export default class StoreHub implements IDisposable {
  // 超时重试时间
  private _timeout: number;
  // 是否已经启动
  private _isStarted: boolean;
  // http 请求客户端
  private _http: signalR.HttpClient;
  // signalr 连接
  private _connection: signalR.HubConnection;
  // 连接成功回调
  private _connectedCallbacks: (() => void)[];
  // 连接断开回调
  private _disconnectedCallbacks: ((err: Error | undefined) => void)[];
  /**
   * 构造方法
   * @param url signalr服务地址
   * @param timeout 超时检测默认8000ms
   * @param interval 心跳间隔默认3000ms
   */
  constructor(url: string, protocol = 'json', timeout = 10000, interval = 2000) {
    this._isStarted = false;
    this._timeout = timeout;
    this._connectedCallbacks = [];
    this._disconnectedCallbacks = [];
    let hubProtocol: signalR.IHubProtocol = new signalR.JsonHubProtocol();
    if (protocol == 'txt') {
      hubProtocol = new TxtHubProtocol();
    }
    const _logger = createLogger(signalR.LogLevel.Error);
    this._http = new signalR.DefaultHttpClient(_logger);
    this._connection = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .configureLogging(_logger)
      .withHubProtocol(hubProtocol)
      .build();
    this._connection.serverTimeoutInMilliseconds = timeout;
    this._connection.keepAliveIntervalInMilliseconds = interval;
    this._connection.onclose((err) => {
      if (this._isStarted) {
        this._disconnectedCallbacks.forEach((c) => {
          c.apply(this, [err]);
        });
        logger.warn(`连接断开,${this._timeout}ms后重试。` + (err ? err!.message : ''));
        setTimeout(() => {
          this._starting();
        }, this._timeout);
      }
    });
  }
  /**
   * 是否处于连接着的状态
   * @return {boolean} 状态
   */
  public get isConnected(): boolean {
    return (
      this._isStarted && this._connection.state === signalR.HubConnectionState.Connected
    );
  }
  // 获取accessToken
  public get accessToken(): string {
    return sessionStorage.getItem('accessToken') || '';
  }
  // 设置accessToken
  private set accessToken(val: string) {
    sessionStorage.setItem('accessToken', val);
  }
  /**
   * 销毁连接
   * @returns {Promise<void>} 异步Promise
   */
  public dispose(): Promise<void> {
    this._isStarted = false;
    this._connectedCallbacks = [];
    this._disconnectedCallbacks = [];
    return this._connection.stop();
  }
  /**
   * 启动链接
   * @returns {void} 无返回值
   */
  public start(): void {
    if (!this._isStarted) {
      this._isStarted = true;
      if (!this.isConnected) {
        this._starting();
      }
    }
  }
  /**
   * 重新建立连接
   * @returns {void} 无返回值
   */
  public async restart(): Promise<void> {
    if (this.isConnected) {
      this._isStarted = false;
      await this._connection.stop();
      setTimeout(() => {
        this.start();
      }, 1000);
    }
  }
  /**
   * 开始连接
   * @returns {void} 无返回值
   */
  private async _starting(): Promise<void> {
    this._connection
      .start()
      .then(() => {
        this._connectedCallbacks.forEach((c) => {
          c.apply(this, []);
        });
      })
      .catch((err) => {
        this._disconnectedCallbacks.forEach((c) => {
          c.apply(this, [err]);
        });
        setTimeout(() => {
          this._starting();
        }, this._timeout);
      });
  }
  /**
   * 连接成功事件
   * @param {Function} callback 回调
   * @returns {void} 无返回值
   */
  public onConnected(callback: () => void): void {
    if (callback) {
      this._connectedCallbacks.push(callback);
    }
  }
  /**
   * 断开连接事件
   * @param {Function} callback 回调
   * @returns {void} 无返回值
   */
  public onDisconnected(callback: (err: Error | undefined) => void): void {
    if (callback) {
      this._disconnectedCallbacks.push(callback);
    }
  }
  /**
   * 监听服务端方法
   * @param {string} methodName 方法名
   * @param {Function} newMethod 回调
   * @returns {void} 无返回值
   */
  public on(methodName: string, newMethod: (...args: any[]) => any): void {
    this._connection.on(methodName, newMethod);
  }
  /**
   * 请求服务端方法
   * @param {string} methodName 方法名
   * @param {any[]} args 参数
   * @returns {Promise<ResultType>} 异步结果
   */
  public invoke(methodName: string, ...args: any[]): Promise<ResultType<any>> {
    return new Promise((resolve) => {
      const success = (res: ResultType<any>) => {
        if (!res.success) {
          if (res.code === 401) {
            logger.unauth();
          } else if (res.msg != '' && !res.msg.includes('不在线') && !res.msg.includes('超时')) {
            if (methodName !== 'HttpForward') {
              logger.warn("请求出错:" + res.msg);
            }
          }
        }
        resolve(res);
      };
      const error = (reason: any) => {
        let msg = '请求异常';
        if (reason && reason.Error) {
          msg += ',' + reason.Error();
          logger.warn(msg);
        }
        resolve(badRequest(msg));
      };
      if (methodName === 'createTemporaryToken') {
        this.restRequest(
          'get',
          '/orginone/kernel/rest/createTemporaryToken',
          undefined,
        )
          .then(success)
          .catch(error);
      } else if (this.isConnected) {
        this._connection
          .invoke(methodName, ...args)
          .then(success)
          .catch(error);
      } else {
        this.restRequest(
          'post',
          '/orginone/kernel/rest/' + methodName.toLowerCase(),
          args.length > 0 ? args[0] : {},
        )
          .then(success)
          .catch(error);
      }
    });
  }
  /**
   * 向连接发送数据
   * @param {string} methodName 方法名
   * @param {any[]} args 参数
   * @returns {Promise<T|undefined>} 异步结果
   */
  public async send<T>(methodName: string, ...args: any[]): Promise<T | undefined> {
    if (this.isConnected) {
      return await this._connection.invoke(methodName, ...args);
    }
  }
  /**
   * Http请求服务端方法
   * @param {string} methodName 方法名
   * @param {any[]} args 参数
   * @returns {Promise<ResultType>} 异步结果
   */
  public async restRequest(
    method: string,
    url: string,
    args: any,
  ): Promise<ResultType<any>> {
    const res = await this._http.send({
      url: url,
      timeout: 30000,
      method: method,
      content: JSON.stringify(args),
      headers: {
        Authorization: this.accessToken,
      },
    });
    if (res.statusCode === 200 && typeof res.content === 'string') {
      return JSON.parse(res.content.replace(/"_id":/gm, '"id":'));
    } else {
      return badRequest(res.statusText, res.statusCode);
    }
  }
}
