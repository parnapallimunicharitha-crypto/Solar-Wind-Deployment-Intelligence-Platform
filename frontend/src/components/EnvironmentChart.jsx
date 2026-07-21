import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement
)

export default function EnvironmentChart({ weatherData, windData }) {
  if (!weatherData && !windData) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        Run an assessment to see charts
      </div>
    )
  }

  const labels = ['Solar Irradiance', 'Wind Speed', 'Temperature', 'Humidity']
  const values = [
    weatherData?.solar_irradiance ?? 0,
    windData?.wind_speed ?? 0,
    weatherData?.temperature ?? 0,
    weatherData?.humidity ?? 0,
  ]

  const data = {
    labels,
    datasets: [
      {
        label: 'Environmental Metrics',
        data: values,
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)',   // amber - solar
          'rgba(59, 130, 246, 0.8)',   // blue - wind
          'rgba(239, 68, 68, 0.8)',    // red - temperature
          'rgba(34, 197, 94, 0.8)',    // green - humidity
        ],
        borderColor: [
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Environmental Metrics Overview',
        font: { size: 14, weight: 'bold' },
        color: '#374151',
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } },
    },
  }

  return <Bar data={data} options={options} />
}
