import { model, schema } from '@/ts/base';
import { IBelong, TargetType } from '@/ts/core';
import FormService from '@/ts/scripting/core/services/FormService';
import { formatDate } from '@/utils';
import { DateBox, NumberBox, SelectBox, TextArea, TextBox } from 'devextreme-react';
import { ValueChangedEvent } from 'devextreme/ui/text_box';
import React, { useEffect, useMemo, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { getItemWidth, getWidget } from '../Utils';
import CurrentTargetItem from './customItem/currentTarget';
import DataBox from './customItem/dataBox';
import DepartmentBox from './customItem/departmentBox';
import SelectFilesItem from './customItem/fileItem';
import HtmlEditItem from './customItem/htmlItem';
import MemberBoxProps from './customItem/memberBox';
import { MultiSelectBox } from './customItem/multiSelectBox';
import { MemberMultiSelectBox } from './customItem/memberMultiSelectBox';
import SearchTargetItem from './customItem/searchTarget';
import TreeSelectItem from './customItem/treeItem';
import TreeModal from './customItem/treeModal';
import { DisplayType } from '@/utils/work';
import TreeSelect from './customItem/treeSelect';
import { isNumber } from 'lodash';
import MapEditItem from '@/components/DataStandard/WorkForm/Design/form/customItem/mapItem';

interface IFormItemProps {
  data: any;
  form?: schema.XForm;
  numStr: string;
  service?: FormService;
  field: model.FieldModel;
  readOnly?: boolean;
  belong: IBelong;
  rules: model.RenderRule[];
  onValuesChange?: (field: string, value: any) => void;
  setFieldsValue?: (data: any) => void;
}

const FormItem: React.FC<IFormItemProps> = (props) => {
  const options = props.field.options;
  const [value, setValue] = useState<any>(
    props.data[props.field.id] ??
      props.data[`T${props.field.id}`] ??
      props.data[props.field.code],
  );
  const [visible, setVisible] = useState(options?.hideField != true);
  const [readOnly, setReadOnly] = useState(options?.readOnly == true);
  const [label, setLabel] = useState(props.field.name + (options?.isRequired ? '*' : ''));
  const [isValid, setIsValid] = useState(true);

  useEffectOnce(() => {
    for (const rule of props.rules) {
      switch (rule.typeName) {
        case 'readOnly':
          setReadOnly(rule.value);
          break;
        case 'visible':
          setVisible(rule.value);
          break;
        case 'isRequired':
          setLabel(props.field.name + (rule.value ? '*' : ''));
          break;
      }
    }
    if (props.readOnly) {
      setReadOnly(true);
    }
  });

  useEffect(() => {
    const id = props.service?.command.subscribe((type, cmd, args) => {
      if (args.formId == props.form?.id && args.destId === props.field.id) {
        switch (type) {
          case 'change':
            switch (cmd) {
              case 'result':
                setValue(args.value);
                break;
              case 'visible':
                setVisible(args.value);
                break;
              case 'readOnly':
                setReadOnly(args.value);
                break;
              case 'isRequired':
                setLabel(props.field.name + (args.value ? '*' : ''));
                break;
            }
            break;
          case 'valid':
            switch (cmd) {
              case 'isRequired':
                setIsValid(args.value);
                break;
            }
            break;
        }
      }
    });
    return () => {
      props.service?.command.unsubscribe(id!);
    };
  }, []);

  const mixOptions: any = {
    ...props.field.options,
    isValid,
    readOnly,
    visible,
    value,
    label,
    height: 36,
    name: props.field.id,
    showClearButton: true,
    hint: props.field.remark,
    showMaskMode: 'always',
    labelMode: 'floating',
    labelLocation: 'left',
    className: label.endsWith('*') && !value ? 'formItemRequired' : '',
    onValueChanged: (e: ValueChangedEvent & { type: string }) => {
      if (e.value !== props.data[props.field.id]) {
        if (getWidget(props.field.valueType, props.field.widget) === '引用选择框') {
          if (!value && e.type === 'onChange') {
            props.onValuesChange?.apply(this, [props.field.id, e.value]);
          }
        } else {
          setValue(e.value);
          props.onValuesChange?.apply(this, [props.field.id, e.value]);
        }
      } else {
        props.onValuesChange?.apply(this, [props.field.id, e.value]);
      }
    },
    setFieldsValue: props.setFieldsValue,
    width: getItemWidth(props.numStr),
  };

  const isRelevanceId = useMemo(() => {
    return props.field.lookups?.some((a) => a.relevanceId);
  }, [props.field.lookups]);

  if (visible) {
    switch (getWidget(props.field.valueType, props.field.widget)) {
      case '数字框':
        return (
          <NumberBox
            {...mixOptions}
            format={
              isNumber(value) &&
              value !== 0 &&
              `#.${'0'.repeat(props.field.options?.accuracy ?? 2)}`
            }
          />
        );
      case '文本框':
        return <TextBox {...mixOptions} visible />;
      case '多行文本框':
        return (
          <TextArea {...mixOptions} minHeight={100} autoResizeEnabled width={'100%'} />
        );
      case '富文本框':
        return <HtmlEditItem {...mixOptions} />;
      case '单选框':
      case '选择框':
        if (!isRelevanceId) {
          return (
            <SelectBox
              {...mixOptions}
              searchEnabled
              searchMode="contains"
              searchExpr={'text'}
              dataSource={props.field.lookups}
              displayExpr={'text'}
              valueExpr={'value'}
            />
          );
        } else {
          return <TreeSelect {...mixOptions} lookups={props.field.lookups} />;
        }
      case '多选框':
        if (props.field.valueType !== '用户型') {
          return <MultiSelectBox {...mixOptions} field={props.field} />;
        } else {
          return <MemberMultiSelectBox {...mixOptions} field={props.field} />;
        }
      case '引用选择框':
        return (
          <DataBox
            {...mixOptions}
            field={props.field}
            attributes={props.form?.attributes}
            target={props.belong}
            metadata={props.form}
          />
        );
      case '多级选择框':
        if (options?.displayType === DisplayType.POPUP) {
          return (
            <TreeModal
              {...mixOptions}
              metadata={props.form}
              directory={props.belong.directory}
              attribute={props.form?.attributes.find((it) => it.id === props.field.id)}
              onValuesChange={props.onValuesChange}
            />
          );
        } else {
          return <TreeSelectItem {...mixOptions} speciesItems={props.field.lookups} />;
        }
      case '操作人':
        return <CurrentTargetItem {...mixOptions} target={props.belong.user.metadata} />;
      case '操作组织':
        return (
          <CurrentTargetItem
            {...mixOptions}
            target={props.belong.metadata}
            isCreate={props.service?.work.isCreate}
          />
        );
      case '人员搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Person} />;
      case '单位搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Company} />;
      case '群组搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Cohort} />;
      case '组织群搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Group} />;
      case '成员选择框':
        return <MemberBoxProps {...mixOptions} target={props.belong.metadata} />;
      case '内部机构选择框':
        return (
          <DepartmentBox {...mixOptions} searchEnabled target={props.belong.metadata} />
        );
      case '日期选择框':
        switch (mixOptions.dateRange) {
          case 'before':
            mixOptions.max = new Date();
            break;
          case 'after':
            mixOptions.min = new Date();
            break;
        }
        return (
          <DateBox
            {...mixOptions}
            type={'date'}
            displayFormat={props.field?.options?.displayFormat || 'yyyy年MM月dd日'}
            onValueChanged={(e) => {
              mixOptions.onValueChanged.apply(this, [
                {
                  ...e,
                  value: e.value
                    ? formatDate(
                        e.value,
                        props.field?.options?.displayFormat
                          ? props.field?.options?.displayFormat
                              .replace(/年|月/g, '-')
                              .replace(/日|号/g, '')
                          : 'yyyy-MM-dd',
                      )
                    : undefined,
                },
              ]);
            }}
          />
        );
      case '时间选择框':
        return (
          <DateBox
            {...mixOptions}
            type={'datetime'}
            displayFormat={
              props.field?.options?.displayFormat || 'yyyy年MM月dd日 HH:mm:ss'
            }
            onValueChanged={(e) => {
              mixOptions.onValueChanged.apply(this, [
                {
                  ...e,
                  value: e.value
                    ? formatDate(
                        e.value,
                        props.field?.options?.displayFormat
                          ? props.field?.options?.displayFormat
                              .replace(/年|月/g, '-')
                              .replace(/日|号/g, '')
                          : 'yyyy-MM-dd HH:mm:ss',
                      )
                    : undefined,
                },
              ]);
            }}
          />
        );
      case '文件选择框':
        return <SelectFilesItem {...mixOptions} />;
      case '地图选择框':
        return <MapEditItem {...mixOptions} />;
      default:
        return <TextArea {...mixOptions} />;
    }
  }
  return <></>;
};

export default FormItem;
