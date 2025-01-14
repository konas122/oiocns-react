import { model } from '@/ts/base';
import { DataProvider } from '.';
import { IFile, ITarget, XObject } from '..';
import { IBelong } from '../target/base/belong';
import { Xbase } from '@/ts/base/schema';
import { AuthApps } from '../public/consts';

/** 主页方法提供者 */
export class HomeProvider {
  private userId: string;
  private data: DataProvider;
  private cacheObj: XObject<Xbase>;
  private selectSpace: IBelong;
  public homeConfig: model.HomeConfig;
  private cacheCommons: Map<string, IFile[]>;
  constructor(_data: DataProvider) {
    this.data = _data;
    this.userId = _data.user!.id;
    this.cacheObj = _data.user!.cacheObj;
    this.selectSpace = _data.user!;
    this.homeConfig = { tops: [] };
    this.cacheCommons = new Map();
  }
  get isUser(): boolean {
    return this.current.id === this.userId;
  }
  get spaces(): IBelong[] {
    return [this.data.user!.user, ...this.data.user!.companys];
  }
  get current(): IBelong {
    return this.selectSpace;
  }
  commentsFlag(belong?: IBelong): string {
    belong = belong ?? this.current;
    return belong.id === this.userId ? '_commons' : `_${belong.id}commons`;
  }
  targets(belong?: IBelong): ITarget[] {
    belong = belong ?? this.current;
    return belong.id === this.userId ? this.data.targets : belong.targets;
  }
  async switchSpace(space: IBelong) {
    this.selectSpace = space;
    this.cacheObj.set('homeLastSpaceId', space.id);
    this.homeConfig = (await this.current.cacheObj.get('homeConfig')) || { tops: [] };
  }
  findLastSpace(lastSpaceId: string): IBelong | undefined {
    return this.spaces.find(i => i.id === lastSpaceId)
  }
  async loadConfig(): Promise<void> {
    const lastSpaceId = await this.cacheObj.get<string>('homeLastSpaceId');
    if (lastSpaceId) {
      const lastSpace = this.findLastSpace(lastSpaceId)
      if (lastSpace) {
        this.selectSpace = lastSpace
      }
    }
    const cache = await this.current.cacheObj.get<model.HomeConfig>('homeConfig');
    if (cache?.tops) {
      this.homeConfig = cache;
    }
  }
  async switchTops(id: string) {
    const isSave = this.homeConfig.tops?.find((i) => i === id);
    if (!!isSave) {
      this.homeConfig.tops = this.homeConfig.tops.filter((i) => i !== id);
    } else {
      this.homeConfig.tops.push(id);
    }
    const value = await this.current.cacheObj.set('homeConfig', this.homeConfig);
    if (value) {
      await this.current.cacheObj.notity('homeConfig', this.homeConfig);
      return true;
    }
    return false;
  }

  async getTops(_homeConfig?: model.HomeConfig): Promise<IFile[]> {
    const commons = this.cacheCommons.get(this.current.id) || [];
    const tops = _homeConfig ? _homeConfig.tops : this.homeConfig.tops;
    return commons.filter((i) => tops?.includes(i.id));
  }

  async loadCommons(belong?: IBelong): Promise<IFile[]> {
    const files: IFile[] = [];
    belong = belong ?? this.current;
    for (const item of belong.commons) {
      const target = this.targets(belong).find(
        (i) => i.id === item.targetId && i.spaceId === item.spaceId,
      );
      if (target) {
        const file = await target.directory.searchComment(item);
        if (file) {
          const isShow = AuthApps.includes(file.typeName) ? file.isAuth : true
          if (isShow) {
            if (file.groupTags.includes('已删除')) {
              belong.updateCommon(item, false);
            } else {
              files.push(file);
            }
          }
        }
      }
    }
    this.cacheCommons.set(belong.id, files);
    await this.current.cacheObj.notity('homeConfig', await this.homeConfig);
    return files;
  }
}
