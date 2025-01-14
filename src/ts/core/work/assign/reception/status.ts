import { ReceptionStatusModel } from '@/ts/base/model';

export type ReceptionStatus =
  | 'empty'
  | 'received'
  | 'submitted'
  | 'finished'
  | 'rejected'
  | 'changed';

export interface ReceptionStatusInfo {
  status: AllReceptionStatus;
  label: string;
  color: string;
}

export type AllReceptionStatus = ReceptionStatus | 'total';

export type ReportTaskTreeSummary = {
  [P in AllReceptionStatus]: number;
};

export const statusList: ReceptionStatusInfo[] = [
  { status: 'empty', label: '未接收', color: '' },
  { status: 'received', label: '已接收', color: 'processing' },
  { status: 'submitted', label: '已上报', color: 'warning' },
  { status: 'finished', label: '已完结', color: 'success' },
  { status: 'rejected', label: '已退回', color: 'error' },
  { status: 'changed', label: '已变更', color: 'warning' },
];

const antdColorMap: Dictionary<string> = {
  processing: '#4984e4',
  success: '#389e0d',
  error: '#f76c6f',
  info: '',
  warning: '#d46b08',
};
export function getColorName(color: string | undefined) {
  return antdColorMap[color || ''] || color;
}

export const statusMap: Record<ReceptionStatus, ReceptionStatusInfo> = statusList.reduce(
  (a, v) => {
    a[v.status] = v;
    return a;
  },
  {} as Record<AllReceptionStatus, ReceptionStatusInfo>,
);

export function getEmptySummary(): ReportTaskTreeSummary {
  return {
    total: 0,
    empty: 0,
    received: 0,
    submitted: 0,
    finished: 0,
    rejected: 0,
    changed: 0,
  };
}

export function getStatus(reception?: ReceptionStatusModel | null): ReceptionStatus {
  if (reception) {
    if (reception.instanceId) {
      if (reception.isReject) {
        return 'rejected';
      } else if (reception.thingId && Object.keys(reception.thingId).length > 0) {
        if (reception.previousInstanceId) {
          return 'changed';
        } else {
          return 'finished';
        }
      } else {
        return 'submitted';
      }
    } else if (reception.receiveUserId && reception.receiveUserId !== '') {
      return 'received';
    }
  }
  return 'empty';
}
