"use client";

import React from "react";
import { useState } from "react";

import BalanceForm from "./components/BalanceForm";
import BalanceTable from "./components/BalanceTable";
import DateFilter from "./components/DateFilter";

import RemainingBalanceChart from "./components/RemainingBalanceChart";


const page = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add Balance</h1>

      <BalanceForm onSuccess={handleRefresh} />
      <div className="mt-4"> <RemainingBalanceChart refreshTrigger={refreshTrigger} /></div>
   
      <div className="mt-4"><DateFilter /></div>
      <BalanceTable refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default page;
