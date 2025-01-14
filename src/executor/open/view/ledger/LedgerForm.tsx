import FullScreenModal from '@/components/Common/fullScreen';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import LoadingView from '@/components/Common/Loading';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import type { IDirectory, IFinancial, IView } from '@/ts/core';
import { Empty, message, TreeSelect } from 'antd';
import React, { memo, useEffect, useRef, useState } from 'react';
import FormBrowser from './components/FormBrowser';
import { findPathByValue, loadTreeItemMenu } from './utils';

interface IProps {
  isFull?: boolean;
  current: IView;
  form: schema.XForm;
  directory: IDirectory;
  finished?: () => void;
}

/**
 * 总账视图
 * @returns
 */
const LedgerForm = ({ isFull = true, current, form, directory, finished }: IProps) => {
  const typeName = directory?.target?.typeName;
  const belong = directory.target.space;
  const financial: IFinancial = belong.financial;
  const loadOptions = useRef<{
    extraReations: string | string[];
  }>({
    extraReations: '',
  });
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [company, setCompany] = useState<string | undefined>(directory.spaceId);
  const [period, setPeriod] = useState<[string, string]>(); // 最新账期
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // 是否管理员
  const [latestAndOldestBillingPeriods, setLatestAndOldestBillingPeriods] =
    useState<[string, string]>(); // 最新与最旧账期
  const [loaded] = useAsyncLoad(() => financial.loadContent(), []);
  useEffect(() => {
    isAdminOfCompany();
  }, []);

  useEffect(() => {
    if (typeName === '组织群') {
      const getTreeItemMenu = async () => {
        const result = [...(await loadTreeItemMenu(form, directory))];
        if (Array.isArray(result) && result.length > 0) {
          generateExtraReations(directory.spaceId, result);
        } else {
          getLatestPeriods();
        }
      };
      getTreeItemMenu();
    } else {
      getLatestPeriods();
    }
  }, [form]);

  /**
   * 生成关系
   */
  const generateExtraReations = (id: string, treeData: any[]) => {
    const reationsPath = findPathByValue(treeData, id);
    loadOptions.current.extraReations = reationsPath;
    setTreeData(treeData);
    getLatestPeriods();
  };

  /**
   * 加载账期
   */
  const getLatestPeriods = async () => {
    try {
      const periods = await financial.loadPeriods(true, 0, 12 * 6, loadOptions.current);
      if (periods.length) {
        // 最新账期
        const latestPeriodStr = periods[0].metadata.period;
        // 最旧账期
        const oldPeriodStr = periods[periods.length - 1].metadata.period;
        setPeriod([latestPeriodStr, latestPeriodStr]);
        setLatestAndOldestBillingPeriods([oldPeriodStr, latestPeriodStr]);
      }
      setIsLoaded(true);
    } catch (error) {
      message.error('加载账期失败');
    }
  };

  /**
   * 是否某个单位的管理员
   * @param cid
   */
  const isAdminOfCompany = async (cid: string | number = directory.spaceId) => {
    try {
      const currentCompany = orgCtrl.targets.find((item) => item.id === cid);
      const currentAdmin = currentCompany?.identitys.find(
        (item) => item.code === 'super-auth',
      );
      const adminUsers = await currentAdmin?.loadMembers();
      const isAdmin = adminUsers?.some((item) => item.id === orgCtrl.user.id);
      setIsAdmin(isAdmin ?? false);
    } catch {
      setIsAdmin(false);
    }
  };

  // 切换单位
  const onChangeCompany = (newValue: string) => {
    setIsLoaded(false);
    setCompany(newValue);
    setPeriod(undefined);
    isAdminOfCompany(newValue);
    generateExtraReations(newValue, treeData);
  };

  const PageContent = () => {
    if (loaded && isLoaded) {
      return (
        <>
          {typeName === '组织群' && treeData && (
            <TreeSelect
              showSearch
              style={{
                fontSize: 16,
                margin: '12px 0',
              }}
              value={company}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto', minWidth: 300 }}
              placeholder="请选择"
              allowClear
              treeNodeFilterProp="label"
              treeDefaultExpandAll
              onChange={onChangeCompany}
              treeData={treeData as any}
            />
          )}

          {isAdmin ? (
            <>
              {period ? (
                <FormBrowser
                  treeData={treeData}
                  period={period}
                  current={current}
                  form={form}
                  directory={directory}
                  loadOptions={loadOptions.current}
                  latestAndOldestBillingPeriods={latestAndOldestBillingPeriods}
                  onUpdatePeriod={(value: any) => {
                    setPeriod(value);
                  }}
                />
              ) : (
                <Empty
                  image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                  imageStyle={{
                    height: 300,
                  }}
                  description="该单位账期为空"
                />
              )}
            </>
          ) : (
            <Empty
              image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
              imageStyle={{
                height: 300,
              }}
              description="该视图暂不支持非管理员查看"
            />
          )}
        </>
      );
    } else {
      return (
        <div className="loading-page">
          <LoadingView text="配置信息加载中..." />
        </div>
      );
    }
  };

  return (
    <>
      {isFull ? (
        <FullScreenModal
          centered
          open={true}
          fullScreen
          width={'80vw'}
          title={form.name}
          bodyHeight={'80vh'}
          icon={<EntityIcon entityId={form.id} />}
          destroyOnClose
          onCancel={() => finished && finished()}>
          <PageContent />
        </FullScreenModal>
      ) : (
        <div style={{ overflowY: 'scroll', height: '100vh' }}>
          <PageContent />
          <div style={{ height: 120 }}></div>
        </div>
      )}
    </>
  );
};

export default memo(LedgerForm);
