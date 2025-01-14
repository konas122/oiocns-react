import { model, schema } from '@/ts/base';
import { IShoppingCar, ShoppingCar } from '@/ts/core/work/shop/shoppingCar';
import { BaseTemplate, IPageTemplate } from '.';
import { IDirectory } from '../../directory';
import { Form, IForm } from '../form';
import { Binding } from '@/ts/base/schema';
import { IWork } from '@/ts/core';

type NullableCtn = schema.MallContent | undefined;

export interface IMallTemplate extends IPageTemplate<NullableCtn> {
  /** 购物车 */
  shoppingCar: IShoppingCar;
  /** 加载常规表单 */
  loadForm(): Promise<IForm | undefined>;
  /** 加载热度表单 */
  loadHot(): Promise<IForm | undefined>;
  /** 加载办事 */
  findWork(): Promise<IWork[] | undefined>;
  /** 加载借用办事 */
  findBorrow(): Promise<IWork | undefined>;
}

export class MallTemplate extends BaseTemplate<NullableCtn> implements IMallTemplate {
  constructor(_metadata: schema.XMallTemplate, _directory: IDirectory) {
    super(_metadata, _directory);
    this.shoppingCar = new ShoppingCar(this);
  }
  shoppingCar: IShoppingCar;
  isLoadWork: boolean = false;
  works: IWork[] | undefined;
  async loadForm(): Promise<IForm | undefined> {
    if (this.params?.form) {
      return await this.searchForm(this.params.form);
    }
  }
  async loadHot(): Promise<IForm | undefined> {
    if (this.params?.hot) {
      return await this.searchForm(this.params.hot);
    }
  }
  async searchForm(form: Binding): Promise<IForm | undefined> {
    const { directoryId, applicationId, id } = form;
    await this.directory.loadDirectoryResource();
    let file = await this.directory.searchFile(directoryId, applicationId, id);
    if (file) {
      let form = new Form(file.metadata as schema.XForm, file.directory);
      await form.loadContent();
      for (const item of form.fields) {
        if (item.speciesId && item.lookups && item.lookups.length > 0) {
          let parent: model.FiledLookup = {
            id: item.id + '-' + item.speciesId,
            code: item.code,
            info: item.code,
            text: item.name,
            value: item.code,
          };
          item.lookups.forEach((lookup) => {
            lookup.id = item.id + '-' + lookup.id;
            if (!lookup.parentId) {
              lookup.parentId = parent.id;
            } else {
              lookup.parentId = item.id + '-' + lookup.parentId;
            }
          });
          item.lookups.push(parent);
        }
      }
      return form;
    }
  }
  async findWork(): Promise<IWork[] | undefined> {
    if (!this.isLoadWork) {
      if (this.params?.work) {
        let xWorks = !Array.isArray(this.params?.work)
          ? [this.params?.work]
          : this.params?.work;
        const works = await Promise.all(
          xWorks.map(async (work) => {
            const _work = await this.loadWork(work.id);
            await _work?.loadNode();
            return _work;
          }),
        );
        return works.filter((i) => i) as IWork[];
      }
      this.isLoadWork = true;
    } else {
      return this.works;
    }
  }
  async findBorrow(): Promise<IWork | undefined> {
    if (this.params?.borrow) {
      const work = await this.loadWork(this.params.borrow.id);
      await work?.loadNode();
      return work;
    }
  }
}
