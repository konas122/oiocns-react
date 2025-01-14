import { model } from '@/ts/base';
import { WithChildren } from '@/ts/base/common/tree';
import { IReportTree } from '@/ts/core';
import * as el from '@/utils/excel';
import type { ReportTreeNodeHandler } from '@/utils/excel/sheets/standard/reporttreenode';
import { ProTable } from '@ant-design/pro-components';
import { Button, Progress, Space, Spin, Upload } from 'antd';
import React, { useEffect, useState } from 'react';
import { createWarning } from '.';
import cls from './upload.module.less';

async function nextTick() {
  return new Promise<void>((s, e) => {
    setTimeout(() => {
      s();
    }, 50);
  });
}

interface ProgressingProps {
  tree: IReportTree;
  data: WithChildren<model.ReportTreeNode>[];
  total: number;
  finished: () => void;
  onError: (error: el.Error) => void;
}

export const Progressing = ({
  data,
  tree,
  total,
  finished,
  onError,
}: ProgressingProps) => {
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  async function generate() {
    await tree.importNodes(data, total, (v) => {
      if (v instanceof Error) {
        onError({
          message: v.message,
          name: '生成',
          row: [],
        });
        setHasError(true);
      } else {
        setProgress(parseFloat(v.toFixed(2)));
        if (v >= 100) {
          finished();
        }
      }
    });
  }
  useEffect(() => {
    generate();
  }, []);
  return (
    <div className={cls['progress']}>
      <Progress percent={progress} />
      {hasError ? (
        <span>生成失败</span>
      ) : (
        <span style={{ marginTop: '20px' }}>
          {progress >= 100 ? '生成成功' : '正在生成'}
        </span>
      )}
    </div>
  );
};

interface IProps {
  templateName: string;
  tree: IReportTree;
  excel: el.IExcel;
  fields?: model.FieldModel[];
  finished: () => void;
}

export const Uploader: React.FC<IProps> = ({ templateName, excel, tree, finished }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<el.Error[]>([]);
  const [data, setData] = useState<WithChildren<model.ReportTreeNode>[]>([]);
  const [mode, setMode] = useState<'upload' | 'import'>('upload');
  const [count, setCount] = useState(0);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div className="flex items-center">
        <Button onClick={async () => el.generateXlsx(excel, templateName)}>
          导入模板下载
        </Button>
        <div className="flex-auto"></div>
        {data.length > 0 && mode == 'upload' && (
          <>
            <span style={{ marginRight: '16px' }}>已读取 {count} 条数据</span>
            <Button
              type="primary"
              onClick={async () => {
                if (tree.nodes.length > 0) {
                  await createWarning();
                  await tree.clearAllNodes();
                }
                setMode('import');
              }}>
              开始导入
            </Button>
          </>
        )}
      </div>
      <Spin spinning={loading}>
        <div style={{ height: '50vh' }} className={cls['upload-wrapper']}>
          {mode == 'upload' ? (
            <Upload
              type={'drag'}
              showUploadList={false}
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ width: 480, height: 240, marginTop: 20 }}
              customRequest={async (options) => {
                setLoading(true);
                setErrors([]);
                setData([]);

                await nextTick();
                let ret: el.Error[] = [];
                try {
                  await el.readXlsx(options.file as Blob, excel);
                  const handler = excel.handlers[0] as ReportTreeNodeHandler;
                  const e = handler.checkTreeData(tree.metadata);
                  if (e.length > 0) {
                    throw e;
                  }

                  const d = handler.sheet.tree;
                  setData(d);
                  setCount(handler.sheet.data.length);
                } catch (error: any) {
                  ret = error;
                } finally {
                  setLoading(false);
                  setErrors(ret);
                }
              }}>
              <div style={{ color: 'limegreen', fontSize: 22 }}>点击或拖拽至此处上传</div>
            </Upload>
          ) : (
            <>
              <Progressing
                tree={tree}
                data={data}
                total={count}
                onError={(e) => setErrors([...errors, e])}
                finished={() => {
                  finished();
                }}
              />
            </>
          )}
          <div className="flex-auto">
            {errors.length > 0 && (
              <ProTable
                dataSource={errors}
                cardProps={{ bodyStyle: { padding: 0 } }}
                scroll={{ y: 500 }}
                options={false}
                search={false}
                columns={[
                  {
                    title: '序号',
                    valueType: 'index',
                    width: 60,
                  },
                  {
                    title: '表名',
                    dataIndex: 'name',
                  },
                  {
                    title: '行数',
                    dataIndex: 'row',
                    render: (_: any, data: el.Error) => {
                      if (typeof data.row == 'number') {
                        return <>{data.row}</>;
                      }
                      return <>{data.row.join(',')}</>;
                    },
                  },
                  {
                    title: '错误信息',
                    dataIndex: 'message',
                    width: 460,
                  },
                ]}
              />
            )}
          </div>
        </div>
      </Spin>
    </Space>
  );
};
