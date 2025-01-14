/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AiOutlineSmile } from 'react-icons/ai';
import { Result, Tree } from 'antd';
import SearchInput from '@/components/SearchInput';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import styles from './index.module.less';
import { schema } from '@/ts/base';
import { TargetType, IDepartment, IBelong, IPerson } from '@/ts/core';

type DeptItemType = {
  children: schema.XEntity[];
} & schema.XEntity;

type CompanySearchTableProps = {
  [key: string]: any;
  autoSelect?: boolean;
  searchCallback: (target: schema.XTarget[]) => void;
  code?: string;
  current: IBelong;
};
/*
  弹出框表格查询
*/
const JoinDepartment: React.FC<CompanySearchTableProps> = (props) => {
  const tableProps: CompanySearchTableProps = props;
  const [searchValue, setSearchValue] = useState<string>();
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [departments, setDepartments] = useState<IDepartment[] | IBelong[]>([]);
  const current = props.current as unknown as {
    departments: IDepartment[];
    user: IPerson;
  };
  useEffect(() => {
    if (tableProps.current?.typeName !== TargetType.Company) {
      handleItemSelected([tableProps.current.metadata]);
      setSearchValue(tableProps.current.metadata.name);
      setSelectedKeys([tableProps.current.metadata.id]);
    }
  }, []);
  useEffect(() => {
    if (tableProps.current?.typeName === TargetType.Company) {
      setDepartments(current.departments);
    } else {
      setDepartments([props.current]);
    }
  }, [props]);
  // 递归处理树形数据
  const mapTree = (org: IDepartment): any => {
    const flag = current.user.departments.find((i) => i.id === org.id);
    const haveChildren = Array.isArray(org.children) && org.children.length > 0;
    return {
      children: haveChildren ? org.children.map((i) => mapTree(i)) : [],
      ...org.metadata,
      disabled: flag ? true : false,
    };
  };
  const dataSource = useMemo(() => {
    return departments.map((i) => mapTree(i as IDepartment));
  }, [departments, current.user.departments]);
  const treeData = useMemo(() => {
    if (!searchValue) return dataSource ?? [];
    const result: schema.XEntity[] = [];
    const loop = (items: DeptItemType[]) => {
      items.forEach((item) => {
        if (item.name.includes(searchValue)) {
          result.push(item);
        }
        if (item.children) loop(item.children as DeptItemType[]);
      });
    };
    loop(dataSource);
    return result;
  }, [dataSource, searchValue]);
  const titleRender = useCallback((node: schema.XEntity | undefined) => {
    return (
      <div className={styles['tree-title-wrapper']}>
        <div className={styles['tree-title']}>
          <EntityIcon disableInfo entity={node} size={30} />
          {node?.name}
        </div>
      </div>
    );
  }, []);
  const handleItemSelected = (selectedNodes: any[]) => {
    tableProps.searchCallback(selectedNodes);
  };
  return (
    <div className={styles[`search-card`]}>
      <SearchInput
        value={searchValue}
        placeholder={'请输入部门的名称'}
        onChange={async (event) => {
          setSearchValue(event.target.value);
          handleItemSelected([]);
          setSelectedKeys([]);
        }}
      />
      <Tree
        rootClassName={styles['dept-tree']}
        treeData={treeData}
        fieldNames={{ title: 'name', key: 'id', children: 'children' }}
        titleRender={titleRender}
        expandedKeys={expandedKeys}
        multiple
        height={400}
        onExpand={setExpandedKeys}
        selectedKeys={selectedKeys}
        onSelect={(keys, info) => {
          setSelectedKeys(keys);
          handleItemSelected(info.selectedNodes);
        }}
      />
      {treeData.length == 0 && (
        <Result icon={<AiOutlineSmile />} title={`抱歉，没有查询到相关的结果`} />
      )}
    </div>
  );
};

export default JoinDepartment;
