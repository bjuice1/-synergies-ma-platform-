'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Synergy } from '@/lib/types';

interface StatusChartProps {
  synergies: Synergy[];
}

const COLORS = {
  IDENTIFIED: '#3b82f6', // blue
  IN_PROGRESS: '#f59e0b', // amber
  REALIZED: '#10b981', // emerald
  AT_RISK: '#ef4444', // red
};

export function StatusChart({ synergies }: StatusChartProps) {
  // Count synergies by status
  const statusCounts = synergies.reduce((acc, synergy) => {
    acc[synergy.status] = (acc[synergy.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    fill: COLORS[status as keyof typeof COLORS] || '#6b7280',
  }));

  return (
    <Card className="glass-card border-white/10 bg-white/5 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="text-white">Synergies by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
              <Legend
                wrapperStyle={{
                  color: 'white',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
