import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Typography,
  Button,
  message,
  Select,
  Input,
  Switch,
} from 'antd';
import { ISpecies, IProperty, IDirectory, valueTypes, IFile } from '@/ts/core';
import { schema } from '@/ts/base';
import cls from './index.module.less';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import OpenFileDialog from '@/components/OpenFileDialog';
import UploadItem from '@/executor/tools/uploadItem';
import useCtrlUpdate from '@/hooks/useCtrlUpdate';
import { formatZhDate } from '@/utils/tools';
interface IProps {
  entity: IProperty & ISpecies & IDirectory | IFile;
  other?: any;
  extra?: any;
  column?: number;
  hasRelationAuth?: boolean;
}

type EntityType = {
  name: string;
  code: string;
  remark: string;
  icon: string;
  unit?: string;
  info?: string;
  valueType?: string;
  isChangeTarget?: boolean;
  isChangeSource?: boolean;
  isCombination?: boolean;
};

/**
 * @description: 机构信息内容
 * @return {*}
 */
const EntityInfo: React.FC<IProps> = ({
  entity,
  other,
  extra,
  column,
  hasRelationAuth,
}: IProps) => {
  const [tkey] = useCtrlUpdate(entity);
  const [ellipsis] = useState(true);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [needType, setNeedType] = useState('');
  const findSpecies = async () => {
    if (entity?.metadata.speciesId) {
      const speciesMeta = entity.directory.target.user.findMetadata<schema.XEntity>(
        entity.metadata.speciesId,
      );
      if (speciesMeta) {
        return speciesMeta;
      } else {
        const result = await entity.loadSpeciesById(entity?.metadata.speciesId);
        return result;
      }
    }
    return undefined;
  };

  const [species, setSpecies] = useState<
    schema.XEntity | schema.XSpeciesItem[] | undefined
  >();
  const findForm = () => {
    if (entity?.metadata.formId) {
      return entity.directory.target.user.findMetadata<schema.XEntity>(
        entity.metadata.formId,
      );
    }
  };
  const [form, setForm] = useState(findForm());
  const [selectType, setSelectType] = useState<string>(
    (entity as IProperty).metadata.valueType,
  );

  useEffect(() => {
    const fetchSpecies = async () => {
      const result = await findSpecies();
      setSpecies(result);
    };
    fetchSpecies();
  }, []);

  const [editEntityInfo, setEditEntityInfo] = useState<EntityType>({
    name: entity.metadata.name,
    code: entity.code,
    remark: entity.remark,
    icon: entity.metadata.icon,
    unit: entity.metadata.unit,
    info: entity.metadata.info,
    valueType: selectType,
    isChangeTarget: entity.metadata.isChangeTarget,
    isChangeSource: entity.metadata.isChangeSource,
    isCombination: entity.metadata.isCombination,
  });

  const renderExtra = () => {
    if (extra) {
      return extra;
    }
    if (!extra && hasRelationAuth) {
      return (
        <React.Fragment>
          {isEdit ? (
            <React.Fragment>
              <Button
                type="link"
                onClick={() => {
                  setIsEdit(false);
                  setEditEntityInfo({
                    name: entity.metadata.name,
                    code: entity.code,
                    remark: entity.remark,
                    icon: entity.metadata.icon,
                  });
                }}>
                取消
              </Button>
              <Button
                type="link"
                onClick={async () => {
                  if (verifyRequired()) {
                    let params = {};
                    if (entity.typeName === '属性') {
                      params = {
                        formId: form?.id,
                        speciesId: species?.id,
                      };
                    } else {
                      params = {
                        typeName: entity.typeName,
                      };
                    }
                    entity!.update({
                      ...editEntityInfo,
                      ...params,
                    } as schema.XSpecies);
                    setIsEdit(false);
                  }
                }}>
                确认
              </Button>
            </React.Fragment>
          ) : (
            <Button type="link" onClick={() => setIsEdit(true)}>
              编辑
            </Button>
          )}
        </React.Fragment>
      );
    }
    return <></>;
  };

  const renderBaseInfo = () => {
    return (
      <React.Fragment>
        <Descriptions.Item label="名称">
          <Typography.Paragraph
            copyable={{
              text: entity.id,
              tooltips: [entity.id, '复制成功'],
            }}>
            <EntityIcon entity={entity.metadata} showName />
          </Typography.Paragraph>
        </Descriptions.Item>
        <Descriptions.Item label="代码">
          <Typography.Paragraph
            copyable={{
              text: entity.code,
              tooltips: [entity.code, '复制成功'],
            }}>
            {entity.code}
          </Typography.Paragraph>
        </Descriptions.Item>
        {other}
        <Descriptions.Item label="类型">{entity.typeName}</Descriptions.Item>
        {'storeId' in entity.metadata && (
          <Descriptions.Item label="当前数据核">
            <EntityIcon entityId={entity.metadata.storeId as string} showName />
          </Descriptions.Item>
        )}
        {entity.metadata.belongId != entity.id && (
          <Descriptions.Item label="归属">
            <EntityIcon entityId={entity.metadata.belongId} showName />
          </Descriptions.Item>
        )}
        {entity.metadata.createUser != entity.id && (
          <Descriptions.Item label="创建人">
            <EntityIcon entityId={entity.metadata.createUser} showName />
          </Descriptions.Item>
        )}
        <Descriptions.Item label="创建时间">
          {formatZhDate(entity.metadata.createTime)}
        </Descriptions.Item>
        {entity.metadata.createUser != entity.metadata.updateUser && (
          <>
            <Descriptions.Item label="更新人">
              <EntityIcon entityId={entity.metadata.updateUser} showName />
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {formatZhDate(entity.metadata.updateTime)}
            </Descriptions.Item>
          </>
        )}
      </React.Fragment>
    );
  };

  const renderEditInfo = () => {
    return (
      <React.Fragment>
        <Descriptions.Item label={requiredLabel('名称')}>
          <Typography.Paragraph
            editable={{
              onChange: (e) => {
                setEditEntityInfo({
                  ...editEntityInfo,
                  name: e,
                });
              },
              text: editEntityInfo.name,
            }}>
            {editEntityInfo.name}
          </Typography.Paragraph>
        </Descriptions.Item>
        <Descriptions.Item label={requiredLabel('代码')}>
          <Typography.Paragraph
            editable={{
              onChange: (e) => {
                setEditEntityInfo({
                  ...editEntityInfo,
                  code: e,
                });
              },
              text: editEntityInfo.code,
            }}>
            {editEntityInfo.code}
          </Typography.Paragraph>
        </Descriptions.Item>
        {entity.typeName === '属性' ? (
          <React.Fragment>
            <Descriptions.Item label={requiredLabel('类型')}>
              <Select
                style={{ width: '120px' }}
                options={valueTypes.map((i) => {
                  return {
                    value: i,
                    label: i === '选择型' ? '字典型' : i,
                  };
                })}
                value={selectType}
                onSelect={(select: string) => {
                  setSelectType(select);
                  setEditEntityInfo({
                    ...editEntityInfo,
                    valueType: select,
                  });
                  setForm(undefined);
                  setSpecies(undefined);
                }}
              />
            </Descriptions.Item>
            {['选择型', '分类型'].includes(selectType || '') && (
              <Descriptions.Item
                label={requiredLabel(selectType === '选择型' ? '选择字典' : '选择分类')}>
                <Input
                  placeholder={`点击选择${selectType === '选择型' ? '字典' : '分类'}`}
                  readOnly
                  value={species?.name ?? ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setNeedType(selectType === '选择型' ? '字典' : '分类')}
                />
              </Descriptions.Item>
            )}
            {selectType === '引用型' && (
              <Descriptions.Item label="选择表单">
                <Input
                  placeholder={`点击选择表单`}
                  readOnly
                  value={form?.name ?? ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setNeedType('表单')}
                />
              </Descriptions.Item>
            )}
            {(selectType === '数值型' || selectType === '货币型') && (
              <Descriptions.Item label="单位">
                <Input
                  placeholder="请输入"
                  value={editEntityInfo.unit || ''}
                  onChange={(e) => {
                    setEditEntityInfo({
                      ...editEntityInfo,
                      unit: e.target.value,
                    });
                  }}
                />
              </Descriptions.Item>
            )}
            <Descriptions.Item label="附加信息">
              <Input.TextArea
                value={editEntityInfo.info}
                onChange={(e) => {
                  setEditEntityInfo({
                    ...editEntityInfo,
                    info: e.target.value,
                  });
                }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="是否记录变更值">
              <Switch
                checked={editEntityInfo.isChangeTarget}
                onChange={(e) => {
                  setEditEntityInfo({
                    ...editEntityInfo,
                    isChangeTarget: e,
                  });
                }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="是否记录变更源">
              <Switch
                checked={editEntityInfo.isChangeSource}
                onChange={(e) => {
                  setEditEntityInfo({
                    ...editEntityInfo,
                    isChangeSource: e,
                  });
                }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="是否可拆分或合并">
              <Switch
                checked={editEntityInfo.isCombination}
                onChange={(e) => {
                  setEditEntityInfo({
                    ...editEntityInfo,
                    isCombination: e,
                  });
                }}
              />
            </Descriptions.Item>
          </React.Fragment>
        ) : null}
      </React.Fragment>
    );
  };

  const requiredLabel = (label: string) => {
    return (
      <span>
        <span style={{ color: '#f00', marginRight: '3px' }}>*</span>
        {label}
      </span>
    );
  };

  const verifyRequired = () => {
    const requiredFields = [
      { value: editEntityInfo.name, message: `${entity.typeName}名称不能为空` },
      { value: editEntityInfo.code, message: `${entity.typeName}编号不能为空` },
      { value: editEntityInfo.remark, message: `${entity.typeName}备注信息不能为空` },
    ];
    if (entity.typeName === '属性') {
      requiredFields.push({ value: editEntityInfo.valueType!, message: `类型不能为空` });
    }
    for (let field of requiredFields) {
      if (!field.value) {
        message.warning(field.message);
        return false;
      }
    }
    if (['选择型', '分类型'].includes(selectType || '') && !species) {
      message.warning(`${selectType === '选择型' ? '字典' : '分类'}项不能为空`);
      return false;
    }
    return true;
  };

  return (
    <Card bordered={false} className={cls['company-dept-content']}>
      <Descriptions
        size="middle"
        title={`${entity.typeName}[${entity.name}]基本信息`}
        extra={renderExtra()}
        bordered
        colon
        column={column ?? 3}
        labelStyle={{
          textAlign: 'left',
          color: '#606266',
          width: 120,
        }}
        key={tkey}
        contentStyle={{ textAlign: 'left', color: '#606266' }}>
        {isEdit ? (
          <React.Fragment>{renderEditInfo()}</React.Fragment>
        ) : (
          <React.Fragment>{renderBaseInfo()}</React.Fragment>
        )}
      </Descriptions>
      {entity.remark && entity.remark.length > 0 && (
        <Descriptions
          bordered
          colon
          column={column ?? 3}
          labelStyle={{
            textAlign: 'left',
            color: '#606266',
            width: 120,
          }}
          contentStyle={{ textAlign: 'left', color: '#606266' }}>
          <Descriptions.Item
            label={isEdit ? requiredLabel('备注信息') : '描述信息'}
            span={column ?? 3}>
            <Typography.Paragraph
              editable={
                isEdit
                  ? {
                      onChange: (e) => {
                        setEditEntityInfo({
                          ...editEntityInfo,
                          remark: e,
                        });
                      },
                      text: editEntityInfo.remark,
                    }
                  : false
              }
              ellipsis={ellipsis ? { rows: 2, expandable: true, symbol: '更多' } : false}>
              {isEdit ? editEntityInfo.remark : entity.remark}
            </Typography.Paragraph>
          </Descriptions.Item>
        </Descriptions>
      )}
      {isEdit ? (
        <Descriptions
          bordered
          colon
          column={column ?? 3}
          labelStyle={{
            textAlign: 'left',
            color: '#606266',
            width: 120,
          }}
          contentStyle={{ textAlign: 'left', color: '#606266' }}>
          <Descriptions.Item label="图标" span={column ?? 3}>
            <Typography.Paragraph>
              <UploadItem
                typeName={entity.typeName}
                icon={editEntityInfo.icon}
                avatarSize={40}
                iconSize={30}
                onChanged={(icon) => {
                  setEditEntityInfo({
                    ...editEntityInfo,
                    icon: icon,
                  });
                }}
                directory={entity.directory}
              />
            </Typography.Paragraph>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <></>
      )}
      {needType !== '' && (
        <OpenFileDialog
          title={`选择${needType}`}
          rootKey={entity.directory.spaceKey}
          accepts={[needType]}
          onCancel={() => setNeedType('')}
          onOk={(files) => {
            if (['字典', '分类'].includes(needType)) {
              if (files.length > 0) {
                setSpecies(files[0].metadata);
              } else {
                setSpecies(undefined);
              }
            } else if ('表单' == needType) {
              if (files.length > 0) {
                setForm(files[0].metadata);
              } else {
                setForm(undefined);
              }
            }
            setNeedType('');
          }}
        />
      )}
    </Card>
  );
};
export default EntityInfo;
