import { Command, schema } from '@/ts/base';
import { IWork } from '../../../work';
import { IDirectory } from '../../directory';
import { StandardFileInfo } from '../../fileinfo';
import { IElementHost } from '@/ts/element/standard';
import { formatDate } from '@/utils';

export interface IDocumentTemplate extends IElementHost<schema.XDocumentTemplate> {
  /** 查找办事 */
  loadWork(workId: string): Promise<IWork | undefined>;
}

export class DocumentTemplate
  extends StandardFileInfo<schema.XDocumentTemplate>
  implements IDocumentTemplate
{
  constructor(_metadata: schema.XDocumentTemplate, _directory: IDirectory) {
    super(_metadata, _directory, _directory.resource.documentColl);
    this.command = new Command();
  }
  canDesign: boolean = true;
  command: Command;
  get cacheFlag() {
    return 'documents';
  }

  async copy(destination: IDirectory): Promise<boolean> {
    var newMetaData = {
      ...this.metadata,
      directoryId: destination.id,
      sourceId: this.metadata.sourceId ?? this.id,
    };
    if ('works' in destination) {
      newMetaData.applicationId = destination.id;
      destination = destination.directory;
      newMetaData.directoryId = destination.id;
    } else {
      newMetaData.applicationId = undefined;
    }
    
    if (this.isSameBelong(destination)) {
      return await this.duplicate(newMetaData, destination);
    } else {
      const data = await destination.resource.documentColl.replace(newMetaData);
      if (data) {
        return await destination.resource.documentColl.notity({
          data: data,
          operate: 'insert',
        });
      }        
    }
    return false;
  }

  async duplicate(newMetaData: schema.XDocumentTemplate, destination: IDirectory): Promise<boolean> {
    const uuid = formatDate(new Date(), 'yyyyMMddHHmmss');
    newMetaData.name = this.metadata.name + `-副本${uuid}`;
    newMetaData.code = this.metadata.code + uuid;
    newMetaData.id = 'snowId()';

    const data = await destination.resource.documentColl.replace(newMetaData);
    if (!data) {
      return false;
    }

    return await destination.resource.documentColl.notity({
      data: data,
      operate: 'insert',
    });
  }

  async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      var newData = {
        ...this.metadata,
        directoryId: destination.id,
      };
      if ('works' in destination) {
        newData.applicationId = destination.id;
        newData.directoryId = destination.directory.id;
      } else {
        newData.applicationId = undefined;
      }
      const data = await destination.resource.documentColl.replace(newData);
      if (data) {
        await this.directory.recorder.moving({
          coll: destination.resource.documentColl,
          destination: destination,
          next: data,
        });
        await this.notify('remove', this.metadata);
        return await destination.resource.documentColl.notity({
          data: data,
          operate: 'insert',
        });
      }
    }
    return false;
  }
  async loadWork(workId: string): Promise<IWork | undefined> {
    for (const app of await this.directory.target.directory.loadAllApplication()) {
      const work = await app.findWork(workId);
      if (work) {
        return work;
      }
    }
  }
}
