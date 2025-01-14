import React, { ReactNode, useMemo } from 'react';
import { defineElement } from '../../defineElement';
import { WorkTaskInfo } from '@/ts/element/standard/document/model';
import DocumentViewerManager from '@/executor/open/document/view/ViewerManager';

export const WorkNodeContext = React.createContext({
  task: null as WorkTaskInfo | null,
});

export default defineElement({
  render(props, ctx) {

    const taskCtx = useMemo(() => {
      let task: WorkTaskInfo | null = null;
      if (ctx.view.mode == 'view') {
        const manager = ctx.view as DocumentViewerManager;
        const allData = manager.dataset.taskDataMap;
        task = allData[props.nodeKey] || null;
      }
      return { task };
    }, [ctx.view.mode]);
    
    return (
      <WorkNodeContext.Provider value={taskCtx}>
        {props.children.map((c) => {
          const Render = ctx.view.components.getComponentRender(c.kind, ctx.view.mode);
          return <Render key={c.id} element={c} />;
        })}
      </WorkNodeContext.Provider>
    );
  },
  displayName: 'WorkNode',
  meta: {
    label: '办事审批环节',
    type: 'Document',
    props: {
      nodeKey: {
        type: 'string',
        label: '环节名称标识',
        required: true,
      },
    },
  },
});