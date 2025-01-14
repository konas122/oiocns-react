import { MappingData } from '@/ts/base/model';
import { XForm } from '@/ts/base/schema';
import { isValidVariableName } from '@/utils/script';
import { Button, Form, Input, List, Modal, Select, Tag, message } from 'antd';
import _ from 'lodash';
import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import './FieldSelect.less';

interface PropsBase {
  data: MappingData[];
  forms?: XForm[];
  disabled?: MappingData[];
  style?: CSSProperties;
  buttonText?: string;
  showLabel?: boolean;
}

interface Props extends PropsBase {
  value?: MappingData | null;
  onChange: (e: MappingData) => any;
  beforeChange?: (e: MappingData) => boolean;
  editName?: boolean;
  clearable?: boolean;
  formId?: string;
}

interface MultiProps extends PropsBase {
  value: MappingData[];
  onChange: (e: MappingData[]) => any;
  beforeChange?: (e: MappingData[]) => boolean;
}

interface ListProps {
  disabled?: MappingData[];
  data: MappingData[];
  formId: string;
  isSelect: (item: MappingData) => boolean;
  onSelect: (item: MappingData) => void;
}

function FieldSelectList(props: ListProps) {
  const [searchText, setSearchText] = useState('');
  const group = useMemo(() => {
    return _.groupBy(props.data, (t) => t.formId);
  }, [props.data]);

  const triggers = useMemo(() => {
    let list = group[props.formId] || [];
    if (searchText) {
      let text = searchText.toLowerCase();
      list = list.filter(
        (l) => l.name.includes(text) || l.code.toLowerCase().includes(text),
      );
    }
    return list;
  }, [group, props.formId, searchText]);

  const disabledIds = useMemo(() => {
    return (props.disabled || []).map((d) => d.id);
  }, [props.disabled]);

  return (
    <div className="list-wrapper">
      <List
        header={
          <>
            <Input
              placeholder="搜索对象"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </>
        }
        bordered
        size="small"
        dataSource={triggers}
        renderItem={(item) => (
          <List.Item
            className={[
              'field-item',
              props.isSelect(item) ? 'is-selected' : '',
              disabledIds.includes(item.id) ? 'is-disabled' : '',
            ].join(' ')}
            onClick={() => {
              if (disabledIds.includes(item.id)) {
                return;
              }
              props.onSelect(item);
            }}>
            <b className="item-name">{item.name}</b>
            <span className="item-code">{item.code}</span>
            <span className="flex-auto"></span>
            <span>{item.formName}</span>
          </List.Item>
        )}
      />
    </div>
  );
}

export function FieldSelect(props: Props) {
  const [value, setValue] = useState(props.value);
  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  const [formId, setFormId] = useState('');
  const [argsCode, setArgsCode] = useState('');
  const [visible, setVisible] = useState(false);
  return (
    <div className="field-select" style={props.style}>
      {props.showLabel !== false && (
        <div className="select-text">
          {value && (
            <>
              <span style={{ marginRight: '8px' }}>{value.name}</span>
              <Tag color="processing">{value.formName}</Tag>
            </>
          )}
        </div>
      )}
      {props.clearable && (
        <Button
          style={{ marginRight: '8px' }}
          onClick={() => {
            props.onChange(null!);
          }}>
          清除
        </Button>
      )}
      <Button
        type="primary"
        onClick={() => {
          setFormId(props.formId ? props.formId : props.data[0]?.formId || '');
          setVisible(true);
        }}>
        {props.buttonText || '选择'}
      </Button>

      <Modal
        destroyOnClose
        title="选择对象"
        width={640}
        open={visible}
        className="field-select__modal"
        onOk={() => {
          let ret = value!;
          if (props.editName) {
            ret = { ...ret, code: argsCode };
            if (!ret.code) {
              return;
            }
            if (!isValidVariableName(ret.code)) {
              message.error('变量名非法');
              return;
            }
          }
          if (props.beforeChange) {
            if (!props.beforeChange(ret)) {
              return;
            }
          }
          props.onChange(ret);

          setValue(null);
          setArgsCode('');
          setVisible(false);
        }}
        onCancel={() => setVisible(false)}>
        <div className="flex flex-col" style={{ gap: '16px' }}>
          <Form layout="vertical">
            {props.forms && (
              <Form.Item label="筛选表单">
                <Select
                  value={formId}
                  onChange={(e) => setFormId(e)}
                  options={props.forms.map((f) => ({
                    value: f.id,
                    label: f.name,
                  }))}></Select>
              </Form.Item>
            )}
            {props.editName && (
              <Form.Item label="变量名称" required>
                <Input value={argsCode} onChange={(e) => setArgsCode(e.target.value)} />
              </Form.Item>
            )}
          </Form>
          <FieldSelectList
            data={props.data}
            formId={formId}
            disabled={props.disabled}
            isSelect={(item) => item.id == value?.id}
            onSelect={(item) => {
              setValue(item);
              setArgsCode(item.code);
            }}
          />
        </div>
      </Modal>
    </div>
  );
}

export function FieldSelectMulti(props: MultiProps) {
  const [value, setValue] = useState(props.value);
  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  const [formId, setFormId] = useState('');
  const [visible, setVisible] = useState(false);

  return (
    <div className="field-select" style={props.style}>
      {props.showLabel !== false && (
        <div className="select-text">
          {value.length > 0 && <span>{`已选择 ${value.length} 条数据`}</span>}
        </div>
      )}
      <Button
        type="primary"
        onClick={() => {
          setFormId(props.data[0]?.formId || '');
          setVisible(true);
        }}>
        {props.buttonText || '选择'}
      </Button>

      <Modal
        destroyOnClose
        title="选择对象"
        width={640}
        open={visible}
        className="field-select__modal"
        onOk={() => {
          let ret = value!;
          if (props.beforeChange) {
            if (!props.beforeChange(ret)) {
              return;
            }
          }
          props.onChange(ret);

          setValue([]);
          setVisible(false);
        }}
        onCancel={() => setVisible(false)}>
        <div className="flex flex-col" style={{ gap: '16px' }}>
          <Form layout="vertical">
            {props.forms && (
              <Form.Item label="筛选表单">
                <Select
                  value={formId}
                  onChange={(e) => setFormId(e)}
                  options={props.forms.map((f) => ({
                    value: f.id,
                    label: f.name,
                  }))}></Select>
              </Form.Item>
            )}
          </Form>
          <div>
            <span>批量插入时自动取特性编号为变量名称</span>
          </div>
          <FieldSelectList
            data={props.data}
            formId={formId}
            disabled={props.disabled}
            isSelect={(item) => value.find((v) => v.id == item.id) != null}
            onSelect={(item) => {
              let ret = [...value];
              const index = ret.findIndex((v) => v.id == item.id);
              if (index >= 0) {
                ret.splice(index, 1);
              } else {
                ret.push(item);
              }
              setValue(ret);
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
