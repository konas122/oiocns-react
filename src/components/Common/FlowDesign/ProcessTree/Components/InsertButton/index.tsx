import { Popover } from 'antd';
import * as ai from 'react-icons/ai';
import React, { useState } from 'react';
import cls from './index.module.less';
import { AddNodeType } from '@/utils/work';
import { PlusOutlined } from '@ant-design/icons';

type InsertButtonProps = {
  onInsertNode: Function;
  allowBranche?: boolean;
  isGroupWork: boolean;
};

/**
 * 插入节点 对话框
 * @returns
 */
const InsertButton: React.FC<InsertButtonProps> = (props: any) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      title={<span>添加流程节点</span>}
      content={
        <div className={cls[`node-select`]}>
          <div
            onClick={() => {
              props.onInsertNode(AddNodeType.APPROVAL);
              setOpen(false);
            }}>
            <ai.AiOutlineTeam color="#3296fa" />
            <span>审核</span>
          </div>
          <div
            onClick={() => {
              props.onInsertNode(AddNodeType.CC);
              setOpen(false);
            }}>
            <ai.AiOutlineSend color="#ff943e" />
            <span>抄送</span>
          </div>
          {props.allowBranche && (
            <>
              <div
                onClick={() => {
                  props.onInsertNode(AddNodeType.CONDITION);
                  setOpen(false);
                }}>
                <ai.AiOutlineShareAlt color="#15bc83" />
                <span>条件审核</span>
              </div>
              <div
                onClick={() => {
                  props.onInsertNode(AddNodeType.CONCURRENTS);
                  setOpen(false);
                }}>
                <ai.AiOutlineCluster color="#718dff" />
                <span>同时审核</span>
              </div>
            </>
          )}
          {!props.isGroupWork && (
            <>
              <div
                onClick={() => {
                  props.onInsertNode(AddNodeType.Confluence);
                  setOpen(false);
                }}>
                <ai.AiOutlineSend color="#ff943e" />
                <span>汇流网关</span>
              </div>
              <div
                onClick={() => {
                  props.onInsertNode(AddNodeType.CUSTOM);
                  setOpen(false);
                }}>
                <ai.AiOutlineApartment color="#7f6dac" />
                <span>自由节点</span>
              </div>
              <div
                onClick={() => {
                  props.onInsertNode(AddNodeType.ORGANIZATIONA);
                  setOpen(false);
                }}>
                <ai.AiOutlineApartment color="#7f6dac" />
                <span>组织网关</span>
              </div>
              <div
                onClick={() => {
                  props.onInsertNode(AddNodeType.GATEWAY);
                  setOpen(false);
                }}>
                <ai.AiOutlineForm color="#af343e" />
                <span>分流网关</span>
              </div>
            </>
          )}
        </div>
      }
      trigger="click">
      <div className={cls[`node-addIcon`]} onClick={() => setOpen(true)}>
        <PlusOutlined />
        添加
      </div>
    </Popover>
  );
};

export default InsertButton;
