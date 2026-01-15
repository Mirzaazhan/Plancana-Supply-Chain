"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  Brain,
  Droplets,
  Thermometer,
  Zap,
  Info,
  TrendingUp,
  TrendingDown,
  Map as MapIcon,
  BarChart3,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";
import ArcGISMap from "@/components/gis-map/testMap";
import api from "@/services/api";

const dummyCorrelationData = [
  // Batch 001 - High Humidity at Processing leading to high moisture
  {
    batchId: "BAT-2025-001",
    moisture: 24.5,
    quality: "C",
    stage: "farm",
    humidity: 72,
    temp: 28,
  },
  {
    batchId: "BAT-2025-001",
    moisture: 24.5,
    quality: "C",
    stage: "processing",
    humidity: 92,
    temp: 27,
  },
  {
    batchId: "BAT-2025-001",
    moisture: 24.5,
    quality: "C",
    stage: "distribution",
    humidity: 88,
    temp: 25,
  },

  // Batch 002 - Dry Farm, Humid Distribution
  {
    batchId: "BAT-2025-002",
    moisture: 16.2,
    quality: "B",
    stage: "farm",
    humidity: 45,
    temp: 31,
  },
  {
    batchId: "BAT-2025-002",
    moisture: 16.2,
    quality: "B",
    stage: "processing",
    humidity: 55,
    temp: 24,
  },
  {
    batchId: "BAT-2025-002",
    moisture: 16.2,
    quality: "B",
    stage: "distribution",
    humidity: 82,
    temp: 22,
  },

  // Batch 003 - Consistent Optimal Conditions
  {
    batchId: "BAT-2025-003",
    moisture: 12.1,
    quality: "A",
    stage: "farm",
    humidity: 50,
    temp: 29,
  },
  {
    batchId: "BAT-2025-003",
    moisture: 12.1,
    quality: "A",
    stage: "processing",
    humidity: 48,
    temp: 24,
  },
  {
    batchId: "BAT-2025-003",
    moisture: 12.1,
    quality: "A",
    stage: "distribution",
    humidity: 52,
    temp: 23,
  },

  // Batch 004 - Processing Stress
  {
    batchId: "BAT-2025-004",
    moisture: 21.0,
    quality: "B",
    stage: "farm",
    humidity: 60,
    temp: 30,
  },
  {
    batchId: "BAT-2025-004",
    moisture: 21.0,
    quality: "B",
    stage: "processing",
    humidity: 89,
    temp: 26,
  },

  // Batch 005 - Normal Data
  {
    batchId: "BAT-2025-005",
    moisture: 13.5,
    quality: "A",
    stage: "farm",
    humidity: 55,
    temp: 28,
  },
  {
    batchId: "BAT-2025-005",
    moisture: 13.5,
    quality: "A",
    stage: "processing",
    humidity: 52,
    temp: 25,
  },
];

const dummyWeatherImpact = [
  {
    condition: "Rain",
    totalOccurrences: 45,
    gradeA: 5,
    gradeB: 15,
    gradeC: 25,
  },
  {
    condition: "Clouds",
    totalOccurrences: 32,
    gradeA: 12,
    gradeB: 15,
    gradeC: 5,
  },
  {
    condition: "Clear",
    totalOccurrences: 28,
    gradeA: 22,
    gradeB: 4,
    gradeC: 2,
  },
  {
    condition: "Drizzle",
    totalOccurrences: 15,
    gradeA: 3,
    gradeB: 7,
    gradeC: 5,
  },
  {
    condition: "Thunderstorm",
    totalOccurrences: 10,
    gradeA: 0,
    gradeB: 2,
    gradeC: 8,
  },
];

const calculateCorrelation = (x, y) => {
  const n = x.length;
  if (n <= 1) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return den === 0 ? 0 : num / den;
};

const IntelligenceBoard = () => {
  const [correlationData, setCorrelationData] = useState([]);
  const [weatherImpact, setWeatherImpact] = useState([]);
  const [selectedStage, setSelectedStage] = useState("farm");

  //comment for testing

  useEffect(() => {
    const loadRealAnalytics = async () => {
      try {
        const response = await api.get(
          "/analytics/weather-quality-correlation"
        );
        if (response.data.success) {
          setCorrelationData(response.data.correlationData);
          setWeatherImpact(response.data.weatherImpact);

          //   // Map backend weatherImpact to your qualityByWeather format if needed
          //   if (response.data.weatherImpact) {
          //     setWeatherImpact(response.data.weatherImpact);
          //   }
        }
      } catch (err) {
        console.error("Failed to load analytics via Axios:", err);
      }
    };
    loadRealAnalytics();
  }, []);

  const correlationChangeData = useMemo(() => {
    return correlationData
      .filter(
        (entry) => entry.stage === selectedStage && entry?.humidity !== null
      )
      .map((entry) => ({
        humidity: entry.humidity,
        moisture: entry.moisture,
        batchId: entry.batchId,
      }));
  }, [correlationData, selectedStage]);

  const temperatureGradeData = useMemo(() => {
    const grades = ["A+", "A", "B", "C"];

    return grades.map((grade) => {
      // Filter batches by the current grade and current selected stage
      const batchesInGrade = correlationData.filter(
        (d) =>
          d.quality === grade && d.stage === selectedStage && d.temp !== null
      );

      // Calculate average temperature
      const avgTemp =
        batchesInGrade.length > 0
          ? batchesInGrade.reduce((acc, curr) => acc + curr.temp, 0) /
            batchesInGrade.length
          : 0;

      return {
        grade: `Grade ${grade}`,
        avgTemp: parseFloat(avgTemp.toFixed(2)),
        count: batchesInGrade.length,
      };
    });
  }, [correlationData, selectedStage]);

  const dynamicStats = useMemo(() => {
    // 1. Humidity vs Moisture Correlation
    const humidityVals = correlationChangeData.map((d) => d.humidity);
    const moistureVals = correlationChangeData.map((d) => d.moisture);
    const humidityMoistureCorr = calculateCorrelation(
      humidityVals,
      moistureVals
    );

    // 2. Temperature vs Quality (Converting Quality Grade to Numeric for math)
    // Grade A = 3, B = 2, C = 1
    const gradeMap = { premium: 4, A: 3, B: 2, C: 1, "N/A": 0 };
    const stageData = correlationData.filter((d) => d.stage === selectedStage);

    const tempVals = stageData.map((d) => d.temp).filter((t) => t !== null);
    const qualityVals = stageData.map((d) => gradeMap[d.quality] || 0);
    const tempQualityCorr = calculateCorrelation(tempVals, qualityVals);

    return {
      humidityMoistureCorr: humidityMoistureCorr.toFixed(2),
      tempQualityCorr: tempQualityCorr.toFixed(2),
    };
  }, [correlationData, correlationChangeData, selectedStage]);

  return (
    <div className="space-y-5 animate-in fade-in duration-700 mx-5 mb-10">
      {/* MAIN HEADER - FR-24 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4  mt-7">
        <div className="">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 ">
            {/* <BarChart3 className="h-7 w-7 text-green-600" /> */}
            Quality Analytics & Insights
          </h1>
          <p className="text-gray-500 mt-1">
            Analyzing the correlation between environmental weather conditions
            and batch quality metrics.
          </p>
        </div>
      </div>
      <div>
        <div className="w-36 flex bg-gray-200 p-1 rounded-lg">
          {["farm", "processing"].map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedStage === stage
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 1. TOP LEVEL: THE CORRELATION SCORECARD */}
      <div className="grid grid-cols-2 max-[431px]:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-3 border-blue-400 ">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Humidity vs Moisture
            </p>
            <Droplets className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <p className="text-3xl font-bold mt-2 text-gray-900">
              {dynamicStats.humidityMoistureCorr > 0 ? "+" : ""}
              {dynamicStats.humidityMoistureCorr}
            </p>
          </div>
          <div
            className={`flex items-center mt-2 text-xs font-semibold ${
              Math.abs(dynamicStats.humidityMoistureCorr) > 0.6
                ? "text-blue-600"
                : "text-gray-500"
            }`}
          >
            {dynamicStats.humidityMoistureCorr > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(dynamicStats.humidityMoistureCorr) > 0.7
              ? "Strong"
              : "Moderate"}{" "}
            Correlation
          </div>
          <p className="text-xs text-gray-700 mt-3 leading-relaxed max-[431px]:text-sm">
            {selectedStage.toUpperCase()} Stage:{" "}
            {Math.abs(dynamicStats.humidityMoistureCorr) > 0.5
              ? "Environmental humidity is significantly impacting product moisture levels."
              : "Low direct impact detected between humidity and moisture currently."}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-3 border-orange-400">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Temp vs Quality Grade
            </p>
            <Thermometer className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">
            {dynamicStats.tempQualityCorr > 0 ? "+" : ""}
            {dynamicStats.tempQualityCorr}
          </p>
          <div
            className={`flex items-center mt-2 text-xs font-semibold ${
              dynamicStats.tempQualityCorr < 0
                ? "text-orange-600"
                : "text-green-600"
            }`}
          >
            {dynamicStats.tempQualityCorr < 0 ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            {Math.abs(dynamicStats.tempQualityCorr) > 0.4
              ? "Relevant Correlation"
              : "Weak Correlation"}
          </div>
          <p className="text-xs text-gray-700 mt-3 leading-relaxed max-[431px]:text-sm">
            {selectedStage.toUpperCase()} Stage: As temperature increases at
            this stage, the overall quality grade tends to
            {dynamicStats.tempQualityCorr < 0
              ? " decrease."
              : " increase or remain stable."}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="lg:col-span-1 h-full">
          {/* Bar Chart for Grade Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="mb-6">
              <h3 className="font-bold text-gray-900">
                Quality Grade Distribution by Weather
              </h3>
              <p className="text-xs text-gray-500">
                Impact of weather events on final product grading.
              </p>
            </div>
            <div className="flex-grow min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherImpact} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="condition"
                    type="category"
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Legend iconType="circle" />
                  <Bar
                    dataKey="premium"
                    name="Premium"
                    stackId="a"
                    fill="#146348ff"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="gradeA"
                    name="Grade A"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="gradeB"
                    name="Grade B"
                    stackId="a"
                    fill="#f59e0b"
                  />
                  <Bar
                    dataKey="gradeC"
                    name="Grade C"
                    stackId="a"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-full ">
            {/* Scatter Chart for Correlation */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="text-m">
                  <h3 className="font-bold text-gray-900">
                    Correlation: Ambient Humidity vs. Product Moisture
                  </h3>
                  Showing correlation for the{" "}
                  <span className="font-bold text-green-600 uppercase">
                    {selectedStage}
                  </span>{" "}
                  stage.
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    dataKey="humidity"
                    name="Humidity"
                    unit="%"
                    label={{
                      value: "Humidity (%)",
                      position: "bottom",
                      offset: 0,
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="moisture"
                    name="Moisture"
                    unit="%"
                    label={{
                      value: "Moisture Content (%)",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg text-xs">
                            <p className="font-bold border-bottom mb-1">
                              {data.batchId}
                            </p>
                            <p className="text-green-600 font-semibold uppercase">
                              {selectedStage} Stage
                            </p>
                            <p>Ambient Humidity: {payload[0].value}%</p>
                            <p>Product Moisture: {data.moisture}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Batches" data={correlationChangeData}>
                    {correlationChangeData.map((entry, index) => {
                      const isCritical =
                        entry.moisture > 17 || entry.humidity > 85;
                      const isWarning =
                        entry.moisture > 14.5 || entry.humidity >= 75;
                      const isSafe = !isCritical && !isWarning;

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            isCritical
                              ? "#ef4444"
                              : isWarning
                              ? "#f97316"
                              : isSafe
                              ? "#3b82f6"
                              : "#9ca3af"
                          }
                          strokeWidth={isCritical ? 2 : 0}
                          stroke="#991b1b"
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Safe
                  Range
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" /> High
                  Risk
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> High
                  Moisture Risk
                </span>
              </div>
            </div>

            {/*Scatter Chart for Correlation*/}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="text-m">
                  <h3 className="font-bold text-gray-900">
                    Avg. Temperature per Quality Grade
                  </h3>
                  Showing correlation for the{" "}
                  <span className="font-bold text-green-600 uppercase">
                    {selectedStage}
                  </span>{" "}
                  stage.
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={temperatureGradeData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="grade"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    label={{
                      value: "Avg Temp (°C)",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg text-xs">
                            <p className="font-bold text-gray-900">
                              {payload[0].payload.grade}
                            </p>
                            <p className="text-orange-600">
                              Avg Temp: {payload[0].value}°C
                            </p>
                            <p className="text-gray-500">
                              Samples: {payload[0].payload.count}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgTemp" radius={[4, 4, 0, 0]}>
                    {temperatureGradeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        // Color logic: Higher temperatures often correlate with lower grades
                        fill={entry.avgTemp > 30 ? "#ef4444" : "#f59e0b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" /> Optimal
                  Temp
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> Heat
                  Stress Zone
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: GIS SPATIAL CORRELATION MAP */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-green-600" /> Regional Quality
              Hotspots
            </h3>
            <p className="text-sm text-gray-500">
              Spatial correlation of weather-affected zones and quality test
              failures.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg">
            <div className="flex items-center text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5 shadow-sm" />{" "}
              Optimal Quality
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5 shadow-sm" />{" "}
              Climate Stress Zone
            </div>
          </div>
        </div>

        <div className="h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-inner">
          <ArcGISMap
            webMapId="a24b5bc059d2478e843f4c1968e47860"
            dragable={false}
            height="500px"
            zoom={6}
            heatmap={true}
          />
        </div>

        {/* <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 flex gap-4">
          <div className="bg-white p-2 rounded-full h-fit shadow-sm">
            <Info className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-bold text-purple-900 text-sm">
              Automated Analytics Insight
            </h4>
            <p className="text-sm text-purple-800 mt-1 leading-relaxed">
              Geographic clustering indicates that{" "}
              <strong>82% of moisture-related quality failures</strong> are
              occurring in coastal regions during high-humidity cycles.
              <strong>Recommendation:</strong> Adjust harvesting schedules to
              avoid heavy rain windows and implement humidity-controlled storage
              during the distribution phase.
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default IntelligenceBoard;
