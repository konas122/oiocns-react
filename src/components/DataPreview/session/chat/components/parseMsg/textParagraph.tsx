import { parseTolink } from '@/utils/tools';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';

interface Iporps {
  msgBody: string;
}

const TextParagraph = (props: Iporps) => {
  const ref = useRef<any>();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const textHeight = ref.current.clientHeight;
      setShow(textHeight > 150 ? true : false);
    }
  }, []);
  return (
    <div className="con_content_txt">
      <div style={{ display: 'flex' }}>
        <div
          className={show ? styles.showText : ''}
          dangerouslySetInnerHTML={{ __html: parseTolink(props.msgBody) }}
          ref={ref}
        />
        {show ? (
          <div className={styles.showLink}>
            <a style={{ whiteSpace: 'nowrap' }} onClick={() => setShow(false)}>
              展开
            </a>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
export default TextParagraph;
