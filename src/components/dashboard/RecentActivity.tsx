"use client";

import { CalendarCheck, CalendarX, CreditCard, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { useTranslation } from "@/contexts/LanguageContext";

export function RecentActivity() {
  const { dashboard, direction } = useTranslation();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardService.getRecentActivity();
        setActivities(data);
      } catch (error) {
        console.error(dashboard('failedToFetchRecentActivity'), error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboard]);

  const getIconForActivity = (type: string) => {
    switch (type) {
      case "checkin": return CalendarCheck;
      case "checkout": return CalendarCheck;
      case "payment": return CreditCard;
      case "guest": return UserPlus;
      case "cancellation": return CalendarX;
      default: return CalendarCheck;
    }
  };

  const getTranslatedActivityType = (type: string) => {
    switch (type) {
      case "checkin": return dashboard('activityTypeCheckin');
      case "checkout": return dashboard('activityTypeCheckout');
      case "payment": return dashboard('activityTypePayment');
      case "guest": return dashboard('activityTypeGuest');
      case "cancellation": return dashboard('activityTypeCancellation');
      default: return type;
    }
  };

  const getColorForActivity = (type: string) => {
    switch (type) {
      case "checkin": return "#4CAF50";
      case "checkout": return "#2563EB";
      case "payment": return "#3B82F6";
      case "guest": return "#B38B59";
      case "cancellation": return "#EF4444";
      default: return "#4CAF50";
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6" dir={direction}>
        <h3 className="text-sm font-medium text-[#2F2A25] mb-4">{dashboard('recentActivityTitle')}</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-lg bg-[#E7DFD4] shrink-0"></div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 bg-[#E7DFD4] rounded w-3/4"></div>
                <div className="h-3 bg-[#E7DFD4] rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6" dir={direction}>
      <h3 className="text-sm font-medium text-[#2F2A25] mb-4">{dashboard('recentActivityTitle')}</h3>
      <ul className="space-y-4">
        {activities.length > 0 ? activities.map((a, i) => {
          const Icon = getIconForActivity(a.type);
          const color = getColorForActivity(a.type);
          return (
            <li key={i} className="flex items-start gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}1F`, color }}
              >
                <Icon size={15} className={direction === 'rtl' ? 'rtl-flip' : ''} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#2F2A25] truncate">{a.description}</p>
                <p className="text-xs text-[#6B6258] truncate">{getTranslatedActivityType(a.type)}</p>
              </div>
              <span className="text-[11px] text-[#9A9085] shrink-0">{a.timestamp}</span>
            </li>
          );
        }) : (
          <li className="text-sm text-[#6B6258]">{dashboard('noRecentActivity')}</li>
        )}
      </ul>
    </div>
  );
}
