import TreeTargetItem from "@/components/DataStandard/ReportForm/Viewer/components/treeTarget";
import useAsyncLoad from "@/hooks/useAsyncLoad";
import { FiledLookup } from "@/ts/base/model";
import { ISpecies } from "@/ts/core";
import { Spin } from "antd";
import React from "react";

interface Props {
  species: ISpecies;
  value: string;
  onChange: (value: string, title?: string) => void;
}

export function SpeciesItemSelect(props: Props) {
  const [loaded, items] = useAsyncLoad(async () => {
    await props.species.loadItems();
    return props.species.items.map(item => {
      return {
        id: item.id,
        parentId: item.parentId,
        value: item.info,
        text: item.name,
      } as FiledLookup
    })
  });


  if (!loaded) {
    return <Spin></Spin>;
  } else {
    return (
      <TreeTargetItem 
        speciesItems={items!} 
        selectValue={props.value}
        onValueChanged={(e: any) => props.onChange(e.value, e.title)}
      />
    );
  }
}
