export const filterConvert = (filterExp: string) => {
  try {
    if (filterExp) {
      const filters = JSON.parse(filterExp);
      if (Array.isArray(filters)) {
        return groupOperation(filters);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const filterRecursion = (filters: any[], match: any[]) => {
  for (const filter of filters) {
    if (Array.isArray(filter)) {
      match.push(groupOperation(filter));
    }
  }
};

const groupOperation = (filter: any[]) => {
  var operate = filter.find((item) => item == 'and' || item == 'or');
  if (operate) {
    let next: any[] = [];
    filterRecursion(filter, next);
    return { [`_${operate}_`]: next };
  } else {
    return buildCondition(filter);
  }
};

const buildCondition = (filters: any) => {
  switch (filters[1]) {
    case '=':
      return { [filters[0]]: filters[2] };
    case '<>':
      return { [filters[0]]: { _ne_: filters[2] } };
    case '>':
      return { [filters[0]]: { _gt_: filters[2] } };
    case '>=':
      return { [filters[0]]: { _gte_: filters[2] } };
    case '<':
      return { [filters[0]]: { _lt_: filters[2] } };
    case '<=':
      return { [filters[0]]: { _lte_: filters[2] } };
    case 'contains':
      return { [filters[0]]: { _regex_: filters[2] } };
    case 'notcontains':
      return { [filters[0]]: { _not_: filters[2] } };
    case 'startswith':
      return { [filters[0]]: { _regex_: `^${filters[2]}` } };
    case 'endswith':
      return { [filters[0]]: { _regex_: `${filters[2]}$` } };
    default:
      return {};
  }
};
