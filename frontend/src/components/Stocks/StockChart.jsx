import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { FiTrendingUp, FiTrendingDown, FiInfo } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StockChart = ({ data, symbol, currentPrice, change, changePercent }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FiTrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No chart data available</p>
          <p className="text-xs text-gray-400 mt-1">Try selecting a different time period</p>
        </div>
      </div>
    );
  }

  // Calculate min and max for better visualization
  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const isPositive = change >= 0;

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Close Price',
        data: prices,
        borderColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 11,
            family: "'Inter', system-ui, sans-serif"
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
        borderColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            return `Price: $${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: true,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          }
        }
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => `$${value}`,
          font: {
            size: 11,
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 0,
        hoverRadius: 6,
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Chart Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{symbol || 'Stock Price'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Historical price data</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Current Price</p>
              <p className="text-xl font-bold text-gray-900">${currentPrice?.toFixed(2) || '--'}</p>
            </div>
            {change !== undefined && (
              <div className="text-right">
                <p className="text-xs text-gray-500">24h Change</p>
                <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{changePercent?.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Range Indicator */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Low: ${minPrice.toFixed(2)}</span>
          <span>High: ${maxPrice.toFixed(2)}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${((currentPrice - minPrice) / (maxPrice - minPrice)) * 100}%` }}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 pt-2" style={{ height: '380px' }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Stats Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">Period</p>
            <p className="text-sm font-medium text-gray-800">Last {data.length} days</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Average Price</p>
            <p className="text-sm font-medium text-gray-800">
              ${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Volatility</p>
            <p className="text-sm font-medium text-gray-800">
              ±{((Math.max(...prices) - Math.min(...prices)) / Math.min(...prices) * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FiInfo className="h-3 w-3" />
          <span>Hover over the chart to see detailed values</span>
        </div>
      </div>
    </div>
  );
};

export default StockChart;