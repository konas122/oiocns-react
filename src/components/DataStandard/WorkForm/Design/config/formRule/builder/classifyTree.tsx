import React from 'react';
import { Select, Button } from 'antd';
import { IPerson, ICompany, IBelong } from '@/ts/core';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import ClassifyTags from './classifyTags';

import './classify.less';
import { FieldModel, FiledLookup, ClassifyTreeType } from '@/ts/base/model';

interface IProps {
  current: IBelong;
  speciesFields: FieldModel[];
  classifyTreeData: ClassifyTreeType;
  onAdd: (node: ClassifyTreeType) => void;
  onDelete: (node: ClassifyTreeType) => void;
  onRelationChange: (node: ClassifyTreeType) => void;
  onValueChange: (node: ClassifyTreeType) => void;
}

const ConditionItem: React.FC<IProps> = (props) => {
  return (
    <>
      {!props.classifyTreeData?.isTop && (
        <div className="deleteIcon">
          <Button
            type="text"
            icon={
              <CloseOutlined
                style={{ color: '#d9534f4d' }}
                onClick={() => {
                  props.onDelete(props.classifyTreeData);
                }}
              />
            }
          />
        </div>
      )}
      <div className="relation">
        <Select
          defaultValue="_all_"
          showArrow={false}
          value={props.classifyTreeData?.relation ?? '_all_'}
          style={{ width: 40 }}
          onChange={(e) => {
            const newNode = { ...props.classifyTreeData, relation: e };
            props.onRelationChange(newNode);
          }}
          options={[
            { value: '_all_', label: '与' },
            { value: '_in_', label: '或' },
          ]}
        />
      </div>
      <div className="childrenComponent">
        <ClassifyTags
          current={props.current}
          speciesFields={props.speciesFields}
          tagsValue={props.classifyTreeData.value ?? []}
          onValueChange={(value: FiledLookup[]) => {
            props.onValueChange({ ...props.classifyTreeData, value });
          }}
        />
      </div>
      <div className="addIcon">
        <Button
          type="text"
          icon={
            <PlusOutlined
              style={{ color: '#5cb85c' }}
              onClick={() => {
                props.onAdd(props.classifyTreeData);
              }}
            />
          }
        />
      </div>
    </>
  );
};

const ClassifyTree: React.FC<IProps> = (props) => {
  if (props.classifyTreeData.type === 'condition') {
    return (
      <div className="classifyContainer">
        <div className="parentLevel">
          <ConditionItem {...props} classifyTreeData={props.classifyTreeData} />
        </div>
      </div>
    );
  }

  return (
    <div className="classifyContainer">
      <div className="parentLevel">
        {!props.classifyTreeData?.isTop && (
          <div className="deleteIcon">
            <Button
              type="text"
              icon={
                <CloseOutlined
                  style={{ color: '#d9534f4d' }}
                  onClick={() => {
                    props.onDelete(props.classifyTreeData);
                  }}
                />
              }
            />
          </div>
        )}
        <div className="relation">
          <Select
            defaultValue="_and_"
            showArrow={false}
            value={props.classifyTreeData?.relation ?? '_and_'}
            style={{ width: 40 }}
            onChange={(e) => {
              const newNode = { ...props.classifyTreeData, relation: e };
              props.onRelationChange(newNode);
            }}
            options={[
              { value: '_and_', label: '与' },
              { value: '_or_', label: '或' },
            ]}
          />
        </div>
        <div className="addIcon">
          <Button
            type="text"
            icon={
              <PlusOutlined
                style={{ color: '#5cb85c' }}
                onClick={() => {
                  props.onAdd(props.classifyTreeData);
                }}
              />
            }
          />
        </div>
      </div>
      {props.classifyTreeData?.children?.length > 0 &&
        props.classifyTreeData.children.map((item: ClassifyTreeType) => {
          if (item.type == 'condition') {
            return (
              <div key={item._tempId} className="children">
                <ConditionItem {...props} classifyTreeData={item} />
              </div>
            );
          }
          if (item.type == 'group') {
            return (
              <div key={item._tempId} className="children">
                <ClassifyTree key={item._tempId} {...props} classifyTreeData={item} />
              </div>
            );
          }
        })}
    </div>
  );
};

export default ClassifyTree;
