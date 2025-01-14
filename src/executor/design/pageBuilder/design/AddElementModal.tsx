import { defineFC } from '@/utils/react/fc';
import { Form, FormInstance, Input, Modal, Select } from 'antd';
import React, { ReactNode, useContext, useMemo } from 'react';
import { DesignContext, PageContext } from '@/components/PageElement/render/PageContext';
import _ from 'lodash';

interface Props {
  parentId: string;
  accepts?: string[];
  onFinished: () => void;
  prop?: string;
  initialValue?: Dictionary<any>;
  extraFields?: (form: FormInstance) => ReactNode;
}

export default defineFC({
  render(props: Props) {
    const ctx = useContext<DesignContext>(PageContext as any);

    const [form] = Form.useForm();

    const elementTypes = useMemo(() => {
      const ret: { label: string; value: string }[] = [];

      let parent = ctx.view.treeManager.allElements[props.parentId];
      if (!parent) {
        console.warn(`找不到父元素 ${props.parentId}`);
        parent = ctx.view.treeManager.root;
      }
      const meta = ctx.view.treeManager.factory.getMeta(parent.kind);
      if (!meta) {
        console.warn(`找不到元素 ${parent.kind} 的定义`);
      }
      let filter = meta?.childrenFilter || (() => true);
      if (parent.kind == 'Root' && ctx.view.page.typeName == '文档模板') {
        filter = ['Paper'];
      }

      for (const [name, meta] of Object.entries(ctx.view.elements.elementMeta)) {
        if (name == 'Root') {
          continue;
        }
        const item = {
          value: name,
          label: meta?.label,
        };

        // 元素类别筛选
        let canSelect = false;
        if (!props.accepts || props.accepts.length == 0) {
          canSelect = true;
        } else if (props.accepts.includes(meta.type)) {
          canSelect = true;
        }

        // 子元素筛选
        let canBeChild = true;
        if (Array.isArray(filter)) {
          canBeChild = filter.includes(name);
        } else {
          canBeChild = filter({ ...meta, name });
        }

        if (canSelect && canBeChild) {
          ret.push(item);
        }
      }
      return ret;
    }, [props.accepts]);

    async function handleCreate() {
      const res = await form.validateFields();
      const { kind, name } = res;
      const params = Object.assign(
        props.initialValue || {},
        _.omit(res, ['kind', 'name']),
      );
      ctx.view.addElement(kind, name, props.prop, props.parentId, {
        props: params,
      });
      props.onFinished();
    }

    return (
      <Modal
        title="新建元素"
        destroyOnClose={true}
        open
        onCancel={() => props.onFinished()}
        onOk={handleCreate}>
        <Form form={form} initialValues={props.initialValue}>
          <Form.Item
            name="kind"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              optionLabelProp="label"
              onChange={(v) => {
                for (const item of elementTypes) {
                  if (item.value == v) {
                    const count = Object.values(ctx.view.treeManager.allElements).filter(
                      (e) => e.kind == v,
                    ).length;
                    form.setFieldValue('name', (item.label || '') + (count + 1));
                  }
                }
              }}>
              {elementTypes.map((o) => {
                return (
                  <Select.Option key={o.value} value={o.value} label={o.label}>
                    <div style={{ display: 'flex' }}>
                      <span>{o.value}</span>
                      <span style={{ flex: 'auto' }}></span>
                      <span>{o.label}</span>
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          {props.extraFields?.(form)}
        </Form>
      </Modal>
    );
  },
  defaultProps: {},
});
