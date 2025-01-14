/** 实体的操作 */
export const entityOperates = {
  Open: {
    sort: 3,
    cmd: 'open',
    label: '打开{0}',
    iconType: 'open',
  },
  FormOpen: {
    sort: 3,
    cmd: 'open',
    label: '打开{0}',
    iconType: 'open',
    openDirectly: true,
    menus: [
      {
        sort: 1,
        cmd: 'open',
        label: '数据预览',
        iconType: 'open',
      },
      {
        sort: 2,
        cmd: 'dataAnalysis',
        label: '数据分析',
        iconType: 'open',
      },
    ],
  },
  GroupOpen: {
    sort: 3,
    cmd: 'open',
    label: '打开{0}',
    iconType: 'open',
    openDirectly: true,
    menus: [
      {
        sort: 1,
        cmd: 'open',
        label: '打开集群{0}',
        iconType: 'open',
      },
      {
        sort: 2,
        cmd: 'openMember',
        label: '打开成员{0}',
        iconType: 'open',
      },
    ],
  },
  Design: {
    sort: 4,
    cmd: 'design',
    label: '设计{0}',
    iconType: 'design',
  },
  Update: {
    sort: 11,
    cmd: 'update',
    label: '更新信息',
    iconType: 'update',
  },
  Delete: {
    sort: 999,
    cmd: 'delete',
    label: '标记删除',
    iconType: 'delete',
  },
  Restore: {
    sort: 25,
    cmd: 'restore',
    label: '放回原处',
    iconType: 'restore',
  },
  HardDelete: {
    sort: 1000,
    cmd: 'hardDelete',
    label: '彻底删除',
    iconType: 'hardDelete',
  },
  Quit: {
    sort: 27,
    cmd: 'quit',
    label: '退出{0}',
    iconType: 'exit',
  },
  Remark: {
    sort: 100,
    cmd: 'remark',
    label: '详细信息',
    iconType: 'remark',
  },
  QrCode: {
    sort: 101,
    cmd: 'qrcode',
    label: '分享二维码',
    iconType: 'qrcode',
  },
  LookSubscribes: {
    cmd: 'lookSubscribes',
    sort: 102,
    label: '查看订阅',
    iconType: 'lookSubscribes',
  },
  WithDrawWorkTask: {
    cmd: 'withDrawWorkTask',
    sort: 103,
    label: '撤回办事',
    iconType: 'restore',
  },
  CorrectWorkTask: {
    cmd: 'correctWorkTask',
    sort: 104,
    label: '校准办事',
    iconType: 'update',
  },
  CancelReceptionTask: {
    cmd: 'cancelReceptionTask',
    sort: 105,
    label: '取消接收',
    iconType: 'restore',
  },
};
export const versionOperates = {
  Used: {
    sort: 1,
    cmd: 'switchVersion',
    label: '切换版本',
    iconType: 'open',
  },
  Delete: {
    sort: 999,
    cmd: 'deleteVersion',
    label: '删除版本',
    iconType: 'delete',
  },
};
/** 文件支持的操作 */
export const fileOperates = {
  SetCommon: {
    sort: 18,
    cmd: 'commonToggle',
    label: '设为个人常用',
    iconType: 'setCommon',
  },
  DelCommon: {
    sort: 19,
    cmd: 'commonToggle',
    label: '移除个人常用',
    iconType: 'delCommon',
  },
  SetCompanyCommon: {
    sort: 18,
    cmd: 'companyCommonToggle',
    label: '设为单位常用',
    iconType: 'setCommon',
  },
  DelCompanyCommon: {
    sort: 19,
    cmd: 'companyCommonToggle',
    label: '移除单位常用',
    iconType: 'delCommon',
  },
  Download: {
    sort: 20,
    cmd: 'download',
    label: '下载文件',
    iconType: 'download',
  },
  GenerateView: {
    sort: 20,
    cmd: 'generateView',
    label: '生成视图',
    iconType: 'newWork',
  },
  Copy: {
    sort: 21,
    cmd: 'copy',
    label: '复制文件',
    iconType: 'copy',
  },
  CopyRevision: {
    sort: 21,
    cmd: 'copyRevision',
    label: '复制变化',
    iconType: 'copyRevision',
  },
  LookRevision: {
    sort: 21,
    cmd: 'lookRevision',
    label: '查看变化',
    iconType: 'lookRevision',
  },
  Move: {
    sort: 22,
    cmd: 'move',
    label: '剪切文件',
    iconType: 'move',
  },
  Parse: {
    sort: 7,
    cmd: 'parse',
    label: '粘贴文件',
    iconType: 'parse',
  },
  Rename: {
    sort: 25,
    cmd: 'rename',
    label: '重命名',
    iconType: 'rename',
  },
  HslSplit: {
    sort: 26,
    cmd: 'hslSplit',
    label: '视频切片',
    iconType: 'hslSplit',
  },
};

/** 变更管理 */
export const changeManager = {
  sort: 0,
  cmd: 'changeManager',
  label: '变更管理',
  iconType: 'new',
  menus: [fileOperates.CopyRevision, fileOperates.LookRevision],
};

export const workOperates = {
  Distribute: {
    sort: 23,
    cmd: 'distribute',
    label: '分发文件',
    iconType: 'distribute',
  },
};

/** 目录支持的操作 */
export const directoryOperates = {
  Refesh: {
    sort: 4,
    cmd: 'reload',
    label: '刷新目录',
    iconType: 'refresh',
  },
  Shortcut: {
    sort: 11,
    cmd: 'shortcut',
    label: '创建快捷方式',
    iconType: 'shortcut',
  },
  OpenFolderWithEditor: {
    sort: 10,
    cmd: 'openFolderWithEditor',
    label: '打开项目',
    iconType: 'open',
  },
  NewFile: {
    sort: 5,
    cmd: 'newFile',
    label: '上传文件',
    iconType: 'newFile',
  },
  TaskList: {
    sort: 6,
    cmd: 'taskList',
    label: '上传列表',
    iconType: 'taskList',
  },
  NewDir: {
    sort: 0,
    cmd: 'newDir',
    label: '新建目录',
    iconType: 'newDir',
  },
  NewApp: {
    sort: 1,
    cmd: 'newApp',
    label: '新建应用',
    iconType: 'newApp',
  },
  Standard: {
    sort: 2,
    cmd: 'standard',
    label: '导入标准模板',
    iconType: 'importStandard',
  },
  Business: {
    sort: 2,
    cmd: 'business',
    label: '导入业务模板',
    iconType: 'importBusiness',
  },
  NewSpecies: {
    sort: 3,
    cmd: 'newSpecies',
    label: '新建分类',
    iconType: 'newSpecies',
  },
  NewDict: {
    sort: 4,
    cmd: 'newDict',
    label: '新建字典',
    iconType: 'newDict',
  },
  NewProperty: {
    sort: 5,
    cmd: 'newProperty',
    label: '新建属性',
    iconType: 'newProperty',
  },
  NewModule: {
    sort: 6,
    cmd: 'newModule',
    label: '新建模块',
    iconType: 'newModule',
  },
  NewWork: {
    sort: 7,
    cmd: 'newWork',
    label: '新建办事',
    iconType: 'newWork',
  },
  NewForm: {
    sort: 8,
    cmd: 'newForm',
    label: '新建表单',
    iconType: 'newForm',
  },
  NewReport: {
    sort: 8,
    cmd: 'newReport',
    label: '新建表格',
    iconType: 'newForm',
  },
  NewView: {
    sort: 8.5,
    cmd: 'newView',
    label: '新建视图',
    iconType: 'newView',
  },
  NewTransferConfig: {
    sort: 9,
    cmd: 'newTransferConfig',
    label: '新建数据迁移',
    iconType: 'newTransfer',
  },
  NewPageTemplate: {
    sort: 11,
    cmd: 'newPageTemplate',
    label: '新建页面模板',
    iconType: 'newPage',
  },
  NewSequences: {
    sort: 12,
    cmd: 'newSequences',
    label: '新建序列',
    iconType: 'newSequences',
  },
  NewReportTree: {
    sort: 9,
    cmd: 'newReportTree',
    label: '新建报表树',
    iconType: 'newReportTree',
  },
  NewDistributionTask: {
    sort: 8,
    cmd: 'newDistributionTask',
    label: '新建任务',
    iconType: 'newDict',
  },
  NewPrint: {
    sort: 13,
    cmd: 'newPrint',
    label: '新建打印模板',
    iconType: 'newDict',
  },
  NewDocumentTemplate: {
    sort: 13,
    cmd: 'newDocumentTemplate',
    label: '新建文档模板',
    iconType: 'newDict',
  },
  NewDoc: {
    sort: 14,
    cmd: 'newDoc',
    label: '新建文档',
    iconType: 'newFile',
  },
  LookSubscribe: {
    cmd: 'lookSubscribe',
    sort: 0,
    label: '查看订阅',
    iconType: 'lookSubscribe',
  },
  SubscribeUpdate: {
    cmd: 'subscribeUpdate',
    sort: 0,
    label: '内容更新',
    iconType: 'subscribe',
  },
  Subscribe: {
    cmd: 'subscribe',
    sort: 0,
    label: '内容订阅',
    iconType: 'subscribe',
  },
  CancelSubscribe: {
    cmd: 'cancelSubscribe',
    sort: 0,
    label: '取消订阅',
    iconType: 'subscribe',
  },
};

/** 目录下新增 */
export const directoryNew = {
  sort: 0,
  cmd: 'new',
  label: '新建更多',
  iconType: 'new',
  menus: [
    directoryOperates.NewDir,
    directoryOperates.NewDict,
    directoryOperates.NewSpecies,
    directoryOperates.NewProperty,
    directoryOperates.NewApp,
    directoryOperates.NewForm,
    directoryOperates.NewReport,
    directoryOperates.NewView,
    directoryOperates.NewDistributionTask,
    directoryOperates.NewReportTree,
    directoryOperates.NewTransferConfig,
    directoryOperates.NewPageTemplate,
    directoryOperates.NewDocumentTemplate,
    directoryOperates.NewDoc,
  ],
};

/** 目录下新增 */
export const applicationNew = {
  sort: 0,
  cmd: 'new',
  label: '新建更多',
  iconType: 'new',
  menus: [
    directoryOperates.NewModule,
    directoryOperates.NewWork,
    directoryOperates.NewForm,
    directoryOperates.NewReport,
    directoryOperates.NewView,
    directoryOperates.NewSequences,
    directoryOperates.NewPrint,
    directoryOperates.NewDocumentTemplate,
  ],
};

/** 新建仓库 */
export const newWarehouse = {
  sort: 0,
  cmd: 'newWarehouses',
  label: '仓库管理',
  iconType: 'newWarehouses',
  menus: [
    {
      sort: -1,
      cmd: 'newWarehouse',
      label: '新建仓库',
      iconType: 'newWarehouse',
    },
  ],
};

/** 团队的操作 */
export const teamOperates = {
  applyFriend: {
    sort: 40,
    cmd: 'applyFriend',
    label: '加为好友',
    iconType: 'joinFriend',
  },
  Pull: {
    sort: 30,
    cmd: 'pull',
    label: '邀请成员',
    iconType: 'pull',
  },
  pullIdentity: {
    sort: 31,
    cmd: 'pullIdentity',
    label: '添加角色',
    iconType: 'pullIdentity',
  },
};

/** 用户的操作 */
export const targetOperates = {
  JoinFriend: {
    sort: 40,
    cmd: 'joinFriend',
    label: '添加好友',
    iconType: 'joinFriend',
  },
  NewCohort: {
    sort: 32,
    cmd: 'newCohort',
    label: '设立群组',
    iconType: 'newCohort',
  },
  NewStorage: {
    sort: 33,
    cmd: 'newStorage',
    label: '设立存储',
    iconType: 'newStorage',
  },
  NewCompany: {
    sort: 34,
    cmd: 'newCompany',
    label: '设立单位',
    iconType: 'newCompany',
  },
  NewGroup: {
    sort: 35,
    cmd: 'newGroup',
    label: '设立集群',
    iconType: 'newGroup',
  },
  NewDepartment: {
    sort: 36,
    cmd: 'newDepartment',
    label: '设立部门',
    iconType: 'newDepartment',
  },
  JoinCompany: {
    sort: 41,
    cmd: 'joinCompany',
    label: '加入单位',
    iconType: 'joinCompany',
  },
  JoinGroup: {
    sort: 42,
    cmd: 'joinGroup',
    label: '加入集群',
    iconType: 'joinGroup',
  },
  JoinStorage: {
    sort: 43,
    cmd: 'joinStorage',
    label: '申请存储',
    iconType: 'joinStorage',
  },
  JoinDepartment: {
    sort: 44,
    cmd: 'joinDepartment',
    label: '加入部门',
    iconType: 'joinDepartment',
  },
  Chat: {
    sort: 15,
    cmd: 'openChat',
    label: '打开会话',
    iconType: 'openChat',
  },
  Activate: {
    sort: 15,
    cmd: 'activate',
    label: '激活存储',
    iconType: '激活',
  },
  GenTree: {
    sort: 50,
    cmd: 'generateReportTree',
    label: '生成报表树',
    iconType: 'newReportTree',
  },
  TransferBelong: {
    sort: 200,
    cmd: 'transferBelong',
    label: '转变归属',
    iconType: 'transferBelong',
  },
};

/** 人员的申请 */
export const personJoins = {
  sort: 1,
  cmd: 'join',
  label: '申请加入',
  iconType: 'join',
  menus: [
    {
      sort: 40,
      cmd: 'joinFriend',
      label: '添加好友',
      iconType: 'joinFriend',
      model: 'outside',
    },
    {
      sort: 41,
      cmd: 'joinCohort',
      label: '加入群组',
      iconType: 'joinCohort',
      model: 'outside',
    },
    {
      sort: 42,
      cmd: 'joinCompany',
      label: '加入单位',
      iconType: 'joinCompany',
    },
  ],
};

/** 成员操作 */
export const memberOperates = {
  SettingAuth: {
    sort: 56,
    cmd: 'settingAuth',
    label: '权限设置',
    iconType: '权限',
  },
  SettingIdentity: {
    sort: 57,
    cmd: 'settingIdentity',
    label: '角色设置',
    iconType: '角色',
  },
  SettingStation: {
    sort: 58,
    cmd: 'settingStation',
    label: '岗位设置',
    iconType: 'settingStation',
  },
  Copy: {
    sort: 59,
    cmd: 'copy',
    label: '分配成员',
    iconType: 'copy',
  },
  Remove: {
    sort: 60,
    cmd: 'remove',
    label: '移除成员',
    iconType: 'remove',
  },
  Exit: {
    sort: 60,
    cmd: 'exit',
    label: '退出',
    iconType: 'exit',
  },
};

/** 会话操作 */
export const sessionOperates = {
  SetNoReaded: {
    sort: 58,
    cmd: 'readedToggle',
    label: '标记未读',
    iconType: 'setNoReaded',
  },
  SetReaded: {
    sort: 59,
    cmd: 'readedToggle',
    label: '标记已读',
    iconType: 'setReaded',
  },
  SetToping: {
    sort: 60,
    cmd: 'topingToggle',
    label: '设为常用',
    iconType: 'setCommon',
  },
  RemoveToping: {
    sort: 61,
    cmd: 'topingToggle',
    label: '取消常用',
    iconType: 'delCommon',
  },
  RemoveSession: {
    sort: 62,
    cmd: 'removeSession',
    label: '移除会话',
    iconType: 'delete',
  },
};

/** 门户操作 */
export const homeOperates = {
  SetPageTab: {
    sort: 20,
    cmd: 'setPageTab',
    label: '驻留在门户',
    iconType: 'setHomeTop',
  },
  DelPageTab: {
    sort: 20,
    cmd: 'setPageTab',
    label: '移除门户驻留',
    iconType: 'delHomeTop',
  },
};
