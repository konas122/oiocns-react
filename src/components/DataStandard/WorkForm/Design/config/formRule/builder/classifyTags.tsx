import React, { useState } from 'react';
import { Tag, Button, Tooltip } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { IPerson, ICompany, IBelong } from '@/ts/core';
import LabelsSelect from '../modal/labelsSelect';
import './classify.less';
import { FieldModel, FiledLookup } from '@/ts/base/model';

interface IProps {
  current: IBelong;
  tagsValue: FiledLookup[];
  speciesFields: FieldModel[];
  onValueChange: (value: FiledLookup[]) => void;
}

const ClassifyTags: React.FC<IProps> = (props) => {
  const [isShowModal, setIsShowModal] = useState<boolean>(false);
  return (
    <div className="classifyTags">
      <div className="tags">
        {props?.tagsValue.length > 0 &&
          props.tagsValue.map((item) => {
            return (
              <Tooltip key={item.id} title={item.text + ' ' + item.value}>
                <Tag>{item.text}</Tag>
              </Tooltip>
            );
          })}
        {props?.tagsValue.length == 0 && <span className="placeholder">请设置分类</span>}
      </div>
      <Button
        type="text"
        icon={
          <EditOutlined
            style={{ color: '#d9534f4d' }}
            onClick={() => {
              setIsShowModal(true);
            }}
          />
        }
      />
      {isShowModal && (
        <LabelsSelect
          current={props.current}
          extendTags={['表单', '报表',  '字典', '部门', '人员']}
          speciesFields={props.speciesFields}
          tagsValue={props.tagsValue}
          onOk={(value: FiledLookup[]) => {
            setIsShowModal(false);
            props.onValueChange(value);
          }}
          onCancel={() => {
            setIsShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ClassifyTags;
