"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { useTranslation } from "@/contexts/LanguageContext";

export function RevenueChart() {
  const { dashboard, common, direction } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const revenueData = await dashboardService.getRevenue(startDate, endDate);
        setData(revenueData);
      } catch (error) {
        console.error(dashboard('failedToFetchRevenueData'), error);
        // Fallback to empty data
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboard]);

  if (loading) {
    return (
      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6 h-full" dir={direction}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-[#2F2A25]">{dashboard('revenueThisWeek')}</h3>
          <span className="text-xs text-[#4CAF50] bg-[#DCFCE7] rounded-full px-2 py-0.5">{common('loading')}</span>
        </div>
        <div className="h-64 animate-pulse bg-[#E7DFD4]/30 rounded"></div>
      </div>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);

  return (
    <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6 h-full" dir={direction}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-[#2F2A25]">{dashboard('revenueThisWeek')}</h3>
        <span className="text-xs text-[#166534] bg-[#DCFCE7] rounded-full px-2 py-0.5">+12.4%</span>
      </div>
      <p className="text-2xl font-semibold text-[#2F2A25] font-mono mb-4">DH{totalRevenue.toLocaleString()}</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#4CAF50" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(76,175,80,0.1)" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#6B6258" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tick={{ fontSize: 12, fill: '#6B6258' }}
            reversed={direction === 'rtl'}
          />
          <YAxis 
            stroke="#6B6258" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(v) => `DH${v / 1000}k`}
            tick={{ fontSize: 12, fill: '#6B6258' }}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E7DFD4",
              borderRadius: 12,
              fontSize: 12,
              color: "#2F2A25",
              textAlign: direction === 'rtl' ? 'right' : 'left'
            }}
            formatter={(value) => [`DH${Number(value).toLocaleString()}`, dashboard('revenue')]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={2.5} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
