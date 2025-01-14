import { schema } from '@/ts/base';
import { Emitter } from '@/ts/base/common';
import { ITarget } from '../..';
import { XCollection } from '../../public/collection';
import { IBelong } from '../../target/base/belong';
import { IMallTemplate } from '../../thing/standard/page/mallTemplate';

export interface IShoppingCar extends Emitter {
  /** 商城 */
  page: IMallTemplate;
  /** 平台 */
  target: ITarget;
  /** 买方 */
  space: IBelong;
  /** 商品 */
  products: schema.XProduct[];
  /** 放入购物车 */
  create(item: schema.XProduct): Promise<schema.XProduct | undefined>;
  /** 移除购物车 */
  remove(item: schema.XProduct): Promise<boolean>;
  /** 批量放入 */
  batchCreate(items: schema.XProduct[]): Promise<schema.XProduct[] | undefined>;
  /** 批量移除 */
  batchRemove(items: schema.XProduct[]): Promise<boolean>;
  /** 加载购物车 */
  loadProducts(reload?: boolean): Promise<schema.XProduct[]>;
}

export class ShoppingCar extends Emitter implements IShoppingCar {
  constructor(page: IMallTemplate) {
    super();
    this.target = page.directory.target;
    this.space = page.directory.target.space;
    this.page = page;
    this.coll = this.space.resource.shoppingCarColl;
    this.coll.unsubscribe(this.key);
    this.coll.subscribe([this.key], (data) => this.receive(data));
  }
  page: IMallTemplate;
  target: ITarget;
  space: IBelong;
  coll: XCollection<schema.XProduct>;
  loaded: boolean = false;
  products: schema.XProduct[] = [];
  get key() {
    return this.page.id + '-shopping-car';
  }
  async create(item: schema.XProduct): Promise<schema.XProduct | undefined> {
    item.mallId = this.page.id;
    const data = await this.coll.replace(item);
    if (data) {
      await this.coll.notity({ operate: 'create', data });
    }
    return data;
  }
  async batchCreate(items: schema.XProduct[]): Promise<schema.XProduct[] | undefined> {
    const _items = items.map((item) => {
      return {
        ...item,
        mallId: this.page.id,
      };
    });
    const data = await this.coll.replaceMany(_items);
    if (data) {
      await this.coll.notity({ operate: 'createMany', data });
    }
    return data;
  }
  async remove(data: schema.XProduct): Promise<boolean> {
    const result = await this.coll.remove(data);
    if (result) {
      await this.coll.notity({ operate: 'remove', data });
    }
    return result;
  }
  async batchRemove(items: schema.XProduct[]): Promise<boolean> {
    const result = await this.coll.removeMany(items);
    if (result) {
      await this.coll.notity({ operate: 'removeMany', data: items });
    }
    return result;
  }
  async loadProducts(reload?: boolean): Promise<schema.XProduct[]> {
    if (!this.loaded || reload) {
      this.loaded = true;
      this.products = await this.coll.load({
        options: { match: { mallId: this.page.id } },
      });
    }
    return this.products;
  }
  receive({ operate, data }: { operate: string; data: any }) {
    switch (operate) {
      case 'create':
        this.products = this.products.filter((item) => item.id != data.id);
        this.products.push(data);
        break;
      case 'remove':
        this.products = this.products.filter((item) => item.id != data.id);
        break;
      case 'createMany':
        data.forEach((item: schema.XProduct) => {
          if (!this.products.find((i: schema.XProduct) => i.id == item.id)) {
            this.products.push(item);
          }
        });
        break;
      case 'removeMany':
        this.products = this.products.filter((item) => {
          return data.find((i: schema.XProduct) => i.id == item.id) == undefined;
        });
        break;
    }
    this.changCallback();
  }
}
