'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import type { Synergy } from '@/lib/types';
import { formatCompactNumber } from '@/lib/utils';

interface ValueDistributionChartProps {
  synergies: Synergy[];
}

export function ValueDistributionChart({ synergies }: ValueDistributionChartProps) {
  // Create scatter data with value ranges
  const chartData = synergies.map((synergy, index) => ({
    name: synergy.synergy_type,
    valueLow: synergy.value_low,
    valueHigh: synergy.value_high,
    average: (synergy.value_low + synergy.value_high) / 2,
    index: index + 1,
    status: synergy.status,
  }));

  const getColor = (status: string) => {
    switch (status) {
      case 'IDENTIFIED':
        return '#3b82f6';
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'REALIZED':
        return '#10b981';
      case 'AT_RISK':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <Card className="glass-card border-white/20 bg-white/10 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white">Value Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                type="number"
                dataKey="index"
                name="Synergy #"
                stroke="#fff"
                tick={{ fill: '#fff' }}
                label={{ value: 'Synergy Index', position: 'insideBottom', offset: -10, fill: '#fff' }}
              />
              <YAxis
                type="number"
                dataKey="average"
                name="Average Value"
                stroke="#fff"
                tick={{ fill: '#fff' }}
                tickFormatter={(value) => formatCompactNumber(value)}
                label={{ value: 'Value ($)', angle: -90, position: 'insideLeft', fill: '#fff' }}
              />
              <ZAxis type="number" dataKey="valueHigh" range={[50, 400]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                }}
                formatter={(value: number) => formatCompactNumber(value)}
                labelFormatter={(label) => `Synergy #${label}`}
              />
              {['IDENTIFIED', 'IN_PROGRESS', 'REALIZED', 'AT_RISK'].map((status) => (
                <Scatter
                  key={status}
                  name={status.replace('_', ' ')}
                  data={chartData.filter((d) => d.status === status)}
                  fill={getColor(status)}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
