import Papa from 'papaparse';
import type { UsdtCalc } from './types';

export const exportToCSV = (data: UsdtCalc[], filename = 'usdt-history.csv') => {
  const csvData = data.map(calc => ({
    'วันที่': new Date(calc.createdAt).toLocaleString('th-TH'),
    'ยอดซื้อ (THB)': calc.thb.toFixed(2),
    'USD ที่ได้': calc.usd.toFixed(2),
    'เรทขาย (THB/USD)': calc.sellRate.toFixed(2),
    'ต้นทุน/USD': calc.costPerUsd.toFixed(2),
    'ยอดขายรวม (THB)': calc.sellTotal.toFixed(2),
    'กำไร/ขาดทุน (THB)': calc.profit.toFixed(2),
    'กำไร/ขาดทุน (%)': calc.profitPercent.toFixed(2),
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: UsdtCalc[], filename = 'usdt-history.json') => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateFilename = (type: 'csv' | 'json') => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10);
  return `usdt-history-${timestamp}.${type}`;
};

export const generateSummary = (data: UsdtCalc[]) => {
  if (data.length === 0) {
    return {
      totalTransactions: 0,
      totalInvested: 0,
      totalRevenue: 0,
      totalProfit: 0,
      profitRate: 0,
      winRate: 0,
    };
  }

  const totalInvested = data.reduce((sum, calc) => sum + calc.thb, 0);
  const totalRevenue = data.reduce((sum, calc) => sum + calc.sellTotal, 0);
  const totalProfit = data.reduce((sum, calc) => sum + calc.profit, 0);
  const profitRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const winCount = data.filter(calc => calc.profit > 0).length;
  const winRate = (winCount / data.length) * 100;

  return {
    totalTransactions: data.length,
    totalInvested,
    totalRevenue,
    totalProfit,
    profitRate,
    winRate,
  };
};
