import { DirectoryHandler, DirectorySheet } from './directory';
import { AttrHandler, AttrSheet, FormHandler, FormSheet } from './template/form';
import { PropHandler, PropSheet } from './standard/property';
import { ClassifySheet, DictSheet, SpeciesHandler } from './standard/species';
import {
  ClassifyItemHandler,
  ClassifyItemSheet,
  DictItemHandler,
  DictItemSheet,
} from './standard/speciesitem';
import { AnyHandler, AnySheet } from './anything';
import { schema, model, IDirectory } from '..';

export const getStandardSheets = (directory: IDirectory) => {
  return [
    new DirectoryHandler(new DirectorySheet(directory)),
    new SpeciesHandler(new DictSheet(directory)),
    new DictItemHandler(new DictItemSheet(directory)),
    new SpeciesHandler(new ClassifySheet(directory)),
    new ClassifyItemHandler(new ClassifyItemSheet(directory)),
    new PropHandler(new PropSheet(directory)),
  ];
};

export const getBusinessSheets = (directory: IDirectory) => {
  return [
    new DirectoryHandler(new DirectorySheet(directory)),
    new FormHandler(new FormSheet(directory)),
    new AttrHandler(new AttrSheet(directory)),
  ];
};

export const getAnythingSheets = (
  form: schema.XForm,
  fields: model.FieldModel[],
  character: string,
): AnyHandler[] => {
  return [
    new AnyHandler(
      new AnySheet(
        form.id,
        form.name,
        fields.map((item) => {
          return {
            title: item.name,
            dataIndex: item[character],
            valueType: item.valueType,
            lookups: item.lookups,
            widget: item.widget,
            options: item.options,
          };
        }),
      ),
    ),
  ];
};

export { AnyHandler, AnySheet } from './anything';
