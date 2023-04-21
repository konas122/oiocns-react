import TeamIcon from '@/bizcomponents/GlobalComps/teamIcon';
import orgCtrl from '@/ts/controller';
import { ISpace, ISpeciesItem, ITarget, TargetType } from '@/ts/core';
import { IAuthority } from '@/ts/core/target/authority/iauthority';
import { IsSuperAdmin } from '@/utils/authority';
import React from 'react';
import * as im from 'react-icons/im';
import { MenuItemType, OperateMenuType } from 'typings/globelType';
import { GroupMenuType } from './menuType';
import { XDict } from '@/ts/base/schema';

/** 加载分组菜单参数 */
interface groupMenuParams {
  item: ITarget;
  key: string;
  label: string;
  typeName: string;
  subTeam: ITarget[];
}

/** 转换类型 */
const parseGroupMenuType = (typeName: TargetType) => {
  switch (typeName) {
    case TargetType.Cohort:
      return GroupMenuType.Cohort;
    case TargetType.Station:
      return GroupMenuType.Station;
    default:
      return GroupMenuType.Agency;
  }
};

/** 编译组织树 */
export const buildTargetTree = async (targets: ITarget[], belong: ISpace) => {
  const result: MenuItemType[] = [];
  for (const item of targets) {
    result.push({
      key: item.key,
      belong: belong,
      shareId: item.id,
      item: item,
      label: item.teamName,
      itemType: parseGroupMenuType(item.typeName),
      menus: await loadTypeMenus(item, true),
      icon: <TeamIcon notAvatar={true} share={item.shareInfo} size={18} fontSize={16} />,
      children: [
        await buildTargetSpeciesTree(item, belong),
        ...(await buildTargetTree(item.subTeam, belong)),
      ],
    });
  }
  return result;
};

const buildTargetSpeciesTree = async (target: ITarget, belong: ISpace) => {
  const species = await target.loadSpeciesTree();
  return {
    children: species.map((i) => buildSpeciesTree(target.key, i, target)),
    key: target.key + '-分类标准',
    belong: belong,
    shareId: target.id,
    label: '分类标准',
    itemType: '分类标准',
    item: target,
    icon: <im.ImNewspaper />,
  };
};

/** 编译分类树 */
export const buildSpeciesTree = (
  prefix: string,
  species: ISpeciesItem,
  belong: ITarget,
) => {
  const result: MenuItemType = {
    key: prefix + species.id,
    belong: belong,
    shareId: species.target.belongId,
    item: species,
    label: species.name,
    icon: <im.ImTree />,
    itemType: GroupMenuType.Species,
    menus: loadSpeciesMenus(species),
    children: species.children?.map((i) => buildSpeciesTree(prefix, i, belong)) ?? [],
  };
  return result;
};

/** 编译权限树 */
export const buildAuthorityTree = (
  prefix: string,
  authoritys: IAuthority,
  belong: ISpace,
) => {
  const result: MenuItemType = {
    key: prefix + authoritys.id,
    belong: belong,
    shareId: belong.id,
    item: authoritys,
    label: authoritys.name,
    icon: <im.ImTree />,
    itemType: GroupMenuType.Authority,
    menus: loadAuthorityMenus(authoritys),
    children:
      authoritys.children?.map((i) => buildAuthorityTree(prefix, i, belong)) ?? [],
  };
  return result;
};

export const buildDictMenus = (dict: XDict, belong: ISpace) => {
  const result: MenuItemType = {
    key: dict.id,
    belong: belong,
    item: dict,
    label: dict.name,
    icon: <im.ImTree />,
    itemType: GroupMenuType.Dict,
    menus: [
      {
        key: '编辑字典',
        icon: <im.ImPencil />,
        label: '编辑字典',
        model: 'outside',
      },
      {
        key: '删除字典',
        icon: <im.ImCross />,
        label: '删除字典',
        model: 'outside',
      },
    ],
    children: [],
  };
  return result;
};

export const loadStandardSetting = async (space: ISpace) => {
  const result: MenuItemType[] = [];
  const authors = await space.loadSpaceAuthorityTree();
  const dicts = await space.dict.loadDict({ offset: 0, limit: 1000, filter: '' });
  if (authors) {
    result.push({
      children: [buildAuthorityTree(space.key, authors, space)],
      key: space.key + '权限标准',
      belong: space,
      shareId: space.id,
      label: '权限标准',
      itemType: '权限标准',
      item: space,
      icon: <im.ImNewspaper />,
    });
  }
  if (dicts) {
    result.push({
      children: dicts?.result?.map((item) => buildDictMenus(item, space)) || [],
      key: space.key + '字典定义',
      label: '字典定义',
      itemType: '字典定义',
      item: space,
      icon: <im.ImNewspaper />,
      menus: [
        {
          key: '新增字典',
          icon: <im.ImPlus />,
          label: '新增字典',
          model: 'outside',
        },
      ],
    });
  }
  result.push({
    children: [],
    key: space.key + '属性定义',
    label: '属性定义',
    itemType: GroupMenuType.Property,
    item: space,
    icon: <im.ImNewspaper />,
    menus: [
      {
        key: '新增属性',
        icon: <im.ImPlus />,
        label: '新增属性',
        model: 'outside',
      },
    ],
  });
  result.push(await buildTargetSpeciesTree(space, space));
  return result;
};

/** 加载右侧菜单 */
export const loadSpeciesMenus = (item: ISpeciesItem) => {
  const items = [
    {
      key: '新增',
      icon: <im.ImPlus />,
      label: '新增分类',
    },
  ];
  if (item.target.belongId) {
    items.push(
      {
        key: '修改',
        icon: <im.ImCog />,
        label: '编辑分类',
      },
      {
        key: '移除',
        icon: <im.ImBin />,
        label: '删除分类',
      },
    );
  }
  return items;
};

/** 获取个人菜单 */
export const getUserMenu = async () => {
  return {
    key: orgCtrl.user.key,
    item: orgCtrl.user,
    label: orgCtrl.user.teamName,
    itemType: GroupMenuType.User,
    belongId: orgCtrl.user.id,
    shareId: orgCtrl.user.id,
    icon: <TeamIcon share={orgCtrl.user.shareInfo} size={18} fontSize={16} />,
    menus: [
      {
        key: '创建单位',
        icon: <im.ImOffice />,
        label: '创建单位',
        model: 'outside',
      },
      {
        key: '加入单位',
        icon: <im.ImTree />,
        label: '加入单位',
        model: 'outside',
      },
      {
        key: '编辑',
        icon: <im.ImPencil />,
        label: '编辑信息',
        model: 'outside',
      },
    ],
    children: [
      {
        key: orgCtrl.user.key + '标准设置',
        item: orgCtrl.user,
        label: '标准设置',
        itemType: '标准设置',
        belongId: orgCtrl.user.id,
        shareId: orgCtrl.user.id,
        menus: [],
        icon: <im.ImNewspaper />,
        children: await loadStandardSetting(orgCtrl.user),
      },
      await loadGroupMenus(
        {
          key: orgCtrl.user.id + GroupMenuType.UserCohort,
          label: GroupMenuType.UserCohort,
          item: orgCtrl.user,
          typeName: TargetType.Cohort,
          subTeam: await orgCtrl.user.getCohorts(),
        },
        [TargetType.Cohort],
        orgCtrl.user,
      ),
    ],
  };
};

/** 获取组织菜单 */
export const getTeamMenu = async () => {
  const children: MenuItemType[] = [];
  for (const company of await orgCtrl.user.getJoinedCompanys()) {
    children.push({
      key: company.key,
      item: company,
      label: company.teamName,
      itemType: GroupMenuType.Company,
      belong: company,
      shareId: company.id,
      menus: await loadTypeMenus(company, false),
      icon: <TeamIcon share={company.shareInfo} size={18} fontSize={16} />,
      children: [
        {
          key: company.key + '标准设置',
          item: company,
          label: '标准设置',
          itemType: '标准设置',
          belong: company.id,
          shareId: company.id,
          menus: [],
          icon: <im.ImNewspaper />,
          children: await loadStandardSetting(company),
        },
        await loadGroupMenus(
          {
            key: company.key + GroupMenuType.InnerAgency,
            label: GroupMenuType.InnerAgency,
            item: company,
            typeName: TargetType.Department,
            subTeam: await company.loadSubTeam(),
          },
          company.subTeamTypes,
          company,
        ),
        await loadGroupMenus(
          {
            key: company.key + GroupMenuType.OutAgency,
            label: GroupMenuType.OutAgency,
            item: company,
            typeName: TargetType.Group,
            subTeam: await company.getJoinedGroups(),
          },
          [TargetType.Group],
          company,
        ),
        await loadGroupMenus(
          {
            key: company.key + GroupMenuType.StationSetting,
            label: GroupMenuType.StationSetting,
            item: company,
            typeName: TargetType.Station,
            subTeam: await company.getStations(),
          },
          [TargetType.Station],
          company,
        ),
        await loadGroupMenus(
          {
            key: company.key + GroupMenuType.CompanyCohort,
            label: GroupMenuType.CompanyCohort,
            item: company,
            typeName: TargetType.Cohort,
            subTeam: await company.getCohorts(),
          },
          [TargetType.Cohort],
          company,
        ),
      ],
    });
  }
  return children;
};
/** 加载分组菜单 */
export const loadGroupMenus = async (
  param: groupMenuParams,
  teamTypes: string[],
  belong: ISpace,
) => {
  let menus = [
    {
      key: '重载|' + param.typeName,
      icon: <im.ImSpinner9 />,
      label: '刷新' + param.typeName,
      model: 'inside',
    },
  ];
  if (await IsSuperAdmin(param.item)) {
    menus.unshift({
      key: '新建|' + teamTypes.join('|'),
      icon: <im.ImPlus />,
      label: '新建' + param.typeName,
      model: 'outside',
    });
  }
  return {
    key: param.key,
    label: param.label,
    itemType: param.key,
    icon: (
      <TeamIcon
        share={{
          name: param.key,
          typeName: param.typeName,
        }}
        size={18}
        fontSize={16}
        notAvatar={true}
      />
    ),
    menus: menus,
    item: param.item,
    belong: belong,
    shareId: belong.id,
    children: await buildTargetTree(param.subTeam, belong),
  };
};

/** 加载右侧菜单 */
export const loadAuthorityMenus = (item: IAuthority) => {
  const items = [
    {
      key: '新增',
      icon: <im.ImPlus />,
      label: '新增权限',
    },
  ];
  if (item.belongId) {
    items.push(
      {
        key: '修改',
        icon: <im.ImCog />,
        label: '编辑权限',
      },
      {
        key: '移除',
        icon: <im.ImBin />,
        label: '删除权限',
      },
    );
  }
  return items;
};

/** 加载类型更多操作 */
export const loadTypeMenus = async (item: ITarget, allowDelete: boolean) => {
  const menus: OperateMenuType[] = [];
  if (item.typeName != TargetType.Group) {
    menus.push({
      key: '打开会话',
      icon: <im.ImBubbles />,
      label: '打开会话',
      model: 'outside',
    });
  }
  let isAdmin = await IsSuperAdmin(item);
  if (item.subTeamTypes.length > 0) {
    if (isAdmin) {
      menus.push({
        key: '新建|' + item.subTeamTypes.join('|'),
        icon: <im.ImPlus />,
        label: '新建子组织',
      });
    }
  }
  if (isAdmin) {
    menus.push({
      key: '编辑',
      icon: <im.ImPencil />,
      label: '编辑信息',
    });
    if (allowDelete) {
      menus.push({
        key: '删除',
        icon: <im.ImBin />,
        label: '删除' + item.typeName,
      });
    }
  } else if (await IsSuperAdmin(item)) {
    if (!allowDelete) {
      menus.push({
        key: '退出',
        icon: <im.ImBin />,
        label: '退出' + item.typeName,
      });
    }
  }
  return menus;
};
