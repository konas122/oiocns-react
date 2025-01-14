import { IExistTypeEditor } from './IExistTypeEditor';
import CssSizeEditor from './CssSizeEditor';
import { Form, Picture, Work, Species, Property } from './FileProp';
import SlotProp from './SlotProp';
import { ColorEditor } from './ColorEditor';
import { TableColumnConfig } from './document/TableColumnConfig';
import { TableSpeciesSummaryConfig } from './document/TableSpeciesSummaryConfig';
import { WorkProperty } from './document/WorkProperty';

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  picFile: Picture,
  workFile: Work,
  formFile: Form,
  speciesFile: Species,
  propertyFile: Property,
  
  size: CssSizeEditor,
  slot: SlotProp,
  color: ColorEditor,

  TableColumnConfig: TableColumnConfig,
  TableSpeciesSummaryConfig: TableSpeciesSummaryConfig,
  workProp: WorkProperty,
};

export default editors;
