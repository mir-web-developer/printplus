// ScatterPlot.js
import React from "react";
import { Scatter } from "react-chartjs-2";

const ScatterPlot = ({ data }) => {
  return (
    <div>
      <Scatter data={data} />
    </div>
  );
};

export default ScatterPlot;