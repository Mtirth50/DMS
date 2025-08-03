"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Label } from "@radix-ui/react-label";

interface PlanningEntry {
  id: number;
  packet_no: string;
  planner_name: string;
  assign_date: string;
  submit_date: string | null;
  status: string;
  has_csv: boolean;
  created_at: string;
  updated_at: string;
  galaxy_scanning_id: number;
  csv_file_path: string;
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
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<PlanningEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = "http://localhost:4000";

  useEffect(() => {
    const fetchPlanningDetails = async () => {
      const id = params.id;
      if (!id) {
        setError("No planning ID provided");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/planning/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch planning details');
        }

        const data = await response.json();
        console.log('Planning details response:', data);
        
        // Handle both direct data and wrapped response formats
        if (data.data) {
          setEntry(data.data);
        } else if (data.planning) {
          setEntry(data.planning);
        } else {
          setEntry(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load planning details');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanningDetails();
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "પેન્ડિંગ", color: "bg-yellow-100 text-yellow-800" },
      assigned: { label: "અસાઇન કરેલ", color: "bg-blue-100 text-blue-800" },
      submitted: { label: "સબમિટ કરેલ", color: "bg-green-100 text-green-800" },
      completed: { label: "પૂર્ણ", color: "bg-purple-100 text-purple-800" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "bg-gray-100 text-gray-800" };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'dd/MM/yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  const handleDownloadPDF = () => {
    if (!entry) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError("Authentication required");
      return;
    }

    fetch(`${API_BASE_URL}/planning/${entry.id}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planning_${entry.packet_no || entry.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      setError("Failed to download PDF: " + error.message);
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600 text-center">
              <div>{error}</div>
              <div className="text-sm text-gray-500 mt-2">
                ID: {params.id}
              </div>
            </div>
            <div className="text-center mt-4">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                પાછા જાઓ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div>પ્લાનિંગ એન્ટ્રી મળી નથી</div>
              <div className="text-sm text-gray-500 mt-2">
                ID: {params.id} | API: {API_BASE_URL}/planning/{params.id}
              </div>
            </div>
            <div className="text-center mt-4">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                પાછા જાઓ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>પ્લાનિંગ વિગતો - {entry.packet_no}</CardTitle>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              પાછા જાઓ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">મૂળ માહિતી</h3>
              <div className="space-y-3">
                <div>
                  <Label>પેકેટ નંબર</Label>
                  <div className="text-lg font-medium">{entry.packet_no}</div>
                </div>
                <div>
                  <Label>પ્લાનર નામ</Label>
                  <div className="text-lg font-medium">{entry.planner_name}</div>
                </div>
                <div>
                  <Label>સ્ટેટસ</Label>
                  <div>{getStatusBadge(entry.status)}</div>
                </div>
                <div>
                  <Label>કાપન નંબર</Label>
                  <div>{entry.kapan_no}</div>
                </div>
                <div>
                  <Label>નંગ નંબર</Label>
                  <div>{entry.nang_no}</div>
                </div>
              </div>
            </div>
            
            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold mb-4">તારીખો</h3>
              <div className="space-y-3">
                <div>
                  <Label>અસાઇન તારીખ</Label>
                  <div>{formatDate(entry.assign_date)}</div>
                </div>
                {entry.submit_date && (
                  <div>
                    <Label>સબમિટ તારીખ</Label>
                    <div>{formatDate(entry.submit_date)}</div>
                  </div>
                )}
                <div>
                  <Label>ક્રિએટેડ</Label>
                  <div>{formatDateTime(entry.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Diamond Processing Data */}
            <div>
              <h3 className="text-lg font-semibold mb-4">ડાયમંડ પ્રોસેસિંગ</h3>
              <div className="space-y-3">
                <div>
                  <Label>કાપન પીસ</Label>
                  <div>{entry.kapan_pcs}</div>
                </div>
                <div>
                  <Label>કાપન વજન</Label>
                  <div>{entry.kapan_wt.toFixed(3)} કેરેટ</div>
                </div>
                <div>
                  <Label>ચાદ વજન</Label>
                  <div>{entry.chad_wt.toFixed(3)} કેરેટ</div>
                </div>
                <div>
                  <Label>ચાદ ટકાવારી</Label>
                  <div>{entry.chad_percent.toFixed(2)}%</div>
                </div>
                <div>
                  <Label>રફ સાઇઝ</Label>
                  <div>{entry.rough_size}</div>
                </div>
                <div>
                  <Label>પોલિશ સાઇઝ</Label>
                  <div>{entry.polish_size}</div>
                </div>
              </div>
            </div>

            {/* Additional Processing Data */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold mb-4">વધુ વિગતો</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>LS પાઈ વજન</Label>
                  <div>{entry.ls_pie.toFixed(3)} કેરેટ</div>
                </div>
                <div>
                  <Label>પોલિશ ડોલર</Label>
                  <div>${entry.pol_dollar.toFixed(2)}</div>
                </div>
                <div>
                  <Label>એક્સપેક્ટેડ વજન</Label>
                  <div>{entry.exp_wt.toFixed(3)} કેરેટ</div>
                </div>
                <div>
                  <Label>એક્સપેક્ટેડ ટકાવારી</Label>
                  <div>{entry.exp_percent.toFixed(2)}%</div>
                </div>
                <div>
                  <Label>રફ ટુ પોલિશ ટકાવારી</Label>
                  <div>{entry.r_to_pol_percent.toFixed(2)}%</div>
                </div>
                <div>
                  <Label>પોલિશ ડોલર પર કેરેટ</Label>
                  <div>${entry.pol_dollar_per_cts.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF ડાઉનલોડ કરો
            </Button>
            {entry.has_csv && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                CSV ડાઉનલોડ કરો
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
