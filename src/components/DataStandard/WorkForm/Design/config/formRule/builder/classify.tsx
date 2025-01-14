import React, { useEffect, useState } from 'react';
import { IPerson, ICompany, IBelong } from '@/ts/core';
import ClassifyTree from './classifyTree';
import message from '@/utils/message';
import { FieldModel, ClassifyTreeType } from '@/ts/base/model';

import './index.less';

interface IProps {
  current: IBelong;
  speciesFields: FieldModel[];
  classifyTreeData: ClassifyTreeType;
  onChange: (value: any) => void;
}

const Classify: React.FC<IProps> = (props) => {
  const [classifyTreeData, setClassifyTreeData] = useState(props.classifyTreeData ?? {});

  // 递归设置临时ID
  const resetTreeData = (obj: any) => {
    let result = { ...obj };
    if (obj.isTop) {
      result['_tempId'] = '1';
      result['parentId'] = null;
    }
    if (obj?.children?.length > 0) {
      let arr: any = [];
      obj.children.forEach((item: any, inx: number) => {
        let _obj = {
          ...item,
          _tempId: result._tempId + '-' + String(inx),
          parentId: result._tempId,
        };
        _obj = resetTreeData(_obj);
        arr.push(_obj);
      });
      result.children = arr;
    }
    return result;
  };

  useEffect(() => {
    setClassifyTreeData(resetTreeData({ ...props.classifyTreeData, isTop: true }));
  }, [props.classifyTreeData]);

  // 根据临时生成的节点ID，删除对应节点;
  const removeNodeById = (tree: any, _tempId: string) => {
    let newTree: any = [];
    newTree = tree.filter((node: any) => {
      if (node._tempId === _tempId) {
        return false;
      }
      if (node.children && node.children.length > 0) {
        const _arr = removeNodeById(node.children, _tempId);
        if (_arr.length === 1) {
          node;
        }
        node.children = removeNodeById(node.children, _tempId);
      }
      return true;
    });
    return JSON.parse(JSON.stringify(newTree));
  };

  // 筛选只有一个子级或者无子级的节点
  const findSingleOrNoChildrenNodes = (data: any) => {
    let result: any = [];
    function search(node: any) {
      if (node.children && node.children.length <= 1) {
        result.push(node);
      }
      if (node.children && node.children.length > 1) {
        for (let child of node.children) {
          search(child);
        }
      }
    }
    search(data);
    return result;
  };

  // 寻找目标节点并替换位置
  const deleteAndReplaceNode = (treeNode: any): any => {
    const singleChildrenNodes = findSingleOrNoChildrenNodes(treeNode);
    const keys = singleChildrenNodes.map((it: any) => it._tempId);
    function deepReplaceNode(treeNode: any) {
      if (keys.includes(treeNode._tempId)) {
        return treeNode.children[0];
      } else {
        if (treeNode.children && treeNode.children.length > 1) {
          let newChild: any = [];
          treeNode.children.forEach((it: any) => {
            newChild.push(deepReplaceNode(it));
          });
          treeNode.children = newChild;
        }
        return treeNode;
      }
    }
    if (keys.length && keys.length > 0) {
      treeNode = deepReplaceNode(treeNode);
      return deleteAndReplaceNode(treeNode);
    } else {
      return treeNode;
    }
  };

  // 新增时，生成空数据填充节点
  const createEmptyData = (node: any) => {
    const conditionEmptyData = { type: 'condition', relation: '_all_', value: [] };
    if (node.type === 'condition') {
      let obj = JSON.parse(JSON.stringify(node));
      let result: any = {
        type: 'group',
        relation: '_and_',
        isTop: node.isTop,
      };

      if (obj.isTop) {
        result['isTop'] = node.isTop;
        delete obj.isTop;
      }
      result['children'] = [obj, conditionEmptyData];
      return result;
    } else {
      return { ...node, children: [...node.children, conditionEmptyData] };
    }
  };

  // 更新节点
  const updateNodeByTempId = (treeNode: any, _tempId: string, newNodeData: any) => {
    if (treeNode._tempId === _tempId) {
      treeNode = newNodeData;
    } else {
      if (treeNode.children && treeNode.children.length > 0) {
        let arr: any = [];
        treeNode.children.forEach((node: any) => {
          arr.push(updateNodeByTempId(node, _tempId, newNodeData));
        });
        treeNode.children = arr;
      }
    }
    return treeNode;
  };

  // 递归寻找value为空的叶子节点
  const getEmptyValueNode = (treeNode: any) => {
    let result: any = [];
    if (treeNode.type === 'condition') {
      if (treeNode.value && treeNode.value.length === 0) {
        result.push(treeNode);
      }
    } else {
      if (treeNode.children.length > 0) {
        treeNode.children.forEach((it: any) => {
          result = [...result, ...getEmptyValueNode(it)];
        });
      }
    }
    return result;
  };

  // 递归获取分类设置数据
  const getValueDeepTreeData = (arr: any) => {
    if (arr.length > 0) {
      let result: any = [];
      arr.forEach((item: any) => {
        if (item.type === 'condition') {
          result.push({
            labels: { [item.relation]: item.value.map((it: any) => it.value) },
          });
        } else {
          let obj = {
            [item.relation]: getValueDeepTreeData(item.children),
          };
          result.push(obj);
        }
      });
      return result;
    }
  };

  // 删除所有的临时ID
  const deleteTempInfo = (treeNode: any) => {
    let result = {};
    let obj = { ...treeNode };
    delete obj['isTop'];
    delete obj['parentId'];
    delete obj['_tempId'];
    if (obj.children && obj.children.length > 0) {
      let arr: any = [];
      obj.children.forEach((item: any) => {
        arr.push(deleteTempInfo(item));
      });
      obj.children = arr;
    }
    result = { ...obj };
    return result;
  };

  // 获取设置的值
  const getValue = (treeData: any) => {
    let result: any = {};
    if (treeData.type == 'condition') {
      result['labels'] = {
        [treeData.relation]: treeData.value.map((it: any) => it.value),
      };
    } else {
      result = {
        [treeData.relation]: getValueDeepTreeData(treeData.children),
      };
    }
    return result;
  };

  const onChnage = (data: ClassifyTreeType) => {
    const newResult = resetTreeData({ ...data, isTop: true });
    setClassifyTreeData(newResult);

    let treeResult: any = newResult;
    // 上报表单前，找到单个子级的节点，并提升节点位置
    if (newResult.type == 'group') {
      const emptyData = getEmptyValueNode(newResult);
      let treeData: any = JSON.parse(JSON.stringify(newResult));
      emptyData.forEach((it: any) => {
        treeData['children'] = removeNodeById(treeData.children, it._tempId);
      });
      treeResult = deleteAndReplaceNode({
        ...newResult,
        children: treeData['children'],
      });
    }

    const sureResult: any = deleteTempInfo(treeResult);
    let sureValue = getValue(treeResult);
    if (sureResult.type == 'condition' && sureResult.value.length === 0) {
      sureValue = {};
    }
    const result = {
      data: sureResult,
      value: sureValue,
    };
    props.onChange(result);
  };

  return (
    <ClassifyTree
      current={props.current}
      speciesFields={props.speciesFields}
      key={classifyTreeData._tempId}
      classifyTreeData={classifyTreeData}
      onAdd={(node) => {
        const emptyData = getEmptyValueNode(classifyTreeData);
        if (emptyData.length > 0) {
          message.warn('请完善信息后，再新增节点');
          return;
        }
        const newNode = createEmptyData(node);
        let result: any = {};
        if (node.isTop) {
          result = newNode;
        } else {
          result = updateNodeByTempId(classifyTreeData, node._tempId, newNode);
        }
        onChnage(result);
      }}
      onDelete={(node) => {
        const newConChildren = removeNodeById(classifyTreeData.children, node._tempId);
        let result: any = {};
        result = deleteAndReplaceNode({
          ...classifyTreeData,
          children: newConChildren,
        });
        onChnage(result);
      }}
      onRelationChange={(node) => {
        const result = updateNodeByTempId(classifyTreeData, node._tempId, { ...node });
        onChnage(result);
      }}
      onValueChange={(node) => {
        const result = updateNodeByTempId(classifyTreeData, node._tempId, { ...node });
        onChnage(result);
      }}
    />
  );
};

export default Classify;
