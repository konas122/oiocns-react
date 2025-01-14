import FullScreenModal from '@/components/Common/fullScreen';
import OpenFileDialog from '@/components/OpenFileDialog';
import { FullEntityColumns } from '@/config/column';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { sleep } from '@/ts/base/common';
import { FieldModel, LoadOptions } from '@/ts/base/model';
import orgCtrl from '@/ts/controller';
import { IForm } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import { fieldConvert, getUuid, tryParseJson, userFormatFilter } from '@/utils/tools';
import { Input, message, Modal, Form as UIForm } from 'antd';
import html2canvas from 'html2canvas';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FieldInfo } from 'typings/globelType';
import Charts from './components/CustomCharts';
import CustomForm from './components/CustomForm';
import styles from './index.module.less';
import { formatDate } from '@/utils';
import {
  downloadBase64Image,
  generateAggregationPipeline,
  mergeConditions,
  transformConditions,
  transformDataForDisplay,
} from './utils';

interface IProps {
  current: IForm;
  chart?: any;
  finished: (flag?: boolean) => void;
}
let originalOptions: any;

/**
 * 表单数据分析
 */
const DataAnalysisModal: React.FC<IProps> = ({ current, chart, finished }: IProps) => {
  const [templateCenter, setTemplateCenter] = useState(<></>);
  const [templateConfigModal, setTemplateConfigModal] = useState(<></>);
  const [currentChart, setCurrentChart] = useState<IForm>();
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCaptureContent, setIsCaptureContent] = useState(false);
  const [dataSource, setDataSource] = useState<any>([]);
  const chartName = useRef(current?.metadata?.name);
  const [formData, setFormData] = useState<any>({}); // 图表配置

  const [loaded] = useAsyncLoad(async () => {
    let resultFields;
    // 编辑图表
    if (chart) {
      let metaForm: IForm;
      let isCopy = false;
      let currentCompanys = orgCtrl.user.companys.find(
        (cItem) => cItem.belongId == chart.spaceId,
      );
      if (!currentCompanys) {
        currentCompanys = orgCtrl.user.companys.find(
          (cItem) => cItem.belongId === current.spaceId,
        );
        isCopy = true;
      }
      if (currentCompanys && currentCompanys?.targets) {
        const targetId = isCopy ? (current as any)?.target?.id : chart.targetId;
        const subCompanys = currentCompanys?.targets.find(
          (dItem) => dItem.id == targetId,
        );
        metaForm = new Form((current as any).metadata, subCompanys!.directory);
        // 查找引用表单（图表元数据）
        const chartMetaData = await metaForm.loadReferenceForm(chart.formId);
        const dirs = await metaForm.directory.loadAllDirectory();
        const dirItem = dirs.filter((item) => item.id === chartMetaData.directoryId);
        if (Array.isArray(dirItem) && dirItem.length > 0) {
          // 实例化图表表单
          const chartForm = new Form(chartMetaData, dirItem[0]);
          if (chartForm?.metadata?.options) {
            originalOptions = _.cloneDeep(chartForm?.metadata?.options);
          }
          setCurrentChart(chartForm);
          resultFields = FullEntityColumns(await chartForm.loadFields());
        }
      }
    } else {
      current.loadContent();
      await current.load();
      const metaForm: IForm = new Form(current.metadata, current.directory);
      resultFields = FullEntityColumns(await metaForm.loadFields());
    }
    if (resultFields) {
      resultFields = resultFields?.filter((item) => item.id !== 'id');
      setFields(fieldConvert(resultFields as FieldModel[]));
    }
  }, [current]);

  useEffect(() => {
    if (chart) {
      setFormData(chart);
    } else {
      setFormData({
        id: getUuid(),
        formId: current.id,
        name: current.metadata.name,
        mode: '2d',
        chartType: 'PieChart',
        scatterDimension: undefined,
        flattenDimension: undefined,
        aggregateDimension: undefined,
        directoryId: current.directory.directoryId,
        targetId: current.directory.target.id,
        spaceId: current.directory.target.spaceId,
        dataSource: [],
        thumbnail: '/img/dashboardTemplate/pie_chart_img.png',
      });
    }
    // 不覆盖表单的数据过滤条件
    if (current?.metadata?.options && !chart) {
      originalOptions = _.cloneDeep(current?.metadata?.options);
    }
    return () => {
      resetMetaOptions();
      originalOptions = null;
    };
  }, []);

  useEffect(() => {
    // 生成图表
    if (chart && loaded) {
      const hasDataSource =
        Array.isArray(chart?.dataSource) && chart?.dataSource.length > 0;
      if (hasDataSource) {
        setDataSource(chart.dataSource);
        setLoading(false);
        return;
      }
      handleGenerateChart(chart);
    }
  }, [chart, loaded]);

  useEffect(() => {
    if (isCaptureContent) {
      const element = document.querySelector(`.${styles['dataAnalysisModal']}`);
      if (element) {
        html2canvas(element as HTMLElement, {
          backgroundColor: 'white',
          useCORS: true,
          scale: 2,
          height: element.scrollHeight,
          windowHeight: element.scrollHeight,
        })
          .then((canvas) => {
            const imageDataURL = canvas.toDataURL('image/png');
            downloadBase64Image(imageDataURL, formData.name);
          })
          .catch((error) => {
            console.error('Error capturing element:', error);
            message.error('Failed to capture element.');
          });
      }
      setIsCaptureContent(false);
    }
  }, [isCaptureContent]);

  const resetMetaOptions = () => {
    if (chart && currentChart?.metadata?.options) {
      currentChart.metadata.options = originalOptions;
    } else if (current?.metadata?.options) {
      current.metadata.options = originalOptions;
    }
  };

  /**
   * 是否有属性和数据源
   */
  const hasValidAttributesAndData = () => {
    const { mode, scatterDimension, flattenDimension, aggregateDimension } = formData;
    if (
      scatterDimension &&
      aggregateDimension &&
      Array.isArray(dataSource) &&
      dataSource.length > 0
    ) {
      if (mode === '2d') return true;
      if (mode === '3d' && flattenDimension) return true;
    }
    return false;
  };

  /**
   * 推送到模板-设置名称
   */
  const handleShowView = () => {
    if (!hasValidAttributesAndData()) {
      message.error('暂无数据');
      return;
    }
    setTemplateConfigModal(
      <Modal
        title="图表信息"
        open={true}
        onOk={async () => {
          handleSelectView();
          await sleep(300);
          setTemplateConfigModal(<></>);
        }}
        onCancel={() => setTemplateConfigModal(<></>)}>
        <UIForm
          initialValues={{
            chartName: chartName.current,
          }}
          autoComplete="off"
          onValuesChange={(values) => {
            if ('chartName' in values) {
              chartName.current = values['chartName'];
            }
          }}>
          <UIForm.Item label="图表名称" name="chartName">
            <Input placeholder="请输入图表名称" style={{ width: '100%' }} />
          </UIForm.Item>
        </UIForm>
      </Modal>,
    );
  };

  /**
   * 选择某个数据模板
   */
  const handleSelectView = () => {
    setTemplateCenter(
      <OpenFileDialog
        multiple
        title={`选择`}
        accepts={['图表视图']}
        rightShow={false}
        rootKey={current.spaceKey}
        showFile
        onCancel={() => setTemplateCenter(<></>)}
        onOk={async (files) => {
          try {
            if (files.length > 0) {
              message.loading('推送中...');
              const chartData = _.cloneDeep(formData);
              if (chartData?.scatterDimensionRaw?.lookup) {
                chartData.scatterDimensionRaw.lookup = null;
              }
              if (chartData?.flattenDimensionRaw?.lookup) {
                chartData.flattenDimensionRaw.lookup = null;
              }
              const newChartItem = {
                ...chartData,
                id: !chart && getUuid(),
                name: chartName.current ?? chartData?.name,
              };
              for (const item of files) {
                if ('chartList' in item.metadata) {
                  if (Array.isArray(item.metadata.chartList)) {
                    item.metadata.chartList.push(newChartItem);
                  } else {
                    (item.metadata as any).chartList = [newChartItem];
                  }
                } else {
                  (item.metadata as any).chartList = [newChartItem];
                }
                (item.metadata as any).chartDataUpdateTime = formatDate(
                  Date.now(),
                  'yyyy-MM-dd HH:mm:ss.S',
                );
                await (item as any).update({});
              }
            }
            message.destroy();
            message.success('推送成功');
            setTemplateCenter(<></>);
          } catch (error) {
            message.destroy();
            message.error('推送失败');
          }
        }}
      />,
    );
  };

  /**
   * 设置条件
   * @param value
   * @param text
   */
  const setFilterCondition = (value: string, text: string, filter: any) => {
    const instance = chart ? currentChart : current;
    if (instance) {
      if (!instance.metadata.options?.dataRange) {
        instance.metadata.options!.dataRange = {};
      }
      if (tryParseJson(value)) {
        instance.metadata.options!.dataRange!.filterExp = value;
        instance.metadata.options!.dataRange!.filterDisplay = text;
      } else {
        instance.metadata.options!.dataRange!.filterExp = undefined;
        instance.metadata.options!.dataRange!.filterDisplay = undefined;
      }
    }
    loadThingSummary(filter);
  };

  /**
   * 加载物统计
   */
  const loadThingSummary = async (values: any) => {
    try {
      const instance = chart ? currentChart : current;
      if (instance) {
        const {
          mode,
          scatterDimension,
          scatterDimensionRaw,
          scatterDimensionIndex,
          flattenDimension,
          flattenDimensionRaw,
          aggregateDimension,
          aggregateDimensionRaw,
          aggregateDimensionIndex,
        } = values;

        const pipeline = generateAggregationPipeline({
          hashDimension: scatterDimension,
          summaryDimension: aggregateDimension,
          tileDimension: flattenDimension,
          totalIndicators: aggregateDimensionIndex,
        });

        const loadOptions: LoadOptions = {};
        loadOptions.filter = await userFormatFilter(loadOptions.filter, instance);
        loadOptions.filter = instance.parseFilter(loadOptions.filter);
        loadOptions.userData = [];
        loadOptions.options = {
          ...loadOptions.options,
          match: {
            ...(loadOptions?.options?.match || {}),
            isDeleted: false,
          },
          project: {
            _id: 0,
            archives: 0,
          },
        };
        loadOptions.group = pipeline;
        const type1Regex = /^T\d{18}$/;
        if (type1Regex.test(scatterDimension)) {
          loadOptions.options.match[scatterDimension] = {
            _ne_: null,
            _exists_: true,
          };
        }
        if (type1Regex.test(flattenDimension) && mode === '3d') {
          loadOptions.options.match[flattenDimension] = {
            _ne_: null,
            _exists_: true,
          };
        }
        const pipelineResult = await instance.loadChartSummary(loadOptions);
        const result = await transformDataForDisplay({
          data: pipelineResult,
          mode,
          hashDimension: scatterDimensionRaw,
          summaryDimension: aggregateDimensionRaw,
          tileDimension: flattenDimensionRaw,
          dimensionIndex: scatterDimensionIndex,
        });
        if (Array.isArray(result) && result.length > 0) {
          setLoading(false);
          setDataSource(result);

          setFormData({
            ...formData,
            ...values,
            dataSource: result,
          });
        } else {
          message.error('暂无数据源');
          setLoading(false);
        }
      } else {
        throw new Error('未找到实例对象');
      }
    } catch (error) {
      console.log('error', error);
      setLoading(false);
    }
  };

  /**
   * 更新表单数据
   * @param values
   */
  const handleUpdateFormData = (values: any) => {
    if ('mode' in values) {
      setDataSource([]);
    }
    setFormData({
      ...formData,
      ...values,
    });
  };

  /**
   * 生成图表
   */
  const handleGenerateChart = async (values: any) => {
    try {
      const { mode, scatterDimension, flattenDimension, aggregateDimension, conditions } =
        values;
      if (
        (mode === '2d' &&
          (typeof scatterDimension === 'undefined' ||
            typeof aggregateDimension === 'undefined')) ||
        (mode === '3d' &&
          (typeof scatterDimension === 'undefined' ||
            typeof flattenDimension === 'undefined' ||
            typeof aggregateDimension === 'undefined'))
      ) {
        message.error('请选择纬度');
        return;
      }
      if (
        scatterDimension === flattenDimension ||
        flattenDimension === aggregateDimension ||
        scatterDimension === aggregateDimension
      ) {
        message.error('请确保散列维度、汇总维度和平铺维度各不相同');
        return;
      }
      const instance = chart ? currentChart : current;
      setLoading(true);
      if (conditions && instance) {
        const conditionsValue = await transformConditions(conditions, instance);
        const filterExpStr = originalOptions?.dataRange?.filterExp;
        // 表单上有条件
        if (filterExpStr) {
          const filterExp =
            typeof filterExpStr === 'string' ? JSON.parse(filterExpStr) : filterExpStr;
          const conditionsValues = JSON.stringify(
            mergeConditions(filterExp, conditionsValue),
          );
          setFilterCondition(conditionsValues, conditionsValues, values);
        } else {
          setFilterCondition(
            JSON.stringify(conditionsValue),
            JSON.stringify(conditionsValue),
            values,
          );
        }
      } else {
        loadThingSummary(values);
      }
    } catch (error) {
      setLoading(true);
      console.log('error', error);
    }
  };

  /**
   * 更新数据模板的图表
   */
  const handleUpdateChart = () => {
    const tempChartList = _.cloneDeep(current.metadata?.chartList) ?? [];
    const pos = tempChartList.findIndex((item: any) => item.id === formData.id);
    if (pos !== -1) {
      tempChartList[pos] = formData;
    } else {
      tempChartList.push(formData);
    }
    current.metadata.chartList = tempChartList;
    finished && finished(true);
  };

  return (
    <FullScreenModal
      open
      centered
      width={'90vw'}
      destroyOnClose
      title={`${chart ? chart?.cardConfig?.name ?? chart.name : current.name}(数据分析)`}
      footer={null}
      bodyStyle={{ padding: 0, margin: 0 }}
      style={{ padding: 0, margin: 0 }}
      onCancel={() => finished()}>
      <div className={styles['dataAnalysisModal']}>
        <div className={styles['dataAnalysisModal-header']}>
          <CustomForm
            current={current}
            isCaptureContent={isCaptureContent}
            formData={formData}
            fields={fields}
            loading={loading}
            loaded={loaded}
            chart={chart}
            onShowView={handleShowView}
            onSetCaptureContent={() => setIsCaptureContent(true)}
            onResetFormData={() => {
              resetMetaOptions();
              setDataSource([]);
            }}
            onUpdateFormData={(values: any) => handleUpdateFormData(values)}
            onUpdateChart={(values: any) => handleGenerateChart(values)}
            onSave={() => handleUpdateChart()}
          />
        </div>
        <div className={styles['dataAnalysisModal-content']}>
          {useMemo(() => {
            return (
              <Charts
                current={chart ? (currentChart as IForm) : current}
                formData={formData}
                dataSource={dataSource}
                isCaptureContent={isCaptureContent}
                onUpdateFormData={(values: any) => handleUpdateFormData(values)}
                hasValidAttributesAndData={hasValidAttributesAndData}
              />
            );
          }, [dataSource])}
        </div>
      </div>
      {templateCenter}
      {templateConfigModal}
    </FullScreenModal>
  );
};
export default DataAnalysisModal;
