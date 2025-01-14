export interface GetterProps {
  field: string;
  type: 'attribute' | 'property';
  formId?: string;
}

export const validRule = (
  filter: any[],
  getter: (params: GetterProps) => any,
): boolean => {
  if (filter) {
    if (filter.includes('and') || filter.includes('or')) {
      let operate = 'and';
      let result: boolean[] = [];
      for (const rule of filter) {
        if (Array.isArray(rule)) {
          result.push(validRule(rule, getter));
        } else if (['and', 'or'].includes(rule)) {
          operate = rule;
        }
      }
      return operate == 'and' ? !result.includes(false) : result.includes(true);
    } else {
      let keys = filter[0].indexOf('-') != -1 ? filter[0].split('-') : [];
      let dataValue;
      if (keys.length == 2) {
        dataValue = getter({
          field: keys[1],
          type: keys[1].includes('T') ? 'property' : 'attribute',
          formId: keys[0],
        });
      } else if (keys.length == 1) {
        dataValue = getter({
          field: keys[0],
          type: keys[0].includes('T') ? 'property' : 'attribute',
        });
      }
      if (filter.length == 3) {
        if (dataValue) {
          switch (filter[1]) {
            case '=':
              return dataValue == filter[2];
            case '<>':
              return dataValue != filter[2];
            case '>':
              return dataValue > filter[2];
            case '>=':
              return dataValue >= filter[2];
            case '<':
              return dataValue < filter[2];
            case '<=':
              return dataValue <= filter[2];
            case 'contains':
              return `${dataValue}`.includes(filter[2]);
            case 'notcontains':
              return !`${dataValue}`.includes(filter[2]);
            case 'startswith':
              return `${dataValue}`.startsWith(filter[2]);
            case 'endswith':
              return `${dataValue}`.endsWith(filter[2]);
            case 'isblank':
              return `${dataValue}`.trim().length == 0;
            case 'isnotblank':
              return `${dataValue}`.trim().length > 0;
            case 'between':
              if (Array.isArray(filter[2]) && filter[2].length == 2) {
                return dataValue > filter[2][0] && dataValue <= filter[2][1];
              }
              break;
            default:
              break;
          }
        }
      } else if (filter.length == 2) {
        switch (filter[1]) {
          case 'isblank':
            return dataValue == undefined;
          case 'isnotblank':
            return dataValue != undefined;
          default:
            break;
        }
      } else if (filter.length == 1) {
        return validRule(filter[0], getter);
      }
    }
  }
  return false;
};
