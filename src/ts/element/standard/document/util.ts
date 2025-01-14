import { PageElement } from '../../PageElement';
import { SEntity } from '..';
import { ListTableProps } from './model';
import { FormRef } from './model';
import { DocumentNodeMapping } from '@/ts/base/model';


export function getAllProps(elements: PageElement[]): SEntity[] {
  const ret: SEntity[] = [];
  for (const e of elements) {
    if (e.kind == 'PropertyValue' && e.props.prop) {
      ret.push(e.props.prop);
    }else if(e.kind == 'Image' && e.props.imageStyle=='form' && e.props.imageProp){
      ret.push(e.props.imageProp);
    }else if(e.kind == 'Checkbox' && e.props.checkprop){
      ret.push(e.props.checkprop);
    } else {
      ret.push(...getAllProps(e.children));
    }
  }
  return ret;
}

export function getAllForms(elements: PageElement[]): FormRef[] {
  const ret: SEntity[] = [];
  for (const e of elements) {
    if (e.kind == 'ListTable' && e.props.form) {
      const p = e.props as ListTableProps;
      ret.push({
        ...p.form!,
        summary: p.showSummary,
        speciesSummary: p.speciesSummary,
      });
    } else {
      ret.push(...getAllForms(e.children));
    }
  }
  return ret;
}


export function getAllWorkNodes(elements: PageElement[]): DocumentNodeMapping[] {
  const ret: DocumentNodeMapping[] = [];
  for (const e of elements) {
    if (e.kind == 'WorkNode' && e.props.nodeKey) {
      ret.push({
        nodeId: '',
        nodeKey: e.props.nodeKey,
      });
    } else {
      ret.push(...getAllWorkNodes(e.children));
    }
  }
  return ret;
}