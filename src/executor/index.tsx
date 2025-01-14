import { command } from '@/ts/base';
import OpenExecutor from './open';
import DesignExecutor from './design';
import OperateExecutor from './operate';
import React, { useEffect, useState } from 'react';
import { executeCmd } from './action';
import { useHistory } from 'react-router-dom';
import OpenFileDialog from '@/components/OpenFileDialog';
import { Subscription } from './tools/revision';
import { IFile } from '@/ts/core';
import ThingPrint from './open/form/detail/print';

const Executor: React.FC = () => {
  const history = useHistory();
  const [preview, setPreview] = useState(<></>);
  const [content, setContent] = useState(<></>);
  const resetCtx = (ctx: boolean = true) => {
    if (ctx) {
      setContent(<></>);
    } else {
      setPreview(<></>);
    }
  };
  useEffect(() => {
    const id = command.subscribe((type, cmd, ...args: any[]) => {
      if (type != 'executor') return;
      if (cmd === 'link') return history.push(args[0]);
      if (executeCmd(cmd, args[0]) === false) {
        switch (cmd) {
          case 'open':
          case 'openMember':
          case 'remark':
            if (args.length > 1 && args[1] == 'preview') {
              setPreview(
                <OpenExecutor
                  cmd={cmd}
                  entity={args[0]}
                  finished={() => resetCtx(false)}
                />,
              );
            } else {
              setContent(<OpenExecutor cmd={cmd} entity={args[0]} finished={resetCtx} />);
            }
            return;
          case 'design':
          case 'fillWork':
          case 'dataAnalysis':
            setContent(<DesignExecutor cmd={cmd} entity={args[0]} finished={resetCtx} />);
            return;
          case 'lookSubscribe': {
            const file = args[0] as IFile;
            const item = file.directory.target.space.manager.find(file.id);
            if (item) {
              setContent(<Subscription subscribe={item} onFinished={resetCtx} />);
            }
            break;
          }
          case 'printEntity':
            {
              const [form, type, datas] = args;
              setPreview(
                <ThingPrint
                  type={type} // "multiple" | "single"
                  things={datas}
                  fields={form.fields}
                  printConfig={form.metadata.print?.config}
                  qrcodeConfig={form.metadata.print?.qrcodeConfig}
                  finished={() => setPreview(<></>)}
                />,
              );
            }
            break;
          case 'generateView':
            if ('generateView' in args[0]) {
              setContent(
                <OpenFileDialog
                  multiple={false}
                  title="选择保存位置"
                  accepts={['目录']}
                  rootKey={args[0].target.directory.key}
                  onOk={async (files) => {
                    await args[0].generateView(files[0]);
                    resetCtx();
                  }}
                  onCancel={resetCtx}
                />,
              );
            }
            return;
          default:
            setContent(<OperateExecutor cmd={cmd} args={args} finished={resetCtx} />);
            return;
        }
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);
  return (
    <>
      {preview}
      {content}
    </>
  );
};

export default Executor;
