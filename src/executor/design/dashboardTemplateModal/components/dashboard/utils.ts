import _ from 'lodash';

/**
 * 1.	如果没有 conditions 字段，并且 formId 相同，则合并这些项。
 * 2.	如果有 conditions，且 formId 和 conditions 都相同，则合并这些项。
 * 3.	如果 conditions 不同，即使 formId 相同，也不合并。
 * @param data
 * @returns
 */
export function mergeData(data: any): any[] {
  if (!Array.isArray(data)) return data;
  const mergedData: any[] = [];
  data.forEach((item) => {
    const { formId, conditions } = item;
    // 查找是否存在匹配的项
    const matchIndex = mergedData.findIndex((existingItem) => {
      return (
        existingItem.formId === formId &&
        ((!conditions && !existingItem.conditions) ||
          (conditions && _.isEqual(conditions, existingItem.conditions)))
      );
    });

    if (matchIndex === -1) {
      // 不存在匹配项，加入新项
      mergedData.push(
        _.pick(item, ['spaceId', 'targetId', 'formId', 'conditions', 'key', 'id']),
      );
    }
  });
  return mergedData;
}
