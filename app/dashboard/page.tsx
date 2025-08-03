"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Link from 'next/link';
import {
  FaBars, FaHome, FaGem, FaCogs, FaExchangeAlt, FaSignOutAlt,
  FaArrowLeft, FaUserCircle, FaClock, FaCheckCircle, FaBalanceScale
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PolarAreaController,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarController,
  DoughnutController,
} from "chart.js";


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  DoughnutController,
  PolarAreaController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

import { useRouter } from "next/navigation";

const NAV_TABS = [  
  { id: "dashboard", label: "Dashboard" },
  { id: "inventory", label: "Inventory" },
  { id: "processing-logs", label: "Processing Logs" },
  { id: "transactions", label: "Transactions" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Chart refs
  const weightChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const qualityChartRef = useRef<HTMLCanvasElement>(null);
  const [charts, setCharts] = useState<any[]>([]);

  // Example user role, replace with your auth logic

  const router = useRouter();
  const user = { role: "admin", name: "Admin User" };

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<null | {
    stocks: any[];
    in_progress_count: number;
    completed_count: number;
    final_weight_total: number;
    pending_submissions: any[];
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inventory state
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Computed variables for pagination
  const filteredInventoryData = inventoryData.filter(diamond =>
    searchTerm === "" ||
    (diamond.rough_name && diamond.rough_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (diamond.vepari_name && diamond.vepari_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (diamond.dalal_name && diamond.dalal_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (diamond.quality && diamond.quality.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (diamond.size && diamond.size.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedInventoryData = filteredInventoryData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Processing logs data state
  const [processingLogsData, setProcessingLogsData] = useState<any[]>([]);
  const [processingLogsLoading, setProcessingLogsLoading] = useState(false);
  const [processingLogsError, setProcessingLogsError] = useState<string | null>(null);

  // Pending submissions state
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [pendingSubmissionsLoading, setPendingSubmissionsLoading] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Add at the top with other useState imports
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");

  // Placeholder for transactions data (replace with API fetch if needed)
  const [transactionsData, setTransactionsData] = useState<any[]>([]);

  // Filtered transactions
  const filteredTransactions = transactionsData.filter(tx =>
    (!transactionDate || tx.date === transactionDate) &&
    (!transactionStatus || tx.status === transactionStatus)
  );

  // Add modal state and form state at the top of the component
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockForm, setAddStockForm] = useState({
    rough_name: "",
    purchase_price: "",
    weight_carat: "",
    size: "",
    quality: "",
    color_percent: "",
    whiteness_percent: "",
    vepari_name: "",
    dalal_name: "",
  });
  const [addStockLoading, setAddStockLoading] = useState(false);
  const [addStockError, setAddStockError] = useState("");

  // Add edit modal state and form state at the top of the component
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [editStockForm, setEditStockForm] = useState({
    id: "",
    rough_name: "",
    purchase_price: "",
    weight_carat: "",
    size: "",
    quality: "",
    color_percent: "",
    whiteness_percent: "",
    vepari_name: "",
    dalal_name: "",
  });
  const [editStockLoading, setEditStockLoading] = useState(false);
  const [editStockError, setEditStockError] = useState("");

  // Delete handler
  const handleDeleteStock = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this stock?")) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:4000/api/delete/rough_diamonds/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete stock");
      fetchInventoryData();
    } catch (err) {
      alert((err as any).message || "Error deleting stock");
    }
  };

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:4000/api/dashboard-stats", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        const data = await res.json();
        setDashboardData(data);
      } catch (e: any) {
        setError(e.message || "Error fetching dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  // Fetch inventory data
  const fetchInventoryData = async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:4000/api/rough-diamonds", {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch inventory data");
      const data = await res.json();
      console.log(data);
      setInventoryData(data);
    } catch (e: any) {
      setInventoryError(e.message || "Error fetching inventory data");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Fetch inventory when inventory tab is active
  useEffect(() => {
    if (activeTab === "inventory") {
      fetchInventoryData();
    }
  }, [activeTab]);

  // Fetch processing logs data
  const fetchProcessingLogsData = async () => {
    setProcessingLogsLoading(true);
    setProcessingLogsError(null);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:4000/api/processing-logs", {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You don't have permission to view processing logs");
        }
        throw new Error("Failed to fetch processing logs");
      }
      const data = await res.json();
      setProcessingLogsData(data);
    } catch (e: any) {
      setProcessingLogsError(e.message || "Error fetching processing logs");
    } finally {
      setProcessingLogsLoading(false);
    }
  };

  // Fetch processing logs when processing-logs tab is active
  useEffect(() => {
    if (activeTab === "processing-logs") {
      fetchProcessingLogsData();
    }
  }, [activeTab]);

  // Add fetchTransactionsData function
  const fetchTransactionsData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:4000/api/rough-diamonds", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactionsData(data);
    } catch (e : unknown) {
      if (e instanceof Error) {
        toast.error(e.message);
        setTransactionsData([]);
      } else {
        toast.error("ટેન્સેક્શન્સ લોડ કરવામાં નિષ્ફળ");
      }
    }
  };

  // Fetch transactions when transactions tab is active
  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactionsData();
    }
  }, [activeTab]);

  // Chart data processing functions
  const processWeightDistribution = (stocks: any[]) => {
    const weightRanges = {
      '0-1ct': 0,
      '1-2ct': 0,
      '2-5ct': 0,
      '5-10ct': 0,
      '10ct+': 0
    };

    stocks.forEach(stock => {
      const weight = parseFloat(stock.weight_carat) || 0;
      if (weight <= 1) weightRanges['0-1ct']++;
      else if (weight <= 2) weightRanges['1-2ct']++;
      else if (weight <= 5) weightRanges['2-5ct']++;
      else if (weight <= 10) weightRanges['5-10ct']++;
      else weightRanges['10ct+']++;
    });

    return {
      labels: Object.keys(weightRanges),
      datasets: [{
        label: 'Diamond Count',
        data: Object.values(weightRanges),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 2
      }]
    };
  };

  const processProcessingStatus = (data: any) => {
    const pending = (data.stocks?.length || 0) - (data.in_progress_count || 0) - (data.completed_count || 0);
    
    return {
      labels: ['In Progress', 'Completed', 'Pending'],
      datasets: [{
        data: [data.in_progress_count || 0, data.completed_count || 0, pending],
        backgroundColor: [
          'rgba(255, 159, 64, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 2
      }]
    };
  };

  const processQualityAnalysis = (stocks: any[]) => {
    const qualityCounts: { [key: string]: number } = {};
    
    stocks.forEach(stock => {
      const quality = stock.quality || 'Unknown';
      qualityCounts[quality] = (qualityCounts[quality] || 0) + 1;
    });

    const labels = Object.keys(qualityCounts);
    const data = Object.values(qualityCounts);
    
    return {
      labels: labels,
      datasets: [{
        label: 'Diamond Count',
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 2
      }]
    };
  };

  // Example logout handler
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    // Redirect or update auth state as needed
    router.push("/");
  };

  // Chart initialization and cleanup - reinitialize when dashboard tab becomes active
  useEffect(() => {
    if (!dashboardData || !dashboardData.stocks || activeTab !== 'dashboard') return;

    // Destroy existing charts
    charts.forEach(chart => chart.destroy());
    setCharts([]);

    // Small delay to ensure canvas elements are properly rendered
    const timeoutId = setTimeout(() => {
      const newCharts: any[] = [];

      // Weight Distribution Chart
      if (weightChartRef.current) {
        const weightCtx = weightChartRef.current.getContext('2d');
        if (weightCtx) {
          const weightChart = new ChartJS(weightCtx, {
            type: 'bar',
            data: processWeightDistribution(dashboardData.stocks),
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Weight Distribution',
                  font: { size: 16, weight: 'bold' }
                },
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Count'
                  }
                }
              }
            }
          });
          newCharts.push(weightChart);
        }
      }

      // Processing Status Chart
      if (statusChartRef.current) {
        const statusCtx = statusChartRef.current.getContext('2d');
        if (statusCtx) {
          const statusChart = new ChartJS(statusCtx, {
            type: 'doughnut',
            data: processProcessingStatus(dashboardData),
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Processing Status',
                  font: { size: 16, weight: 'bold' }
                },
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
          newCharts.push(statusChart);
        }
      }

      // Quality Analysis Chart
      if (qualityChartRef.current) {
        const qualityCtx = qualityChartRef.current.getContext('2d');
        if (qualityCtx) {
          const qualityChart = new ChartJS(qualityCtx, {
            type: 'polarArea',
            data: processQualityAnalysis(dashboardData.stocks),
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Quality Analysis',
                  font: { size: 16, weight: 'bold' }
                },
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
          newCharts.push(qualityChart);
        }
      }

      setCharts(newCharts);
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      charts.forEach(chart => chart.destroy());
    };
  }, [dashboardData, activeTab, charts]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`fixed z-30 inset-y-0 left-0 w-56 bg-primary text-white transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0`}>
        <div className="text-center py-6 border-b border-primary-700">
          <h4 className="text-xl font-bold">Diamond Management</h4>
        </div>
        <ul className="mt-6 space-y-2">
          <li>
            <button className={`flex items-center w-full px-6 py-3 text-left hover:bg-primary-700 rounded ${activeTab === "dashboard" ? "bg-accent" : ""}`} onClick={() => setActiveTab("dashboard")}> 
              <FaHome className="mr-3" /> Dashboard
            </button>
          </li>
          <li>
            <button className={`flex items-center w-full px-6 py-3 text-left hover:bg-primary-700 rounded ${activeTab === "inventory" ? "bg-accent" : ""}`} onClick={() => setActiveTab("inventory")}> 
              <FaGem className="mr-3" /> Inventory
            </button>
          </li>
          {(user.role === "office_user" || user.role === "admin") && (
            <li>
              <button className={`flex items-center w-full px-6 py-3 text-left hover:bg-primary-700 rounded ${activeTab === "processing-logs" ? "bg-accent" : ""}`} onClick={() => setActiveTab("processing-logs")}> 
                <FaCogs className="mr-3" /> Processing
              </button>
            </li>
          )}
          <li>
            <button className={`flex items-center w-full px-6 py-3 text-left hover:bg-primary-700 rounded ${activeTab === "transactions" ? "bg-accent" : ""}`} onClick={() => setActiveTab("transactions")}> 
              <FaExchangeAlt className="mr-3" /> Transactions
            </button>
          </li>
          <li>
            <button className="flex items-center w-full px-6 py-3 text-left hover:bg-primary-700 rounded" onClick={handleLogout}> 
              <FaSignOutAlt className="mr-3" /> Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Mobile Toggle Button */}
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-primary text-white p-2 rounded shadow"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FaBars />
      </button>

      {/* Main Content */}
      <div className="flex-1 p-6 transition-all duration-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-3">
          <Link href="/" className="btn btn-outline-primary flex items-center gap-2 text-primary">
  <FaArrowLeft /> Back
</Link>
            <h4 className="mb-0 text-lg font-semibold" id="pageTitle">Dashboard Overview</h4>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <FaUserCircle className="text-2xl" />
            <span>{user.name}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                className={
                  `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600" // Active: strong blue border and text
                      : "border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300" // Inactive: gray, blue on hover
                  }`
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "dashboard" && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-start">
                  <h6 className="text-gray-500 mb-2">Total Stock Weight</h6>
                  <h3 className="text-2xl font-bold mb-1">
                    {loading ? "Loading..." : dashboardData?.stocks?.reduce((sum, s) => sum + (s.remaining_weight || 0), 0) || 0}
                  </h3>
                  <div className="flex items-center gap-1 text-blue-500">
                    <FaGem /> <span>{dashboardData?.stocks?.length || 0}</span> items
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-start">
                  <h6 className="text-gray-500 mb-2">In Progress</h6>
                  <h3 className="text-2xl font-bold mb-1">
                    {loading ? "Loading..." : dashboardData?.in_progress_count ?? 0}
                  </h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <FaClock /> Active Orders
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-start">
                  <h6 className="text-gray-500 mb-2">Completed Orders</h6>
                  <h3 className="text-2xl font-bold mb-1">
                    {loading ? "Loading..." : dashboardData?.completed_count ?? 0}
                  </h3>
                  <div className="flex items-center gap-1 text-green-500">
                    <FaCheckCircle /> Finished
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-start">
                  <h6 className="text-gray-500 mb-2">Total Final Weight</h6>
                  <h3 className="text-2xl font-bold mb-1">
                    {loading ? "Loading..." : dashboardData?.final_weight_total ?? 0}
                  </h3>
                  <div className="flex items-center gap-1 text-blue-700">
                    <FaBalanceScale /> Carats
                  </div>
                </div>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h5 className="font-semibold mb-4 text-center">Weight Distribution</h5>
                  <div className="h-64">
                    <canvas ref={weightChartRef} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h5 className="font-semibold mb-4 text-center">Processing Status</h5>
                  <div className="h-64">
                    <canvas ref={statusChartRef} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h5 className="font-semibold mb-4 text-center">Quality Analysis</h5>
                  <div className="h-64">
                    <canvas ref={qualityChartRef} />
                  </div>
                </div>
              </div>
              
              {/* Pending Submissions Section */}
              <div className="mt-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h5 className="text-lg font-semibold mb-4">Pending Submissions</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rough Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Given Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Pending</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingSubmissionsLoading ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-2">Loading pending submissions...</span>
                              </div>
                            </td>
                          </tr>
                        ) : pendingSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              No pending submissions found
                            </td>
                          </tr>
                        ) : (
                          pendingSubmissions.map((submission, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {submission.office_name || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {submission.rough_name || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {submission.weight || '0'} ct
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {submission.given_date ? new Date(submission.given_date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  submission.days_pending > 7 ? 'bg-red-100 text-red-800' : 
                                  submission.days_pending > 3 ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {submission.days_pending || 0} days
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "inventory" && (
            <div>
              <div className="flex justify-end mb-3">
                <button
                  className="btn btn-primary flex items-center gap-2"
                  onClick={() => setShowAddStockModal(true)}
                >
                  <FaGem /> Add New Stock
                </button>
              </div>
              
              {/* Inventory Error Message */}
              {inventoryError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {inventoryError}
                </div>
              )}
              
              <div className="bg-white rounded-lg shadow p-6">
                {/* Search and Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search diamonds..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {Math.ceil(filteredInventoryData.length / itemsPerPage)}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredInventoryData.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(filteredInventoryData.length / itemsPerPage)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Rough Name</th>
                        <th className="px-4 py-2">Purchase Price</th>
                        <th className="px-4 py-2">Weight (ct)</th>
                        <th className="px-4 py-2">Size</th>
                        <th className="px-4 py-2">Quality</th>
                        <th className="px-4 py-2">Color %</th>
                        <th className="px-4 py-2">Whiteness %</th>
                        <th className="px-4 py-2">Vepari</th>
                        <th className="px-4 py-2">Dalal</th>
                        <th className="px-4 py-2">Remaining Weight</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLoading ? (
                        <tr>
                          <td colSpan={11} className="text-center py-4">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <span className="ml-2">Loading inventory...</span>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedInventoryData.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-4">
                            {searchTerm ? 'No diamonds match your search' : 'No inventory data found'}
                          </td>
                        </tr>
                      ) : (
                        paginatedInventoryData.map((diamond, index) => (
                          <tr key={diamond.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{diamond.rough_name || 'N/A'}</td>
                            <td className="px-4 py-2">₹{diamond.purchase_price || '0'}</td>
                            <td className="px-4 py-2">{diamond.weight_carat || '0'} ct</td>
                            <td className="px-4 py-2">{diamond.size || 'N/A'}</td>
                            <td className="px-4 py-2">{diamond.quality || 'N/A'}</td>
                            <td className="px-4 py-2">{diamond.color_percent || '0'}%</td>
                            <td className="px-4 py-2">{diamond.whiteness_percent || '0'}%</td>
                            <td className="px-4 py-2">{diamond.vepari_name || 'N/A'}</td>
                            <td className="px-4 py-2">{diamond.dalal_name || 'N/A'}</td>
                            <td className="px-4 py-2">{diamond.remaining_weight || '0'} ct</td>
                            <td className="px-4 py-2">
                              <div className="flex space-x-2">
                                <button
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                  onClick={() => {
                                    setEditStockForm({
                                      id: diamond.id,
                                      rough_name: diamond.rough_name || "",
                                      purchase_price: diamond.purchase_price || "",
                                      weight_carat: diamond.weight_carat || "",
                                      size: diamond.size || "",
                                      quality: diamond.quality || "",
                                      color_percent: diamond.color_percent || "",
                                      whiteness_percent: diamond.whiteness_percent || "",
                                      vepari_name: diamond.vepari_name || "",
                                      dalal_name: diamond.dalal_name || "",
                                    });
                                    setShowEditStockModal(true);
                                    setEditStockError("");
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  onClick={() => handleDeleteStock(diamond.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                      </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === "processing-logs" && (
            <div>
              {/* Processing Logs Error Message */}
              {processingLogsError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {processingLogsError}
                </div>
              )}
              
              <div className="bg-white rounded-lg shadow p-6">
                <h5 className="font-semibold mb-4">Processing Logs</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">User</th>
                        <th className="px-4 py-2">Process</th>
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2">Packet Number</th>
                        <th className="px-4 py-2">Details</th>
                        <th className="px-4 py-2">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processingLogsLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <span className="ml-2">Loading processing logs...</span>
                            </div>
                          </td>
                        </tr>
                      ) : processingLogsData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">No processing logs found</td>
                        </tr>
                      ) : (
                        processingLogsData.map((log, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <span className="font-medium text-gray-900">{log.user || 'System'}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {log.process_type || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-2">{log.action || 'N/A'}</td>
                            <td className="px-4 py-2">
                              <span className="font-mono text-sm">{log.packet_no || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="max-w-xs">
                                {log.details && typeof log.details === 'object' ? (
                                  <div className="text-sm text-gray-600">
                                    {Object.entries(log.details).map(([key, value], i) => (
                                      <div key={i} className="mb-1">
                                        <span className="font-medium">{key}:</span> {String(value)}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">{log.details || 'No details'}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-gray-500">
                                {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                              </span>
                            </td>
                      </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === "transactions" && (
            <div>
              <div className="flex flex-wrap gap-4 mb-4">
                <input
                  type="date"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  className="border rounded px-2 py-1"
                  placeholder="Filter by date"
                />
                <select
                  value={transactionStatus}
                  onChange={e => setTransactionStatus(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  {/* Add more statuses as needed */}
                </select>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h5 className="font-semibold mb-4">Transactions</h5>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-4">No transactions found</div>
                ) : (
                  <div className="grid gap-4">
                    {filteredTransactions.map((tx, idx) => (
                      <div key={tx.id || idx} className="bg-gray-50 rounded-lg shadow p-4">
                        <div className="font-semibold text-green-700 mb-1">
                          rough diamond: {tx.rough_name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {tx.created_date
                            ? new Date(tx.created_date).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              })
                            : "N/A"}
                        </div>
                        <div className="mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            tx.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            tx.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tx.status ? tx.status.toUpperCase().replace('_', ' ') : 'Pending'}
                          </span>
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Weight:</span> {tx.weight_carat || "N/A"} ct
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Purchase Price:</span> {tx.purchase_price || "N/A"}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Size:</span> {tx.size || "N/A"}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Quality:</span> {tx.quality || "N/A"}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Vepari:</span> {tx.vepari_name || "N/A"}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Dalal:</span> {tx.dalal_name || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h5 className="text-lg font-semibold">Add New Stock</h5>
              <button onClick={() => setShowAddStockModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <form
              className="p-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setAddStockLoading(true);
                setAddStockError("");
                try {
                  const token = localStorage.getItem("authToken");
                  const res = await fetch("http://localhost:4000/api/rough-diamonds", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(addStockForm),
                  });
                  if (!res.ok) throw new Error("Failed to add stock");
                  setShowAddStockModal(false);
                  setAddStockForm({
                    rough_name: "",
                    purchase_price: "",
                    weight_carat: "",
                    size: "",
                    quality: "",
                    color_percent: "",
                    whiteness_percent: "",
                    vepari_name: "",
                    dalal_name: "",
                  });
                  fetchInventoryData();
                } catch (err) {
                  setAddStockError((err as any).message || "Error adding stock");
                } finally {
                  setAddStockLoading(false);
                }
              }}
            >
              <div className="mb-2">
                <label className="block text-sm font-medium">Rough Name</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.rough_name}
                  onChange={e => setAddStockForm(f => ({ ...f, rough_name: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Purchase Price</label>
                <input
                  type="number"
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.purchase_price}
                  onChange={e => setAddStockForm(f => ({ ...f, purchase_price: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Weight (ct)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.weight_carat}
                  onChange={e => setAddStockForm(f => ({ ...f, weight_carat: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Size</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.size}
                  onChange={e => setAddStockForm(f => ({ ...f, size: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Quality</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.quality}
                  onChange={e => setAddStockForm(f => ({ ...f, quality: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Color %</label>
                <input
                  type="number"
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.color_percent}
                  onChange={e => setAddStockForm(f => ({ ...f, color_percent: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Whiteness %</label>
                <input
                  type="number"
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.whiteness_percent}
                  onChange={e => setAddStockForm(f => ({ ...f, whiteness_percent: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Vepari</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.vepari_name}
                  onChange={e => setAddStockForm(f => ({ ...f, vepari_name: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Dalal</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={addStockForm.dalal_name}
                  onChange={e => setAddStockForm(f => ({ ...f, dalal_name: e.target.value }))}
                />
              </div>
              {addStockError && <div className="text-red-500 text-sm">{addStockError}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddStockModal(false)}
                  disabled={addStockLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addStockLoading}
                >
                  {addStockLoading ? "Adding..." : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h5 className="text-lg font-semibold">Edit Stock</h5>
              <button onClick={() => setShowEditStockModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <form
              className="p-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setEditStockLoading(true);
                setEditStockError("");
                try {
                  const token = localStorage.getItem("authToken");
                  const res = await fetch(`http://localhost:4000/api/update/rough_diamonds/${editStockForm.id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(editStockForm),
                  });
                  if (!res.ok) throw new Error("Failed to update stock");
                  setShowEditStockModal(false);
                  fetchInventoryData();
                } catch (err) {
                  setEditStockError((err as any).message || "Error updating stock");
                } finally {
                  setEditStockLoading(false);
                }
              }}
            >
              <div className="mb-2">
                <label className="block text-sm font-medium">Rough Name</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.rough_name}
                  onChange={e => setEditStockForm(f => ({ ...f, rough_name: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Purchase Price</label>
                <input
                  type="number"
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.purchase_price}
                  onChange={e => setEditStockForm(f => ({ ...f, purchase_price: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Weight (ct)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.weight_carat}
                  onChange={e => setEditStockForm(f => ({ ...f, weight_carat: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Size</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.size}
                  onChange={e => setEditStockForm(f => ({ ...f, size: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Quality</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.quality}
                  onChange={e => setEditStockForm(f => ({ ...f, quality: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Color %</label>
                <input
                  type="number"
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.color_percent}
                  onChange={e => setEditStockForm(f => ({ ...f, color_percent: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Whiteness %</label>
                <input
                  type="number"
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.whiteness_percent}
                  onChange={e => setEditStockForm(f => ({ ...f, whiteness_percent: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Vepari</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.vepari_name}
                  onChange={e => setEditStockForm(f => ({ ...f, vepari_name: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium">Dalal</label>
                <input
                  className="form-input w-full border border-gray-300 h-8"
                  value={editStockForm.dalal_name}
                  onChange={e => setEditStockForm(f => ({ ...f, dalal_name: e.target.value }))}
                />
              </div>
              {editStockError && <div className="text-red-500 text-sm">{editStockError}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditStockModal(false)}
                  disabled={editStockLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editStockLoading}
                >
                  {editStockLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}