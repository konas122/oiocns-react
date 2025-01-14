import OpenFileDialog from '@/components/OpenFileDialog';
import { model } from '@/ts/base';
import { MallOrderSyncExecutor } from '@/ts/base/model';
import { IForm, IWork } from '@/ts/core';
import { Space } from 'antd';
import { SelectBox, TextBox } from 'devextreme-react';
import React, { useEffect, useState } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { Common } from '../index';
import styles from './index.module.less';

interface CommonProps<T extends model.Executor = model.Executor> {
  executor: T;
  deleteFuc: (id: string) => void;
}

// 商城订单同步
interface MallOrderSyncProps extends CommonProps<MallOrderSyncExecutor> {
  work: IWork;
}

const MallOrderSync: React.FC<MallOrderSyncProps> = (props) => {
  const formsDataSource = [...props.work.detailForms, ...props.work.primaryForms];
  const [currentFormId, setCurrentFormId] = useState('');
  const [forms, setForms] = useState<any>(
    props?.executor?.mallOrderSyncForm?.forms ?? [],
  );
  const [identifier, setIdentifier] = useState<any>(
    props?.executor?.mallOrderSyncForm?.identifier ?? null,
  );

  const [openDialog, setDialog] = React.useState(false);
  const showDialog = React.useCallback(() => setDialog(true), []);

  useEffect(() => {
    const collName = props.executor.mallOrderSyncForm?.collName ?? '-public-gwc';
    if (props.executor?.mallOrderSyncForm) {
      props.executor.mallOrderSyncForm.collName = collName;
    } else {
      props.executor.mallOrderSyncForm = {
        forms: [],
        collName: collName,
      };
    }
  }, [props.executor]);

  const handleRemove = (index: number) => {
    const newData = forms;
    newData.splice(index, 1);
    props.executor.mallOrderSyncForm.forms = newData;
    setForms([...newData]);
  };

  const handleAdd = () => {
    const form = formsDataSource.find((f) => f.id === currentFormId);
    if (form) {
      const newData = [...forms, (form as IForm).metadata];
      if (props?.executor?.mallOrderSyncForm) {
        props.executor.mallOrderSyncForm.forms = newData;
      } else {
        props.executor.mallOrderSyncForm = {
          forms: newData,
        };
      }
      setForms(newData);
    }
  };

  return (
    <Common executor={props.executor} deleteFuc={props.deleteFuc}>
      <Space
        direction="vertical"
        style={{
          width: '100%',
        }}>
        <Space
          direction="vertical"
          style={{
            width: '100%',
          }}>
          <span style={{ fontWeight: 500 }}>配置同步表单</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              justifyContent: 'space-between',
            }}>
            <SelectBox
              key="selectBox"
              showClearButton
              style={{
                flex: '1 1 auto',
                marginRight: '12px',
              }}
              displayExpr={'text'}
              valueExpr={'value'}
              dataSource={formsDataSource
                .filter(
                  (item1) =>
                    !(props.executor.mallOrderSyncForm?.forms ?? []).some(
                      (item2: IForm) => item2.id === item1.metadata.id,
                    ),
                )
                .map((item) => {
                  return { ...item, text: item.name, value: item.id };
                })}
              onValueChange={(e) => {
                setCurrentFormId(e);
              }}
            />

            <a onClick={() => handleAdd()}>添加</a>
          </div>

          {forms && Array.isArray(forms) && forms.length > 0 ? (
            <>
              {forms.map((item, index) => {
                return (
                  <div key={index} style={{ display: 'flex' }}>
                    <div
                      key={item.id}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                      <div>{item.name}</div>
                    </div>
                    <AiOutlineCloseCircle
                      onClick={() => handleRemove(index)}
                      style={{ fontSize: 'px' }}
                    />
                  </div>
                );
              })}
            </>
          ) : (
            <div>暂无数据</div>
          )}
        </Space>

        <Space>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}>
            <div style={{ fontWeight: 500 }}>配置数据集</div>
            <TextBox
              width={'100%'}
              label="数据集名称"
              defaultValue={props.executor.mallOrderSyncForm?.collName ?? '-public-gwc'}
              labelMode="floating"
              onValueChange={(value) => {
                props.executor.mallOrderSyncForm.collName = value;
              }}
            />
          </div>
        </Space>

        <Space direction="vertical" className={styles.space}>
          <div className={styles.justify}>
            <span style={{ fontWeight: 500 }}>配置标识</span>
            <a onClick={showDialog}>+ 添加属性</a>
          </div>
          <div className={styles.justify}>
            {identifier ? (
              <>
                <span>{identifier?.name}</span>
                <span>
                  <AiOutlineCloseCircle
                    onClick={() => setIdentifier(null)}
                    style={{ fontSize: 'px' }}
                  />
                </span>
              </>
            ) : (
              '未配置'
            )}
          </div>
        </Space>
      </Space>

      {openDialog && (
        <OpenFileDialog
          title={`选择属性`}
          accepts={['属性']}
          rootKey={props.work.directory.spaceKey}
          onCancel={() => setDialog(false)}
          onOk={(files) => {
            if (files && files.length > 0) {
              const item = files[0];
              const data = {
                propId: item.id,
                property: item.metadata,
                ...item.metadata,
                id: 'snowId()',
                rule: '{}',
                options: {
                  visible: true,
                  isRequired: true,
                },
              };
              props.executor.mallOrderSyncForm.identifier = data;
              setIdentifier(data);
            }
            setDialog(false);
          }}
        />
      )}
    </Common>
  );
};

export default MallOrderSync;
