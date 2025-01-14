/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { AiOutlineSmile } from 'react-icons/ai';
import { Result, Row, Col, Descriptions, Space, Tag } from 'antd';
import { CheckCard } from '@ant-design/pro-components';
import SearchInput from '@/components/SearchInput';
import styles from './index.module.less';
import { XTarget } from '@/ts/base/schema';
import orgCtrl from '@/ts/controller';
import { TargetType } from '@/ts/core';
import TeamIcon from '@/components/Common/GlobalComps/entityIcon';

type CompanySearchTableProps = {
  [key: string]: any;
  autoSelect?: boolean;
  searchType: TargetType;
  searchTypes?: TargetType[];
  searchCallback: (target: XTarget[]) => void;
  belongId?: string;
  code?: string;
};

/*
  弹出框表格查询
*/
const SearchTarget: React.FC<CompanySearchTableProps> = (props) => {
  const tableProps: CompanySearchTableProps = props;
  const [checked, setChecked] = useState<string[]>([]);
  const [searchKey, setSearchKey] = useState<string>();
  const [dataSource, setDataSource] = useState<XTarget[]>([]);
  const [searchPlace, setSearchPlace] = useState<string>();
  const searchTypes = props.searchTypes ?? [props.searchType];

  useEffect(() => {
    switch (tableProps.searchType) {
      case TargetType.Person:
        setSearchPlace('请输入用户的账号');
        break;
      case TargetType.Storage:
        setSearchPlace('请输入存储资源代码');
        break;
      case TargetType.Company:
        setSearchPlace('请输入单位的社会统一信用代码');
        break;
      case TargetType.Group:
        setSearchPlace('请输入组织集群的编码');
        break;
      case TargetType.Cohort:
        setSearchPlace('请输入群组的编码');
        break;
      case TargetType.Department:
      case TargetType.College:
      case TargetType.Office:
      case TargetType.Section:
      case TargetType.Major:
      case TargetType.Working:
      case TargetType.Research:
      case TargetType.Laboratory:
        setSearchKey(props.code);
        setSearchPlace('请输入部门的编码');
        break;
    }
    if (searchTypes.length > 1) {
      setSearchPlace('请输入任意代码');
    }
  }, [props]);

  useEffect(() => {
    if (searchKey) {
      searchList(searchKey);
    }
  }, [searchKey]);

  const searchList = async (searchCode: string) => {
    if (searchCode) {
      let res = [];
      res = await orgCtrl.user.searchTargets(searchCode, searchTypes);
      if (props.belongId) {
        res = res.filter((item) => {
          return item.belongId === props.belongId;
        });
      }
      setDataSource(res);
      if (props.autoSelect) {
        setChecked(res.map((i) => i.id));
        tableProps.searchCallback(res);
      }
    }
  };

  // 单位卡片渲染
  const personInfoList = () => {
    return (
      <CheckCard.Group
        bordered={false}
        multiple
        value={checked}
        style={{ width: '100%' }}
        onChange={(value: any) => {
          setChecked(value);
          let checkObjs: XTarget[] = [];
          for (const target of dataSource) {
            if (value.includes(target.id)) {
              checkObjs.push(target);
            }
          }
          tableProps.searchCallback(checkObjs);
        }}>
        <Row gutter={16} style={{ width: '100%' }}>
          {dataSource.map((target) => (
            <Col span={24} key={target.id}>
              <CheckCard
                bordered
                style={{ width: '100%' }}
                className={`${styles.card}`}
                avatar={
                  <TeamIcon
                    entity={target}
                    disableInfo={target.typeName === '人员'}
                    size={60}
                  />
                }
                title={
                  <Space>
                    {target.name}
                    <Tag color="blue">账号：{target.code}</Tag>
                  </Space>
                }
                value={target.id}
                key={target.id}
                description={
                  <Descriptions column={2} size="small" style={{ marginTop: 16 }}>
                    <Descriptions.Item label="简介" span={2}>
                      {target.remark}
                    </Descriptions.Item>
                  </Descriptions>
                }
              />
            </Col>
          ))}
        </Row>
      </CheckCard.Group>
    );
  };

  return (
    <div className={styles[`search-card`]}>
      <SearchInput
        value={searchKey}
        placeholder={searchPlace}
        onChange={async (event) => {
          setSearchKey(event.target.value);
        }}
      />
      {dataSource.length > 0 && personInfoList()}
      {searchKey && dataSource.length == 0 && (
        <Result icon={<AiOutlineSmile />} title={`抱歉，没有查询到相关的结果`} />
      )}
    </div>
  );
};

export default SearchTarget;
