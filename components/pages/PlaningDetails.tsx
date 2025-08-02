import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface PlanningData {
  id: string;
  packet_no: string;
  status: 'completed' | 'in_progress' | 'on_hold';
  csv_file_path?: string;
  planner_name: string;
  assign_date: string;
  submit_date: string;
  kapan_no: string;
  nang_no: string;
  kapan_pcs: number;
  kapan_wt: number;
  chad_pcs: number;
  chad_wt: number;
  chad_percent: number;
  ls_total_plate_wt: number;
  ls_total_plate_pcs: number;
  ls_pie: number;
  ls_pie_without_wt: number;
  ls_pie_without_pcs: number;
  reject_wt: number;
  reject_pcs: number;
  diff_wt: number;
  raw_size: number;
  rough_size: number;
  craft_size: number;
  polish_size: number;
  exp_wt: number;
  exp_percent: number;
  r_to_pol_percent: number;
  pol_dollar: number;
  ro_dollar_per_cts: number;
  pol_dollar_per_cts: number;
}

export default function PlanningDetails() {
  const { planning_id } = useParams();
  const [planning, setPlanning] = useState<PlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planning_id) return;

    fetch(`http://localhost:4000/planning/${planning_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load planning data");
        }
        setPlanning(data.data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [planning_id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!planning) return <div>No planning data available.</div>;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? "-"
      : date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const statusColor = {
    completed: "bg-green-500",
    in_progress: "bg-blue-500",
    on_hold: "bg-yellow-500",
  }[planning?.status || ''] || "bg-gray-500";

  return (
    <div className="container mx-auto px-2 py-4">
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold">પ્લાનિંગ વિગતો - {planning.packet_no}</h2>
          <div className="flex gap-2 mt-2 md:mt-0">
            <a href="/processing#planning" className="border px-3 py-1 rounded text-gray-700 hover:bg-gray-100">
              <i className="fas fa-arrow-left mr-1"></i> પાછા જાઓ
            </a>
            <a href={`/download/planning/pdf/${planning.id}`} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
              <i className="fas fa-file-pdf mr-1"></i> PDF ડાઉનલોડ કરો
            </a>
            {planning.csv_file_path && (
              <a href={`/download/planning/csv/${planning.id}`} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                <i className="fas fa-file-csv mr-1"></i> CSV ડાઉનલોડ કરો
              </a>
            )}
          </div>
        </div>

        {/* Planning Details */}
        <div className="p-6">
          {/* Info Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <table className="w-full text-sm border rounded">
              <tbody>
                <tr><th className="w-2/5 bg-gray-100 p-2">પેકેટ નંબર</th><td className="p-2">{planning.packet_no}</td></tr>
                <tr><th className="bg-gray-100 p-2">પ્લાનર</th><td className="p-2">{planning.planner_name}</td></tr>
                <tr>
                  <th className="bg-gray-100 p-2">સ્ટેટસ</th>
                  <td className="p-2">
                    <span className={`inline-block px-2 py-1 text-xs text-white rounded ${statusColor}`}>
                      {planning.status?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                </tr>
                <tr><th className="bg-gray-100 p-2">અસાઇન તારીખ</th><td className="p-2">{formatDate(planning.assign_date)}</td></tr>
                <tr><th className="bg-gray-100 p-2">સબમિટ તારીખ</th><td className="p-2">{formatDate(planning.submit_date)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Metrics */}
          <h3 className="text-lg font-semibold mb-2">પ્લાનિંગ મેટ્રિક્સ</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">વિગત</th>
                  <th className="p-2">મૂલ્ય</th>
                  <th className="p-2">વિગત</th>
                  <th className="p-2">મૂલ્ય</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["કાપણ નંબર", planning.kapan_no, "નંગ નંબર", planning.nang_no],
                  ["કાપણ પીસી", planning.kapan_pcs, "કાપણ વજન (ct)", planning.kapan_wt?.toFixed(2)],
                  ["ચાડ પીસી", planning.chad_pcs, "ચાડ વજન (ct)", planning.chad_wt?.toFixed(2)],
                  ["ચાડ ટકાવારી", planning.chad_percent != null ? `${planning.chad_percent.toFixed(2)}%` : "-", "LS પ્લેટ વજન", planning.ls_total_plate_wt?.toFixed(2)],
                  ["LS પ્લેટ પીસી", planning.ls_total_plate_pcs, "LS પાઇ", planning.ls_pie?.toFixed(2)],
                  ["LS પાઇ વગર વજન", planning.ls_pie_without_wt?.toFixed(2), "LS પાઇ વગર પીસી", planning.ls_pie_without_pcs],
                  ["રિજેક્ટ વજન", planning.reject_wt?.toFixed(2), "રિજેક્ટ પીસી", planning.reject_pcs],
                  ["ફરક વજન", planning.diff_wt?.toFixed(2), "રો સાઇઝ", planning.raw_size?.toFixed(2)],
                  ["રફ સાઇઝ", planning.rough_size?.toFixed(2), "ક્રાફ્ટ સાઇઝ", planning.craft_size?.toFixed(2)],
                  ["પોલિશ સાઇઝ", planning.polish_size?.toFixed(2), "અપેક્ષિત વજન (ct)", planning.exp_wt?.toFixed(2)],
                  ["અપેક્ષિત ટકાવારી", planning.exp_percent != null ? `${planning.exp_percent.toFixed(2)}%` : "-", "R to પોલિશ %", planning.r_to_pol_percent != null ? `${planning.r_to_pol_percent.toFixed(2)}%` : "-"],
                  ["પોલિશ ડોલર", planning.pol_dollar != null ? `₹${planning.pol_dollar.toFixed(2)}` : "-", "RO ₹/cts", planning.ro_dollar_per_cts != null ? `₹${planning.ro_dollar_per_cts.toFixed(2)}` : "-"],
                  ["પોલિશ ડોલર/cts", planning.pol_dollar_per_cts != null ? `₹${planning.pol_dollar_per_cts.toFixed(2)}` : "-", "", ""],
                ].map(([label1, val1, label2, val2], idx) => (
                  <tr key={idx}>
                    <th className="bg-gray-50 p-2">{label1}</th>
                    <td className="p-2">{val1 ?? "-"}</td>
                    <th className="bg-gray-50 p-2">{label2}</th>
                    <td className="p-2">{val2 ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
