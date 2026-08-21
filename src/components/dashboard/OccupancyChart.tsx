"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { useTranslation } from "@/contexts/LanguageContext";

export function OccupancyChart() {
  const { dashboard, direction } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const occupancyData = await dashboardService.getOccupancyRates(startDate, endDate);
        
        // Convert occupancy data to room status breakdown format
        const totalRooms = 60; // This should come from API
        const occupiedRooms = Math.round((occupancyData[occupancyData.length - 1]?.occupancy || 0) / 100 * totalRooms);
        const availableRooms = totalRooms - occupiedRooms;
        
        const breakdown = [
          { status: "Occupied", count: occupiedRooms, color: "#2563EB" },
          { status: "Available", count: availableRooms, color: "#4CAF50" },
          { status: "Reserved", count: 9, color: "#3B82F6" },
          { status: "Cleaning", count: 5, color: "#F59E0B" },
          { status: "Maintenance", count: 2, color: "#EF4444" },
        ];

        // Store both original and translated status
        const statusTranslations = {
          "Occupied": dashboard('roomStatusOccupied'),
          "Available": dashboard('roomStatusAvailable'),
          "Reserved": dashboard('roomStatusReserved'),
          "Cleaning": dashboard('roomStatusCleaning'),
          "Maintenance": dashboard('roomStatusMaintenance'),
        };

        const translatedBreakdown = breakdown.map(item => ({
          ...item,
          translatedStatus: statusTranslations[item.status as keyof typeof statusTranslations] || item.status
        }));
        
        setData(translatedBreakdown);
      } catch (error) {
        console.error(dashboard('failedToFetchOccupancyData'), error);
        // Fallback data
        const fallbackData = [
          { status: "Occupied", count: 42, color: "#2563EB" },
          { status: "Available", count: 18, color: "#4CAF50" },
          { status: "Reserved", count: 9, color: "#3B82F6" },
          { status: "Cleaning", count: 5, color: "#F59E0B" },
          { status: "Maintenance", count: 2, color: "#EF4444" },
        ];

        const statusTranslations = {
          "Occupied": dashboard('roomStatusOccupied'),
          "Available": dashboard('roomStatusAvailable'),
          "Reserved": dashboard('roomStatusReserved'),
          "Cleaning": dashboard('roomStatusCleaning'),
          "Maintenance": dashboard('roomStatusMaintenance'),
        };

        const translatedFallbackData = fallbackData.map(item => ({
          ...item,
          translatedStatus: statusTranslations[item.status as keyof typeof statusTranslations] || item.status
        }));
        
        setData(translatedFallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboard]);

  const total = data.reduce((sum, r) => sum + r.count, 0);
  const occupiedPct = Math.round(
    ((data.find((r) => r.translatedStatus === dashboard('roomStatusOccupied'))?.count ?? 0) / total) * 100
  );

  if (loading) {
    return (
      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6 h-full flex flex-col" dir={direction}>
        <h3 className="text-sm font-medium text-[#2F2A25] mb-1">{dashboard('roomStatusBreakdown')}</h3>
        <div className="h-64 animate-pulse bg-[#E7DFD4]/30 rounded flex-1 min-h-[180px]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6 h-full flex flex-col" dir={direction}>
      <h3 className="text-sm font-medium text-[#2F2A25] mb-1">{dashboard('roomStatusBreakdown')}</h3>
      <p className="text-xs text-[#6B6258] mb-2">{total} {dashboard('roomsTotal')}</p>

      <div className="relative flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="translatedStatus"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.translatedStatus} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E7DFD4",
                borderRadius: 12,
                fontSize: 12,
                color: "#2F2A25",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold text-[#2F2A25] font-mono">{occupiedPct}%</span>
          <span className="text-[11px] text-[#9A9085]">{dashboard('occupied')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.map((r) => (
          <div key={r.translatedStatus} className="flex items-center gap-1.5 text-xs text-[#6B6258]">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.color }} />
            <span className="min-w-0 flex-1">{r.translatedStatus}</span> 
            <span className="text-[#9A9085] font-mono">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}