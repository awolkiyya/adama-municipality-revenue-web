"use client";

import React, {
  useCallback,
  useState,
} from "react";

import { AsyncDropdown } from "./AsyncDropdown";
import { MeasurementUnit } from "@/types/revenue/revenue-unit";
import { measurementUnitService } from "@/services/revenue/revenueUnit.service";



interface MeasurementUnitDropdownProps {

  value: string | null;

  onChange: (
    value: string,
    item: MeasurementUnit
  ) => void;

  disabled?: boolean;

}



export const MeasurementUnitDropdown: React.FC<
  MeasurementUnitDropdownProps
> = ({
  value,
  onChange,
  disabled = false,
}) => {


  const [pageSize] = useState(20);



  const fetchMeasurementUnits = useCallback(
    async ({
      search,
      page,
      pageSize,
    }: {
      search:string;
      page:number;
      pageSize:number;
    }) => {


      const result =
        await measurementUnitService.getUnits({

          search,

          page,

          per_page: pageSize,

          isActive:true,

        });



      return {

        data:
          Array.isArray(result?.data)
            ? result.data
            : [],


        total:
          result?.meta?.total ?? 0,

      };


    },
    []
  );



  return (

    <AsyncDropdown<
      MeasurementUnit,
      string
    >

      value={value}

      onChange={onChange}

      fetchData={fetchMeasurementUnits}

      displayField="name"

      valueField="id"

      placeholder="Select Measurement Unit"

      pageSize={pageSize}

      disabled={disabled}

    />

  );

};