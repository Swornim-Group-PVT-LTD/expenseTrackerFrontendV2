"use client";

import { useTranslation } from "react-i18next";
import React from 'react'

const BalanceLineChart = () => {
  const { t } = useTranslation();
  return (
    <div className='w-full h-64 bg-white rounded-lg mb-8 flex justify-center items-center'>
      <h1 className='font-bold text-md'>{t("No Data Found")}</h1>
    </div>
  )
}

export default BalanceLineChart
