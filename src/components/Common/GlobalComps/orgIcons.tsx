import React from 'react';
import { Avatar, Image, Tooltip } from 'antd';

interface IProps {
  selected?: boolean;
  size?: number;
  title?: string;
  type: string;
  css?: React.CSSProperties;
  notAvatar?: boolean;
  className?: string;
  onClick?:
    | ((e?: React.MouseEvent<HTMLElement, MouseEvent> | undefined) => void)
    | undefined;
}

const OrgIcons = (props: IProps) => {
  const size = props.size ?? 22;
  let svgName = props.type;
  if (props.selected) {
    svgName += '-select';
  }
  if (props.notAvatar) {
    return (
      <Tooltip title={props.title || null}>
        <Image
          className={props.className}
          preview={false}
          height={size}
          width={size}
          // title={props.title}
          src={`/svg/${svgName}.svg?v=1.0.1`}
          style={{
            cursor: 'pointer',
            width: size,
            height: size,
            ...props.css,
          }}
          onClick={props.onClick}
        />
      </Tooltip>
    );
  } else {
    return (
      <Avatar
        size={size}
        className={props.className}
        src={`/svg/${svgName}.svg?v=1.0.1`}
        onClick={props.onClick}
        style={{
          background: 'transparent',
          color: '#606060',
          cursor: 'pointer',
          ...props.css,
        }}
      />
    );
  }
};

export default OrgIcons;
