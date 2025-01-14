import React, { useState, forwardRef, ForwardedRef } from 'react';
import {
  IPageContext,
  PageContext,
} from '@/components/PageElement/render/PageContext';
import { useEffectOnce } from 'react-use';
import DocumentViewerManager from './ViewerManager';

export interface ViewerProps {
  ctx: { view: DocumentViewerManager };
}

export const ViewerHost = forwardRef(({ ctx }: ViewerProps, ref: ForwardedRef<HTMLElement>) =>  {
  const RootRender = ctx.view.components.rootRender as any;

  const [ready, setReady] = useState(false);

  async function init() {
    await ctx.view.loadData();
    setReady(true);
  }

  useEffectOnce(() => {
    init();
  });

  return (
    <PageContext.Provider value={ctx}>
      <div className="o-page-host page-host--view" ref={ref as any}>
        {ready && <RootRender element={ctx.view.rootElement}/>}
      </div>
    </PageContext.Provider>
  );
});
