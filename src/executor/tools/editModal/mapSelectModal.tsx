import message from '@/utils/message';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import cls from './index.module.less';

interface IFormSelectProps {
  onSave: (lnglat:any) => void;
  onCancel?: () => void;
  latlng?: any;
}


const MapSelectModal = ({
  onSave,
  onCancel,
  latlng,
}: IFormSelectProps) => {
  let lnglat = latlng[0] ? latlng : [{},{}]
  let marker:any = null
  let map: any = null;

  const Map = () => {
    const [searchValue, setSearchValue] = useState('');
    const [tipList, setTipList] = useState<any[]>([]);

    useEffect(() => {
      initMap();
    }, []);

    const initMap = () => {

      map = new AMap.Map('map', {
        center: latlng[0]
          ? [lnglat[0].text, lnglat[1].text]
          : [120.139327, 30.28718],
        zoom: 15,
      });
      map.on('click', (e: any) => {
        if (marker) {
          marker.setMap(null);
        }
        marker = new AMap.Marker({
          position: e.lnglat,
        });
        marker.setMap(map);
        lnglat = [{...lnglat[0], text: e.lnglat.getLng()}, {...lnglat[1], text:  e.lnglat.getLat()}]
      })
      if (latlng[0]) {
        marker = new AMap.Marker({
          position: [lnglat[0].text, lnglat[1].text],
        });
        marker.setMap(map);
      }
    };

    const req = (e:any) => {
      AMap.plugin("AMap.AutoComplete", function () {
        // 注意：输入提示插件2.0版本需引入AMap.AutoComplete，而1.4版本应使用AMap.Autocomplete
        // 实例化AutoComplete
        const autoOptions = {
          city: '全国'
        };
        const autoComplete = new AMap.AutoComplete(autoOptions);
        autoComplete.search(e.target.value, function (status:any, result:any) {
          if (status === "complete" && result.info === "OK") {
            console.log(result);
            setTipList(result.tips);
          } else {
            message.warn(result.info)
          }
        });
      });
    }
    const dereq:any = debounce((e:any) => req(e), 2000)
    const searchChange = (e: any) => {
      setSearchValue(e.target.value);
      dereq(e)
    };
    const tipClick = (row:any) => {
      if (row.location) {
        if (marker) {
          marker.setMap(null);
        }
        marker = new AMap.Marker({
          position: [row.location.lng, row.location.lat],
        });
        map.setCenter([row.location.lng, row.location.lat]);
        marker.setMap(map);
        lnglat = [{...lnglat[0], text: row.location.lng}, {...lnglat[1], text: row.location.lat}]
      } else {
        message.warn('未找到位置, 请继续输入')
      }
    }

    return (
      <div className={cls.con}>
        <div id='map' style={{ height: '500px' }}></div>
        <div className={cls.info}>
          <div className={cls.inputItem}>
            <div className={cls.inputItemPrepend}>
              <span className={cls.inputItemText}>请输入关键字</span>
            </div>
            <input value={searchValue} onChange={e => searchChange(e)} id='tipinput' className={cls.tipinput} type="text" />
            <div className={cls.list}>
              {
                tipList.map((item:any) => {
                  return <div onClick={() => tipClick(item)} className={cls.listItem} key={item.id}>{item.name}</div>
                })
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  const loadContent = () => {
    return <Map />
  };

  const modal = Modal.confirm({
    icon: <div>请选择点位</div>,
    width: '50vw',
    okText: `确认选择`,
    className: 'selects-modal',
    cancelText: '关闭',
    onCancel: () => {
      modal.destroy();
      onCancel?.();
    },
    content: loadContent(),
    onOk: () => {
      modal.destroy();
      onSave(lnglat);
    },
  });
};

export default MapSelectModal;

let timeout:any;
function debounce(func:any, wait:any, immediate?:any) {
  return function () {
    let context:any = this;
    let args = arguments;

    console.log(args);

    if (timeout) clearTimeout(timeout); // timeout 不为null
    if (immediate) {
      let callNow = !timeout; // 第一次会立即执行，以后只有事件执行后才会再次触发
      timeout = setTimeout(function () {
        timeout = null;
      }, wait)
      if (callNow) {
        func.apply(context, args)
      }
    }
    else {
      timeout = setTimeout(function () {
        func.apply(context, args)
      }, wait);
    }
  }
}
