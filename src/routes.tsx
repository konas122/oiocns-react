import React from 'react';
import { IRouteConfig } from '../typings/globelType';
/** 404 */
const NotFound: React.FC = () => {
  return (
    <div>
      <h2>404</h2>
    </div>
  );
};

// 路由汇总
const Routers: IRouteConfig[] = [
  {
    path: '/auth',
    component: React.lazy(() => import('@/pages/Auth/content')),
    title: '授权页',
  },
  {
    path: '/download',
    component: React.lazy(() => import('@/pages/Auth/download')),
    title: '下载移动端',
  },
  {
    path: '/privacy/policy',
    component: React.lazy(() => import('@/pages/Auth/privacy')),
    title: '奥集能隐私政策',
    routes: [],
  },
  {
    path: '/noFond',
    title: '页面不存在',
    component: NotFound,
  },
  {
    path: '/',
    component: React.lazy(() => import('@/layout')),
    title: '通用',
    routes: [
      {
        path: '/home',
        title: '首页',
        component: React.lazy(() => import('@/pages/Home')),
      },
      {
        path: '/chat',
        title: '沟通',
        component: React.lazy(() => import('@/pages/Chats')),
      },
      {
        path: '/store',
        title: '数据',
        component: React.lazy(() => import('@/pages/Store')),
      },
      {
        path: '/work',
        title: '办事',
        component: React.lazy(() => import('@/pages/Work')),
      },
      {
        path: '/relation',
        title: '关系',
        component: React.lazy(() => import('@/pages/Relation')),
      },
      {
        path: '/developers',
        title: '贡献',
        component: React.lazy(() => import('@/pages/Developers')),
      },
      {
        path: '*',
        title: '页面不存在',
        component: NotFound,
      },
    ],
  },
];

export default Routers;
