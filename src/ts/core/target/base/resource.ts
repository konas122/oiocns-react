import { schema } from '@/ts/base';

class TargetResource {
  private loadedTargetIds: string[];
  private membersMap: Map<string, schema.XTarget[]>;
  constructor() {
    this.loadedTargetIds = [];
    this.membersMap = new Map<string, schema.XTarget[]>();
  }
  loaded(targetId: string): boolean {
    return this.loadedTargetIds.includes(targetId);
  }
  setLoaded(targetId: string) {
    if (!this.loaded(targetId)) {
      this.loadedTargetIds = [targetId, ...this.loadedTargetIds];
    }
  }
  members(targetId: string): schema.XTarget[] {
    return this.membersMap.get(targetId) || [];
  }
  pullMembers(targetId: string, members: schema.XTarget[]) {
    members = members.filter((i) => this.members(targetId).every((j) => i.id != j.id));
    this.membersMap.set(targetId, [...this.members(targetId), ...members]);
  }
  removeMembers(targetId: string, members: schema.XTarget[]) {
    this.membersMap.set(
      targetId,
      this.members(targetId).filter((i) => members.every((j) => i.id != j.id)),
    );
  }
  clear(targetId: string) {
    this.membersMap.delete(targetId);
  }
}

export default new TargetResource();
