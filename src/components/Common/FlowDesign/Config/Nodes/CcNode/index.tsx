import React, { useEffect, useState } from 'react';
import { Card, Divider } from 'antd';
import cls from './index.module.less';
import { WorkNodeDisplayModel } from '@/utils/work';
import ShareShowComp from '@/components/Common/ShareShowComp';
import { IAuthority, IBelong, IWork } from '@/ts/core';
import SelectIdentity from '@/components/Common/SelectIdentity';
import { SelectBox } from 'devextreme-react';
import OpenFileDialog from '@/components/OpenFileDialog';
import SelectAuth from '@/components/Common/SelectAuth';

interface IProps {
  work: IWork;
  current: WorkNodeDisplayModel;
  isGroupWork: boolean;
  belong: IBelong;
  refresh: () => void;
}
/**
 * @description: 抄送对象
 * @return {*}
 */

const CcNode: React.FC<IProps> = (props) => {
  const [destType, setDestType] = useState<string>();
  const [openType, setOpenType] = useState<string>(''); // 打开弹窗
  const [currentData, setCurrentData] = useState<{ id: string; name: string }>();
  const [destTypeSource, setDestTypeSource] = useState<
    {
      label: string;
      value: string;
    }[]
  >();

  useEffect(() => {
    if (props.isGroupWork) {
      setDestTypeSource([{ value: '角色', label: '指定角色' }]);
      setDestType('角色');
    } else {
      setDestTypeSource([
        { value: '身份', label: '指定角色' },
        { value: '其他办事', label: '其他办事' },
        { value: '发起人', label: '发起人' },
      ]);
      setDestType(props.current.destType ?? '身份');
    }
    props.current.primaryForms = props.current.primaryForms || [];
    props.current.executors = props.current.executors || [];
    setCurrentData({
      id: props.current.destId,
      name: props.current.destName,
    });
  }, [props.current]);
  const loadDestType = () => {
    switch (destType) {
      case '身份': {
        return (
          <>
            {currentData && (
              <ShareShowComp
                key={'审核对象'}
                departData={[currentData]}
                deleteFuc={(_) => {
                  props.current.destId = '';
                  props.current.destName = '';
                  setCurrentData(undefined);
                  props.refresh();
                }}
              />
            )}
          </>
        );
      }
      case '角色':
        return (
          <SelectAuth
            excludeAll
            disableExp={(auth: IAuthority) => {
              return auth.metadata.shareId != props.work.metadata.shareId;
            }}
            space={props.belong}
            value={props.current.destId}
            onChange={(value, label) => {
              if (props.current.destId !== value) {
                props.current.destType = '角色';
                props.current.destName = '角色: ' + label;
                props.current.destId = value;
                props.refresh();
              }
            }}
          />
        );
      case '发起人':
        return <a>发起人</a>;
      default:
        return (
          <>
            {currentData && (
              <ShareShowComp
                key={'审核对象'}
                departData={[currentData]}
                deleteFuc={(_) => {
                  props.current.destId = '';
                  props.current.destName = '';
                  setCurrentData(undefined);
                  props.refresh();
                }}
              />
            )}
          </>
        );
    }
  };
  const loadDialog = () => {
    switch (openType) {
      case '身份':
        return (
          <SelectIdentity
            open={openType == '身份'}
            exclude={[]}
            multiple={false}
            space={props.belong}
            finished={(selected) => {
              if (selected.length > 0) {
                const item = selected[0];
                props.current.destType = '身份';
                props.current.destId = item.id;
                props.current.destName = item.name;
                setCurrentData(item);
                props.refresh();
              }
              setOpenType('');
            }}
          />
        );
      case '其他办事':
        return (
          <OpenFileDialog
            title={'选择其它办事'}
            rootKey={'disk'}
            accepts={['办事', '集群模板']}
            allowInherited
            excludeIds={[props.work.id]}
            onCancel={() => setOpenType('')}
            onOk={(files) => {
              if (files.length > 0) {
                const work = files[0] as IWork;
                let name = `${work.name} [${work.directory.target.name}]`;
                props.current.destName = name;
                props.current.destId = work.metadata.primaryId;
                props.current.destShareId = work.metadata.shareId;
                setCurrentData({ id: work.id, name: name });
              } else {
                setCurrentData({
                  id: '',
                  name: '',
                });
              }
              setOpenType('');
              props.refresh();
            }}
          />
        );
      default:
        return <></>;
    }
  };
  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>抄送对象</span>
            </div>
          }
          className={cls[`card-info`]}
          extra={
            <>
              <SelectBox
                value={destType}
                valueExpr={'value'}
                displayExpr={'label'}
                style={{ width: 120, display: 'inline-block' }}
                onSelectionChanged={(e) => {
                  switch (e.selectedItem.value) {
                    case '身份':
                      props.current.destType = '身份';
                      setCurrentData(undefined);
                      break;
                    case '角色':
                      props.current.num = 1;
                      props.current.destType = '角色';
                      setCurrentData(undefined);
                      break;
                    case '其他办事':
                      props.current.destType = '其他办事';
                      setCurrentData(undefined);
                      break;
                    case '发起人':
                      props.current.num = 1;
                      props.current.destId = '1';
                      props.current.destName = '发起人';
                      props.current.destType = '发起人';
                      setCurrentData({ id: '1', name: '发起人' });
                      break;
                    default:
                      break;
                  }
                  if (destType != e.selectedItem.value) {
                    setDestType(e.selectedItem.value);
                    props.refresh();
                  }
                }}
                dataSource={destTypeSource}
              />
              {!['发起人', '角色', undefined].includes(destType) && (
                <>
                  <a
                    style={{ paddingLeft: 10, display: 'inline-block' }}
                    onClick={() => {
                      setOpenType(destType!);
                    }}>
                    {`+ 选择${destType === '身份' ? '角色' : destType}`}
                  </a>
                </>
              )}
            </>
          }>
          {loadDestType()}
        </Card>
        {loadDialog()}
      </div>
    </div>
  );
};
export default CcNode;
