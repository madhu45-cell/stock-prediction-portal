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
import { FiTrendingUp, FiTrendingDown, FiInfo, FiTarget, FiZap } from 'react-icons/fi';

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

const PredictionChart = ({ prediction }) => {
  const currentPrice = prediction.current_price || 0;
  const predictedPrice = prediction.predicted_price || 0;
  const expectedReturn = ((predictedPrice - currentPrice) / currentPrice) * 100;
  const isPositive = expectedReturn >= 0;
  
  // Generate daily predictions for chart (linear interpolation)
  const dailyPredictions = [];
  for (let i = 1; i <= 7; i++) {
    const progress = i / 7;
    const dailyPrice = currentPrice + (predictedPrice - currentPrice) * progress;
    dailyPredictions.push(dailyPrice);
  }

  const chartData = {
    labels: ['Current', '+1 Day', '+2 Days', '+3 Days', '+4 Days', '+5 Days', '+6 Days', '+7 Days'],
    datasets: [
      {
        label: 'Historical & Current',
        data: [currentPrice, null, null, null, null, null, null, null],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'AI Predictions',
        data: [null, dailyPredictions[0], dailyPredictions[1], dailyPredictions[2], dailyPredictions[3], dailyPredictions[4], dailyPredictions[5], predictedPrice],
        borderColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        borderWidth: 2,
        borderDash: [8, 4],
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', system-ui, sans-serif",
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#9ca3af',
        borderColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            if (context.raw) {
              return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
            }
            return 'No data available';
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
          font: {
            size: 11,
          },
          color: '#6b7280',
        }
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => `$${value.toFixed(2)}`,
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
        title: {
          display: true,
          text: 'Price (USD)',
          color: '#9ca3af',
          font: {
            size: 11,
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.3,
      },
      point: {
        hoverRadius: 8,
      }
    }
  };

  const confidenceColor = (score) => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
              <FiTarget className={`h-5 w-5 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Price Prediction</h3>
              <p className="text-xs text-gray-500">Based on ensemble ML model</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
            <FiZap className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-medium text-gray-600">{prediction.model_used || 'Ensemble'}</span>
          </div>
        </div>
      </div>

      {/* Prediction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100">
        <div className="bg-white p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Current Price</p>
          <p className="text-2xl font-bold text-gray-900">${currentPrice.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Today's market price</p>
        </div>
        <div className="bg-white p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Predicted Price (7 days)</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            ${predictedPrice.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">AI forecast</p>
        </div>
        <div className="bg-white p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Expected Return</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{expectedReturn.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Potential gain/loss</p>
        </div>
      </div>

      {/* Target Range */}
      {(prediction.price_target_low || prediction.price_target_high) && (
        <div className="px-5 pt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Target Low: ${prediction.price_target_low?.toFixed(2)}</span>
            <span>Target High: ${prediction.price_target_high?.toFixed(2)}</span>
          </div>
          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`absolute h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ 
                left: `${((prediction.price_target_low - currentPrice) / (predictedPrice - currentPrice)) * 100}%`,
                width: `${((prediction.price_target_high - prediction.price_target_low) / (predictedPrice - currentPrice)) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4 pt-2" style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Confidence & Info */}
      <div className="p-5 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${confidenceColor(prediction.confidence_score)}`} />
              <span className="text-xs text-gray-600">Confidence Score</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">Historical Data</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-600">AI Prediction</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <FiInfo className="h-3 w-3" />
            <span>Based on historical patterns & market sentiment</span>
          </div>
        </div>
        
        {/* Confidence Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Low Confidence</span>
            <span>High Confidence</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
              style={{ width: `${(prediction.confidence_score || 0.5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Confidence Score: {((prediction.confidence_score || 0.5) * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredictionChart;