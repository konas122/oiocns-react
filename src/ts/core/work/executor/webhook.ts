import { kernel, model } from '@/ts/base';
import Ajv from 'ajv';
import { Executor } from '.';
import { FormData } from './index';
import { WebhookExecutor } from '@/ts/base/model';

const ajv = new Ajv();
const object = {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
  patternProperties: {
    '^\\d+': {
      anyOf: [{ type: 'string' }, { type: 'number' }],
    },
  },
  additionalProperties: false,
};
const schema = {
  type: 'object',
  patternProperties: {
    '^\\d+$': {
      type: 'object',
      properties: {
        before: {
          type: 'array',
          items: object,
        },
        after: {
          type: 'array',
          items: object,
        },
        nodeId: { type: 'string' },
        creator: { type: 'string' },
        createTime: { type: 'string' },
      },
    },
  },
  additionalProperties: false,
};

/**
 * 外部链接
 */
export class Webhook extends Executor<WebhookExecutor> {
  async execute(data: FormData): Promise<boolean> {
    this.changeProgress(0);
    const work = await this.task.loadWork(
      this.task.taskdata.defineId,
      this.task.taskdata.defineShareId || this.task.taskdata.shareId,
    );
    const result = await kernel.httpForward({
      uri: this.metadata.hookUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      content: JSON.stringify({
        work: work?.metadata,
        taskData: this.task.taskdata,
        person: kernel.user,
        belong: this.task.belong.metadata,
        instanceData: this.task.instanceData,
      }),
    });
    if (result.success) {
      await this.writeBack(data, result);
    }
    this.changeProgress(100);
    return true;
  }
  async writeBack(
    data: FormData,
    result: model.ResultType<model.HttpResponseType>,
  ): Promise<void> {
    await this.task.loadInstance();
    try {
      const validate = ajv.compile(schema);
      const content = JSON.parse(result.data.content);
      if (validate(content)) {
        const value: { [key: string]: model.FormEditData } = content as any;
        for (const entry of Object.entries(value)) {
          for (const item of entry[1].after) {
            const belongId = this.task.belong.metadata.id;
            const result = await kernel.createThing(belongId, [belongId], item.name);
            if (result.data.length > 0) {
              Object.assign(item, result.data[0]);
            }
          }
          data.set(entry[0], entry[1]);
          if (this.task.instanceData?.data) {
            this.task.instanceData.data[entry[0]] = [entry[1]];
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
