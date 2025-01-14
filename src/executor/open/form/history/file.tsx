import OpenExecutor from '@/executor/open';
import { schema } from '@/ts/base';
import { IForm } from '@/ts/core';
import { ProTable } from '@ant-design/pro-components';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';

interface IProps {
  form: IForm;
  thing: schema.XThing;
  finished: () => void;
}

export const HistoryFileView: React.FC<IProps> = (props) => {
  const [data, setData] = useState<schema.XHistoryFile[]>([]);
  const [center, setCenter] = useState(<></>);
  useEffect(() => {
    if (props.thing.oldId) {
      props.form.loadHistoryFiles(props.thing.oldId).then((res) => {
        setData(res.data ?? []);
      });
    }
  }, []);
  return (
    <>
      <Modal
        open
        width={1200}
        bodyStyle={{
          maxHeight: '70vh',
        }}
        title="历史附件"
        onOk={props.finished}
        onCancel={props.finished}>
        <ProTable
          options={false}
          search={false}
          dataSource={data}
          columns={[
            {
              title: '文件名称',
              dataIndex: 'name',
              width: 200,
              render: (_, item) => {
                return (
                  <a
                    onClick={() => {
                      setCenter(
                        <OpenExecutor
                          cmd={'open'}
                          entity={item}
                          finished={() => setCenter(<></>)}
                        />,
                      );
                    }}>
                    {item.name}
                  </a>
                );
              },
            },
            {
              title: '文件大小',
              dataIndex: 'size',
              render: (_, item) => {
                return ((item.size ?? 0) / 1024 / 1024).toFixed(2) + 'MB';
              },
            },
            {
              title: '文件类型',
              dataIndex: 'contentType',
            },
            {
              title: '扩展名',
              dataIndex: 'extension',
            },
          ]}
        />
      </Modal>
      {center}
    </>
  );
};
