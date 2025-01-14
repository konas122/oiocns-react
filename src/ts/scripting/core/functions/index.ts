import * as collection from './collection';
import * as primitive from './primitive';

import collectionDef from './collection.g.d.ts?raw';
import primitiveDef from './primitive.g.d.ts?raw';

import formDef from './form.g.d.ts?raw';
export { default as codeDef } from './form-code.g.d.ts?raw';

export const functions = {
  ...collection,
  ...primitive,
};

export const defs = [
  collectionDef, 
  primitiveDef,
].join('\n\n');

export const formDefs = [defs, formDef].join('\n\n');
