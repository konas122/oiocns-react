import React, { useEffect, useState } from 'react';
import cls from './index.module.less';
import { XReportTreeNode } from '@/ts/base/schema';
import { ReportTaskTreeNodeView } from '@/ts/base/model';
import {
  AllReceptionStatus,
  getColorName,
  getStatus,
  ReceptionStatus,
  ReportTaskTreeSummary,
  statusMap,
} from '@/ts/core/work/assign/reception/status';
import ReportTree from '@/executor/design/reportTreeModal/ReportTree';
import { Resizable } from 'devextreme-react';
import { Button, Input, Tag, Tooltip } from 'antd';
import { SyncOutlined } from '@ant-design/icons';

interface SummaryReceptionStatusInfo {
  status: AllReceptionStatus | 'approving' | 'approved';
  label: string;
  color: string;
}

export function ReportTaskTree(props: {
  tree: ReportTaskTreeNodeView[];
  currentNode: XReportTreeNode | null;
  onNodeSelect: (node: ReportTaskTreeNodeView) => void;
  summary?: ReportTaskTreeSummary;
  onSyncStatus?: () => any;
  width?: number;
  loadChildren?: (parentNodeId: string) => Promise<ReportTaskTreeNodeView[]>;
}) {
  const [leftWidth, setLeftWidth] = useState(props.width ?? 410);
  const [nodeId, setNodeId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentTag, setCurrentTag] = useState('total');

  useEffect(() => {
    setNodeId(props.currentNode?.id || '');
  }, [props.currentNode]);
  function selectNode(e: ReportTaskTreeNodeView) {
    setNodeId(e.id);
    props.onNodeSelect(e);
  }

  function renderNode(node: ReportTaskTreeNodeView) {
    let status = getStatus(node.reception);
    let color = getColorName(statusMap[status]?.color);
    return (
      <>
        <span style={{ color }}>{node.name}</span>
        {node.reception?.isAutoFill && (
          <Tag color="green" style={{ marginLeft: 6 }}>
            自动补全
          </Tag>
        )}
      </>
    );
  }

  const renderTag = (info: SummaryReceptionStatusInfo, child = false) => {
    const sum = props.summary!;
    let tagValue = sum[info.status as ReceptionStatus] || 0;

    const e = () => {
      return (
        <div
          key={info.status}
          className={[cls['tag'], child ? cls['is-small'] : ''].join(' ')}
          style={{
            color: info.status === currentTag ? '#FFFFFF' : getColorName(info.color),
            backgroundColor: info.status === currentTag ? '#154ad8' : '#F0F0F0',
          }}
          onClick={() => setCurrentTag(info.status)}>
          <div>{info.label}</div> <strong>{tagValue}</strong>
          {info.status == 'total' && (
            <div>
              <Tooltip title="更新状态">
                <Button
                  type={info.status === currentTag ? 'default' : 'primary'}
                  shape="circle"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onSyncStatus?.();
                  }}>
                  <SyncOutlined />
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
      );
    };

    if (info.status == 'approving' && !child) {
      tagValue = sum.submitted + sum.changed;
      return (
        <div className={cls['tag-wrap']}>
          {e()}
          {renderTag(statusMap.submitted, true)}
          {renderTag(statusMap.changed, true)}
        </div>
      );
    } else if (info.status == 'approved' && !child) {
      tagValue = sum.finished + sum.rejected;
      return (
        <div className={cls['tag-wrap']}>
          {e()}
          {renderTag(statusMap.finished, true)}
          {renderTag(statusMap.rejected, true)}
        </div>
      );
    } else {
      return e();
    }
  };

  return (
    <Resizable
      handles={'right'}
      width={leftWidth}
      maxWidth={640}
      minWidth={280}
      onResize={(e) => setLeftWidth(e.width)}>
      <div className={cls['tree-wrap']}>
        {props.summary && (
          <>
            <div
              className={cls['info'] + ' ' + cls['tree-tags']}
              style={{ marginBottom: '8px' }}>
              {renderTag({
                status: 'total',
                label: '全部',
                color: '',
              })}
              {renderTag(statusMap.empty)}
              {renderTag(statusMap.received)}
              {renderTag({
                status: 'approving',
                label: '审核中',
                color: statusMap.submitted.color,
              })}
              {renderTag({
                status: 'approved',
                label: '已审核',
                color: statusMap.finished.color,
              })}
            </div>
          </>
        )}
        <Input.Search
          placeholder="搜索节点"
          allowClear
          style={{ marginBottom: '8px' }}
          onSearch={(e) => setSearchText(e)}
        />
        <div className={cls['tree-content']}>
          <ReportTree<ReportTaskTreeNodeView>
            nodes={props.tree}
            selectedKeys={nodeId ? [nodeId] : []}
            renderNode={renderNode}
            onSelect={(_, n) => {
              selectNode(n.node);
            }}
            loadChildren={props.loadChildren}
            currentTag={currentTag}
            searchText={searchText}
          />
        </div>
      </div>
    </Resizable>
  );
}
