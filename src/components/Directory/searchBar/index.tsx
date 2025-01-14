import React from 'react';
import { Button, Dropdown, MenuProps, Space } from 'antd';
import { TextBox } from 'devextreme-react';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';

interface IProps {
  value: string;
  menus: MenuProps;
  rightBars?: React.ReactNode;
  onValueChanged: (value: string) => void;
}
/** 标签条 */
const SearchBar: React.FC<IProps> = (props) => {
  return (
    <div className="inventory-search-area">
      <div style={{ width: '100%' }}>
        <TextBox
          width="100%"
          mode="search"
          placeholder="输入任意内容按下回车键搜索."
          showClearButton
          value={props.value}
          stylingMode="filled"
          onValueChanged={(e) => {
            props.onValueChanged(e.value ?? '');
          }}
        />
      </div>
      <Space size={6}>
        {props.rightBars && props.rightBars}
        {(props.menus.items || []).length > 0 && (
          <Dropdown
            menu={{
              items: props.menus.items || [],
              onClick: props.menus.onClick,
            }}
            dropdownRender={(menu) => (
              <div>{menu && <Button type="link">{menu}</Button>}</div>
            )}
            placement="bottom"
            trigger={['click', 'contextMenu']}>
            <OrgIcons type="/toolbar/more" size={22} notAvatar title="更多" />
          </Dropdown>
        )}
      </Space>
    </div>
  );
};
export default SearchBar;
