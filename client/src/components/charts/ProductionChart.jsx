import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProductionChart = ({ data }) => {
  const chartData = (data || []).map(item => ({
    date: item._id,
    milk: item.totalMilk,
    output: item.totalOutput
  }));

  if (chartData.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-12">No production data for this period.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="milk" fill="#82ca9d" name="Milk (L)" />
        <Bar dataKey="output" fill="#8884d8" name="Output" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProductionChart;