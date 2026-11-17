import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [datePreset, setDatePreset] = useState('all'); // 'all', '12m', '6m', '90d', '30d'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Delayed Delivery Alert',
      message: '3 purchase orders from Bengal Silver Artisans are overdue.',
      type: 'warning',
      time: '10m ago',
      read: false
    },
    {
      id: 2,
      title: 'Quality Breach Threshold',
      message: 'Defect rate on Gold Necklaces reached 3.8% this week.',
      type: 'critical',
      time: '1h ago',
      read: false
    },
    {
      id: 3,
      title: 'Top Supplier Recognition',
      message: 'Surat Diamond Cutters Ltd achieved 98.5% reliability.',
      type: 'success',
      time: '4h ago',
      read: true
    }
  ]);

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getEffectiveDateRange = () => {
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    const end = new Date('2026-11-15T00:00:00Z');
    let start = new Date(end);

    if (datePreset === '30d') {
      start.setDate(end.getDate() - 30);
    } else if (datePreset === '90d') {
      start.setDate(end.getDate() - 90);
    } else if (datePreset === '6m') {
      start.setMonth(end.getMonth() - 6);
    } else if (datePreset === '12m') {
      start.setFullYear(end.getFullYear() - 1);
    } else {
      // 'all'
      return { startDate: '', endDate: '' };
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  return (
    <FilterContext.Provider value={{
      datePreset,
      setDatePreset,
      customStartDate,
      setCustomStartDate,
      customEndDate,
      setCustomEndDate,
      globalSearch,
      setGlobalSearch,
      getEffectiveDateRange,
      notifications,
      markAllNotificationsAsRead
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilter must be used within a FilterProvider');
  return context;
}
