'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Synergy } from '@/lib/types';
import { formatCompactNumber } from '@/lib/utils';

interface IndustryChartProps {
  synergies: Synergy[];
}

export function IndustryChart({ synergies }: IndustryChartProps) {
  // Group synergies by industry
  const industryData = synergies.reduce((acc, synergy) => {
    const industryName = synergy.industry?.name || 'Uncategorized';
    if (!acc[industryName]) {
      acc[industryName] = { name: industryName, value: 0, count: 0 };
    }
    acc[industryName].value += (synergy.value_low + synergy.value_high) / 2;
    acc[industryName].count += 1;
    return acc;
  }, {} as Record<string, { name: string; value: number; count: number }>);

  const chartData = Object.values(industryData).sort((a, b) => b.value - a.value);

  return (
    <Card className="glass-card border-white/20 bg-white/10 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white">Value by Industry</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="#fff"
                tick={{ fill: '#fff' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke="#fff"
                tick={{ fill: '#fff' }}
                tickFormatter={(value) => formatCompactNumber(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                }}
                formatter={(value: number) => [formatCompactNumber(value), 'Total Value']}
              />
              <Legend wrapperStyle={{ color: 'white' }} />
              <Bar dataKey="value" fill="#10b981" name="Total Value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
