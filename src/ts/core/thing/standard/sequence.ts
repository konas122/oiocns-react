import { schema } from '@/ts/base';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
import { IDirectory } from '../..';
import { formatDate, getWeek } from '@/utils';
import message from '@/utils/message';

export interface ISequence extends IStandardFileInfo<schema.XSequence> {
  /** 生成序列号 */
  genValue(): Promise<string>;
}
export class Sequence extends StandardFileInfo<schema.XSequence> implements ISequence {
  constructor(_metadata: schema.XSequence, _directory: IDirectory) {
    super(_metadata, _directory, _directory.resource.sequenceColl);
  }
  get cacheFlag(): string {
    return 'sequence';
  }
  override allowCopy(destination: IDirectory): boolean {
    return ['应用', '模块'].includes(destination.typeName);
  }
  override allowMove(destination: IDirectory): boolean {
    return (
      this.metadata.applicationId != destination.id &&
      destination.target.belongId == this.target.belongId
    );
  }
  async copy(destination: IDirectory): Promise<boolean> {
    const sameBelong = this.isSameBelong(destination);
    if (this.allowCopy(destination)) {
      const newData = {
        ...this.metadata,
        applicationId: destination.id,
        value: this.metadata.initValue,
        directoryId: destination.directory.id,
        sourceId: this.metadata.sourceId ?? this.id,
      };
      destination = destination.directory;
      // 如果跨归属复制相同的序列，value值使用原序列的value
      if (!sameBelong) {
        const exitSequence = await destination.resource.sequenceColl.find([
          this.metadata.id,
        ]);
        if (exitSequence && exitSequence.length) {
          newData.value = exitSequence[0].value;
        }
      }
      if (sameBelong) {
        const uuid = formatDate(new Date(), 'yyyyMMddHHmmss');
        newData.name = this.metadata.name + `-副本${uuid}`;
        newData.code = this.metadata.code + uuid;
        newData.id = 'snowId()';
      }
      const data = await destination.resource.sequenceColl.replace(newData);
      if (data) {
        destination.resource.sequenceColl.notity({
          data: data,
          operate: 'insert',
        });
        return true;
      }
    }
    return false;
  }
  async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      var newData = {
        ...this.metadata,
        applicationId: destination.id,
        directoryId: destination.directory.id,
      };
      const data = await destination.resource.sequenceColl.replace(newData);
      if (data) {
        await this.recorder.moving({
          coll: destination.resource.sequenceColl,
          destination,
          next: data,
        });
        await this.notify('remove', this.metadata);
        return await destination.resource.sequenceColl.notity({
          data: data,
          operate: 'insert',
        });
      }
    }
    return false;
  }
  async genValue(): Promise<string> {
    const prefixZero = (num: number): string => {
      if (Number(num).toFixed().length > Number(this.metadata.length))
        return num.toString();
      return (Array(Number(this.metadata.length)).join('0') + num).slice(
        -Number(this.metadata.length),
      );
    };
    var reset = await this.resetValue();
    var curValue = this.metadata.initValue;
    if (!reset) {
      const ret = await this.coll.update(this.id, {
        _inc_: {
          value: this.metadata.increament,
        },
        _set_: {
          updateTime: 'sysdate()',
        },
      });
      if (ret) {
        curValue = ret?.value;
      } else {
        message.error('序列递增失败!');
        return '未知';
      }
    }
    return prefixZero(curValue || 0);
  }

  async resetValue(): Promise<boolean> {
    switch (this.metadata.circleOpt) {
      case 'time':
        {
          const ret = await this.coll.loadResult({
            options: {
              match: {
                id: this.id,
                resetTime: {
                  _lte_: 'sysdate()',
                },
              }
            },
          });
          if (ret.success && ret.data.length == 1) {
            var curSe = ret.data[0];
            var date = new Date(curSe.updateTime);
            var resetTime = new Date(this.metadata.resetTime ?? this.metadata.createTime);
            resetTime = date > resetTime ? date : resetTime;
            const weekMap = getWeek(resetTime);
            switch (this._metadata.conditionOpt) {
              case 'everyMounth': {
                {
                  var nextMouth = new Date(resetTime.setMonth(resetTime.getMonth() + 1));
                  var year = nextMouth.getFullYear();
                  var month = nextMouth.getMonth();
                  resetTime = new Date(
                    `${year.toString().padStart(4, '0')}-${month
                      .toString()
                      .padStart(2, '0')}-01 00:00:00`,
                  );
                }
                break;
              }
              case 'everyYear': {
                {
                  var year1 = resetTime.getFullYear() + 1;
                  resetTime = new Date(
                    `${year1.toString().padStart(4, '0')}-01-01 00:00:00`,
                  );
                }
                break;
              }
              case 'otherTime':
                {
                  resetTime = new Date(curSe.resetTime);
                }
                break;
              case 'everyWeek': {
                // Todo每周时间重置（设置resetTime 为下周一日期）
                // @ts-ignore
                resetTime = new Date(weekMap.get('next'));
                break;
              }
              default:
                // Todo每天时间重置（设置resetTime 为明日00:00:00）
                // @ts-ignore
                resetTime = new Date(weekMap.get('tomorrow'));
                break;
            }
            return await this.coll.updateMatch(
              {
                id: this.id,
                resetTime: {
                  _lte_: 'sysdate()',
                },
              },
              {
                _set_: {
                  value: curSe.initValue,
                  resetTime: this.formaData(resetTime),
                },
              },
            );
          }
        }
        break;
      case 'number': {
        return await this.coll.updateMatch(
          {
            match: {
              id: this.id,
              _lge_: {
                value: this.metadata.conditionValue,
              },
            },
          },
          {
            _set_: {
              value: this.metadata.initValue,
            },
          },
        );
      }
    }
    return false;
  }
  formaData(timer: Date) {
    const year = timer.getFullYear();
    const month = timer.getMonth() + 1; // 由于月份从0开始，因此需加1
    const day = timer.getDate();
    return `${this.pad(year, 4)}-${this.pad(month)}-${this.pad(day)} 00:00:00}`;
  }
  pad(timeEl: number, total = 2, str = '0') {
    return timeEl.toString().padStart(total, str);
  }
}
