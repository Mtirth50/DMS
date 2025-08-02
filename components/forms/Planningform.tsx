import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw, Download, FileText, Eye } from "lucide-react"

const API_BASE_URL = "http://localhost:4000/api" // Adjust to your backend URL

interface PlanningEntry {
  id: number
  packet_no: string
  planner_name: string
  kapan_wt: number
  exp_wt: number
  exp_percent: number
  pol_dollar: number
  status: string
  has_csv: boolean
  created_at: string
}

const Planningform = () => {
  const [assignData, setAssignData] = useState({
    packetNo: "",
    plannername: "",
    assignDate: "",
  });
  
  const [submitData, setSubmitData] = useState({
    packetNo: "",
    plannername: "",
    csvFile: null as File | null,
  });

  const [planningEntries, setPlanningEntries] = useState<PlanningEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [availablePackets, setAvailablePackets] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchAvailablePackets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/galaxy-scanning/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch packets');
      const submittedPackets = Array.isArray(data.data)
        ? data.data.filter((pkt: { status: string }) => pkt.status === 'submitted').map((pkt: { packet_no: string }) => pkt.packet_no)
        : [];
      setAvailablePackets(submittedPackets);
    } catch (err) {
      showNotification("Failed to fetch available packets", "error");
      console.error(err);
    }
  }

  const fetchPlanningData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/planning/entries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load planning data");
      setPlanningEntries(data.data || data);
    } catch (err) {
      console.error("Error fetching planning data:", err);
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAvailablePackets();
    fetchPlanningData();
  }, [])

  useEffect(() => {
    if (submitData.packetNo) {
      fetch(`http://localhost:4000/planning/assigned-planner/${submitData.packetNo}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.planner_name) {
            setSubmitData(prev => ({ ...prev, plannername: data.planner_name }));
          }
        });
    }
  }, [submitData.packetNo]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { packetNo, plannername, assignDate } = assignData;
    
    if (!packetNo || !plannername || !assignDate) {
      showNotification("Please fill all fields", "error");
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/planning/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          packet_no: packetNo,
          planner_name: plannername,
          assign_date: assignDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Assignment failed');
      
      showNotification("Planning assigned successfully!");
      
      // Pre-fill the submit form
      setSubmitData(prev => ({
        ...prev,
        packetNo: packetNo,
        plannername: plannername,
      }));
      
      // Reset form and refresh data
      setAssignData({ packetNo: "", plannername: "", assignDate: "" });
      fetchAvailablePackets();
      fetchPlanningData();
      
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Assignment failed", "error");
    }
  }

  const handleSubmitFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { packetNo, plannername, csvFile } = submitData;
    
    if (!packetNo || !plannername || !csvFile) {
      showNotification("Please fill all fields", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('packet_no', packetNo);
      formData.append('planner_name', plannername);
      formData.append('csv_file', csvFile);
      
      const response = await fetch(`http://localhost:4000/planning/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Submission failed');
      
      showNotification("Planning submitted successfully!");
      
      // Reset form and refresh data
      setSubmitData({ packetNo: "", plannername: "", csvFile: null });
      const fileInput = document.getElementById('csv_file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchPlanningData();
      
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Submission failed", "error");
    }
  }

  const formatNumber = (num: number | string | null | undefined) => (num ? parseFloat(num as string).toFixed(2) : "-")

  type StatusKey = "completed" | "in_progress" | "on_hold" | "pending";
  const getStatusBadge = (status: string) => {
    const statusMap: Record<StatusKey, { label: string; color: string }> = {
      completed: { label: "Completed", color: "bg-green-500" },
      in_progress: { label: "In Progress", color: "bg-blue-500" },
      on_hold: { label: "On Hold", color: "bg-yellow-500" },
      pending: { label: "Pending", color: "bg-gray-500" },
    }
    const key = (status in statusMap ? status : "pending") as StatusKey;
    const { label, color } = statusMap[key];
    return <span className={`text-white text-xs px-2 py-1 rounded ${color}`}>{label}</span>
  }

  const handleDownloadPDF = (entryId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification("Authentication required", "error");
      return;
    }
    
    const url = `http://localhost:4000/planning/${entryId}/pdf`;
    
    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/pdf'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      return response.blob();
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `planning_${entryId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    })
    .catch(error => {
      showNotification("Failed to download PDF: " + error.message, "error");
    });
  }

  const handleDownloadCSV = async (planningId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        showNotification("Authentication required", "error");
        return;
      }

      const response = await fetch(`http://localhost:4000/planning/${planningId}/csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planning_${planningId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification("CSV downloaded successfully");
    } catch (error) {
      console.error('CSV download error:', error);
      showNotification("Failed to download CSV", "error");
    }
  };

  const handleViewDetails = (entryId: number) => {
    window.location.href = `/planning-details/${entryId}`
  }

  return (
    <div>
      {/* Notification */}
      {notification && (
        <Alert className={`mb-4 ${notification.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign Form */}
        <Card>
          <CardHeader>
            <CardTitle>પ્લાનિંગ એસાઇન</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="assign_packet_no">પેકેટ નંબર</Label>
                <Select
                  value={assignData.packetNo}
                  onValueChange={(value) => setAssignData({ ...assignData, packetNo: value })}
                >
                  <SelectTrigger id="assign_packet_no">
                    <SelectValue placeholder="પેકેટ પસંદ કરો" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePackets.map((pkt) => (
                      <SelectItem key={pkt} value={pkt}>
                        {pkt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assign_planner_name">પ્લાનર નામ</Label>
                <Input
                  id="assign_planner_name"
                  type="text"
                  value={assignData.plannername}
                  onChange={(e) => setAssignData({ ...assignData, plannername: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="assign_date">તારીખ</Label>
                <Input
                  id="assign_date"
                  type="date"
                  value={assignData.assignDate}
                  onChange={(e) => setAssignData({ ...assignData, assignDate: e.target.value })}
                  required
                />
              </div>
              <Button onClick={handleAssignSubmit} className="w-full">એસાઇન કરો</Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit Form */}
        <Card>
          <CardHeader>
            <CardTitle>પ્લાનિંગ સબમિટ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="submit_packet_no">પેકેટ નંબર</Label>
                <Select
                  value={submitData.packetNo}
                  onValueChange={(value) => setSubmitData({ ...submitData, packetNo: value })}
                >
                  <SelectTrigger id="submit_packet_no">
                    <SelectValue placeholder="પેકેટ પસંદ કરો" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePackets.map((pkt) => (
                      <SelectItem key={pkt} value={pkt}>
                        {pkt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="submit_planner_name">પ્લાનર નામ</Label>
                <Input
                  id="submit_planner_name"
                  type="text"
                  value={submitData.plannername}
                  onChange={(e) => setSubmitData({ ...submitData, plannername: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="csv_file">CSV ફાઈલ</Label>
                <Input
                  id="csv_file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSubmitData({ ...submitData, csvFile: e.target.files ? e.target.files[0] : null })}
                  required
                />
                <small className="text-muted-foreground text-xs">Upload the planning data CSV file</small>
              </div>
              <Button onClick={handleSubmitFormSubmit} className="w-full">
                સબમિટ કરો
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Planning Table */}
        <div className="md:col-span-2 mt-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>પ્લાનિંગ એન્ટ્રીઝ</CardTitle>
              <Button variant="outline" size="sm" onClick={fetchPlanningData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <div className="text-center text-sm text-muted-foreground py-6">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                  <div>લોડ કરી રહ્યું છે...</div>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-6">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  {error}
                </div>
              ) : planningEntries.length === 0 ? (
                <div className="text-center text-muted-foreground py-6">કોઈ પ્લાનિંગ એન્ટ્રીઝ મળી નથી</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        પેકેટ નંબર
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        પ્લાનર
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        કપન વજન (ct)
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        અપેક્ષિત વજન (ct)
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ટકાવારી (%)
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        મૂલ્ય ($)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        સ્ટેટસ
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        કાર્યવાહી
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {planningEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.packet_no}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {entry.planner_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumber(entry.kapan_wt)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumber(entry.exp_wt)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumber(entry.exp_percent)}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${formatNumber(entry.pol_dollar)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {getStatusBadge(entry.status)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(entry.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {entry.has_csv && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadCSV(entry.id)}
                                title="Download CSV"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(entry.id)}
                              title="Download PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Planningform