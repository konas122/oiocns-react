import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import orgCtrl from '@/ts/controller';
import React from 'react';
import { loadFileMenus } from '@/executor/fileOperate';
import { MenuItemType } from 'typings/globelType';
import { IDepartment, IGroup, ITarget, IDirectory, IApplication, IWork } from '@/ts/core';
import { findMenuItemByKey } from '@/utils/tools';

/** 创建团队菜单 */
const createMenu = (target: ITarget, children: MenuItemType[], typeNames: string[]) => {
  if (typeNames.includes('应用')) {
    children.unshift(...buildApplicationTree(target.directory.standard.applications));
  }
  return {
    key: target.directory.key,
    item: target.directory,
    label: target.name,
    itemType: target.directory.typeName,
    menus: loadFileMenus(target.directory),
    tag: [target.typeName],
    icon: <EntityIcon entityId={target.id} size={18} />,
    children: children,
  };
};
/** 编译部门树 */
const buildDepartmentTree = (
  departments: IDepartment[],
  typeNames: string[],
): MenuItemType[] => {
  return departments.map((item) => {
    let dir: MenuItemType[] = [];
    if (typeNames.includes('目录')) {
      dir = buildDirectoryTree(item.directory.children, typeNames);
    }
    return createMenu(
      item,
      [...dir, ...buildDepartmentTree(item.children, typeNames)],
      typeNames,
    );
  });
};
/** 编译组织集群树 */
const buildGroupTree = (groups: IGroup[], typeNames: string[]): MenuItemType[] => {
  return groups.map((item) => {
    let dir: MenuItemType[] = [];
    if (typeNames.includes('目录')) {
      dir = buildDirectoryTree(item.directory.children, typeNames);
    }
    const groupTreeItems = buildGroupTree(item.children, typeNames);
    return createMenu(item, [...dir, ...groupTreeItems], typeNames);
  });
};

/** 编译目录树 */
const buildDirectoryTree = (
  directorys: IDirectory[],
  typeNames: string[],
): MenuItemType[] => {
  return directorys.map((directory) => {
    let children: MenuItemType[] = buildDirectoryTree(directory.children, typeNames);
    if (typeNames.includes('应用')) {
      children = [...children, ...buildApplicationTree(directory.standard.applications)];
    }
    return {
      key: directory.key,
      item: directory,
      label: directory.name,
      tag: [directory.typeName],
      icon: (
        <EntityIcon entityId={directory.id} typeName={directory.typeName} size={18} />
      ),
      itemType: directory.typeName,
      menus: loadFileMenus(directory),
      children: children,
    };
  });
};

const buildWorks = (works: IWork[]): MenuItemType[] => {
  return works
    .filter((i) => i.isContainer)
    .map((work) => {
      return {
        key: work.key,
        item: work,
        label: work.name,
        tag: [work.typeName],
        icon: <EntityIcon entityId={work.id} typeName={work.typeName} size={18} />,
        itemType: work.typeName,
        menus: loadFileMenus(work),
        children: buildForms(work),
      };
    });
};

const buildForms = (work: IWork): MenuItemType[] => {
  return work.content().map((form) => {
    return {
      key: form.key,
      item: form,
      label: form.name,
      tag: [form.typeName],
      icon: <EntityIcon entityId={form.id} typeName={form.typeName} size={18} />,
      itemType: form.typeName,
      menus: loadFileMenus(form),
      children: [],
    };
  });
};

/** 编译目录树 */
const buildApplicationTree = (applications: IApplication[]): MenuItemType[] => {
  return applications.map((application) => {
    return {
      key: application.key,
      item: application,
      label: application.name,
      tag: [application.typeName],
      icon: (
        <EntityIcon entityId={application.id} typeName={application.typeName} size={18} />
      ),
      itemType: application.typeName,
      menus: loadFileMenus(application),
      children: [
        ...buildApplicationTree(application.children),
        ...buildWorks(application.works),
      ],
    };
  });
};

/** 获取个人菜单 */
const getUserMenu = (allowInherited: boolean, typeNames: string[]) => {
  return createMenu(
    orgCtrl.user,
    [
      ...buildDirectoryTree(orgCtrl.user.directory.children, typeNames),
      ...orgCtrl.user.cohorts
        .filter((i) => !i.isInherited || allowInherited)
        .map((i) =>
          createMenu(i, buildDirectoryTree(i.directory.children, typeNames), typeNames),
        ),
    ],
    typeNames,
  );
};

/** 获取组织菜单 */
const getTeamMenu = (allowInherited: boolean, typeNames: string[]) => {
  const children: MenuItemType[] = [];
  for (const company of orgCtrl.user.companys) {
    let dirTree: MenuItemType[] = [];
    if (typeNames.includes('目录')) {
      dirTree.push(...buildDirectoryTree(company.directory.children, typeNames));
    }
    children.push(
      createMenu(
        company,
        [
          ...dirTree,
          ...buildDepartmentTree(company.departments, typeNames),
          ...buildGroupTree(
            company.groups.filter((i) => !i.isInherited || allowInherited),
            typeNames,
          ),
          ...company.cohorts.map((i) =>
            createMenu(i, buildDirectoryTree(i.directory.children, typeNames), typeNames),
          ),
          ...company.storages.map((i) =>
            createMenu(i, buildDirectoryTree(i.directory.children, typeNames), typeNames),
          ),
        ],
        typeNames,
      ),
    );
  }
  return children;
};

/** 加载设置模块菜单 */
export const loadSettingMenu = (
  rootKey: string,
  allowInherited: boolean,
  typeNames?: string[],
) => {
  if (!typeNames) {
    typeNames = ['人员', '单位', '目录', '应用'];
  }
  const rootMenu: MenuItemType = {
    key: '根目录',
    label: '根目录',
    itemType: 'Tab',
    item: 'disk',
    children: [],
    icon: <EntityIcon entityId={orgCtrl.user.id} size={18} />,
  };
  if (typeNames?.includes('人员')) {
    rootMenu.children.push(getUserMenu(allowInherited, typeNames));
  }
  if (typeNames?.includes('单位')) {
    rootMenu.children.push(...getTeamMenu(allowInherited, typeNames));
  }
  const findMenu = findMenuItemByKey(rootMenu, rootKey);
  if (findMenu) {
    findMenu.parentMenu = undefined;
    return findMenu;
  }
  return rootMenu;
};
