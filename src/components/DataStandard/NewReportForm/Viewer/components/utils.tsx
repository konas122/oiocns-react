export const organizeData = (items: any, parentId = undefined) => {
  return items
    .filter((item: any) => item.parentId === parentId)
    .map((item: any) => ({ ...item, children: organizeData(items, item.id) }));
};
