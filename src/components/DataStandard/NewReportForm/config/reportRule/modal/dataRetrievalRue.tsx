import { MonacoEditor } from '@/components/Common/MonacoEditor';
import { IReport } from '@/ts/core';
import { isLoadOptions } from '@/utils';
import message from '@/utils/message';
import { Button, Input, Modal, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';

interface IProps {
  targetId: string;
  current: IReport;
  data: any;
  onOk: (rule: any) => void;
  onCancel: () => void;
}

const DataRetrievalRue: React.FC<IProps> = (props) => {
  const [loading, setLoading] = useState(false);

  const [queryOptionsCode, setQueryOptionsCode] = useState(`{
    "filter": [
        [
            "id",
            "<>",
            null
        ],
        "and",
        [
            "id",
            "<>",
            ""
        ]
    ],
    "options": {
        "match": {
            "isDeleted": false
        },
        "extra": [
            {
                "group": {
                    "key": []
                }
            },
            {
                "project": {
                    "_id": 0
                }
            },
            {
                "limit": 1
            }
        ]
    }
}`);

  const [groups, setGroups] = useState<any[]>([]);

  const [filterCode, setFilterCode] = useState(`
  // data 变量是请求结果值
  return data;
`);
  const [collName, setCollName] = useState('');
  const [group, setGroup] = useState('');
  const [dataRetrievalInfo, setDataRetrievalInfo] = useState<any>({
    rawResult: null,
    calculatedResult: null,
  });

  const { Option } = Select;

  useEffect(() => {
    if (props?.data) {
      const { collName, group, queryOptionsCode, filterCode, dataRetrievalInfo } =
        JSON.parse(props.data);
      setQueryOptionsCode(queryOptionsCode);
      setFilterCode(filterCode);
      setDataRetrievalInfo(dataRetrievalInfo);
      setCollName(collName);
      setGroup(group || '');
    }
  }, [props.data]);

  useEffect(() => {
    const targets = props.current.target.targets;
    const relevantTargets = targets.filter((item: any) =>
      ['单位', '组织群'].includes(item.typeName),
    );
    setGroups(
      relevantTargets.map((item: any) => ({
        name: item.name,
        id: item.id,
      })),
    );
  }, [props.current]);

  const fetchSummary = async () => {
    try {
      if (queryOptionsCode) {
        const tempQueryOptionsCode =
          typeof queryOptionsCode === 'object'
            ? queryOptionsCode
            : JSON.parse(
                queryOptionsCode.replaceAll('$belongId', props.current.belongId),
              );
        const isOptions = isLoadOptions(tempQueryOptionsCode);
        // 符合查询规范
        if (isOptions.success) {
          if (tempQueryOptionsCode.options.match && group != '') {
            if (
              tempQueryOptionsCode.options.match.belongId.indexOf('$belongId') != '-1'
            ) {
              tempQueryOptionsCode.options.match.belongId = props.current.belongId;
            }
          }
          setLoading(true);
          const result = await props.current.fetchSummary(tempQueryOptionsCode);
          setDataRetrievalInfo({
            ...dataRetrievalInfo,
            rawResult: JSON.stringify(result),
          });

          setTimeout(() => {
            setLoading(false);
          }, 300);
        } else {
          setDataRetrievalInfo({
            ...dataRetrievalInfo,
            rawResult: isOptions.msg,
          });
        }
      }
    } catch (error) {
      setDataRetrievalInfo({
        ...dataRetrievalInfo,
        rawResult: error,
      });
      setLoading(false);
    }
  };

  const calcResult = () => {
    try {
      const data =
        typeof dataRetrievalInfo.rawResult === 'object'
          ? dataRetrievalInfo.rawResult
          : JSON.parse(dataRetrievalInfo.rawResult);

      const filter = new Function('data', filterCode);
      const result = filter(data);
      if (['object', 'function', 'symbol'].includes(typeof result)) {
        message.warn('计算结果类型不符合预期，若非有意请修改过滤函数重新计算。');
      }
      setDataRetrievalInfo({
        ...dataRetrievalInfo,
        calculatedResult: JSON.stringify(result),
      });
    } catch (error) {
      setDataRetrievalInfo({
        ...dataRetrievalInfo,
        calculatedResult: error,
      });
    }
  };
  return (
    <Modal
      destroyOnClose
      title={'取数规则'}
      width={960}
      open={true}
      bodyStyle={{ border: 'none', padding: 0, marginLeft: '32px', marginRight: '32px' }}
      onOk={() => {
        try {
          if (!collName) {
            message.error('集合名称不能为空！');
            return;
          }
          props.onOk.apply(this, [
            {
              collName,
              group,
              dataRetrievalInfo,
              filterCode,
              queryOptionsCode,
            },
          ]);
        } catch (error) {
          console.log('error', error);
        }
      }}
      onCancel={props.onCancel}>
      <>
        <Space direction="vertical" size={15} style={{ width: '100%' }}>
          <span>集合名</span>
          <Input
            value={collName}
            onChange={(e) => {
              setCollName(e.target.value);
            }}
          />
          <span>集群</span>
          <Select
            style={{ width: '100%' }}
            allowClear={true}
            value={group}
            onChange={(e) => {
              setGroup(e);
            }}>
            {groups.map((option: any, index: number) => (
              <Option key={index} value={option.id}>
                {option.name}
              </Option>
            ))}
          </Select>
          <span>查询参数</span>
          <MonacoEditor
            value={queryOptionsCode}
            language="json"
            onChange={setQueryOptionsCode}
            style={{ height: '200px' }}
          />
          <Button loading={loading} onClick={() => fetchSummary()}>
            发送请求
          </Button>
          <span>返回结果</span>
          <Input.TextArea
            value={dataRetrievalInfo.rawResult ?? {}}
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
          <span>过滤器函数编辑器</span>
          <MonacoEditor
            value={filterCode}
            language="javascript"
            onChange={setFilterCode}
            style={{ height: '200px' }}
          />

          <Space>
            <Button onClick={() => calcResult()}>计算结果</Button>{' '}
            <Input style={{ width: 350 }} value={dataRetrievalInfo.calculatedResult} />
          </Space>
        </Space>
      </>
    </Modal>
  );
};
export default DataRetrievalRue;
