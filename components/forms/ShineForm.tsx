import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ShineEntry {
  id: number
  packetNo: string
  kapanNo: string
  partyName: string
  weight: number
  status: string
}

interface PlanningEntry {
  packet_no: string;
  kapan_no: string;
  planner_name: string;
  kapan_wt: number;
  status: string;
}

interface ApiShineEntry {
  id: number
  packet_no: string
  kapan_no: string
  party_name: string
  weight: number
  status: string
}

const API_BASE_URL = "http://localhost:4000/api";

// Simple notification function
const getToken = () => localStorage.getItem('authToken');

export const ShineForm = () => {
  const [assignForm, setAssignForm] = useState({
    packetNo: "",
    kapanNo: "",
    partyName: "",
    weight: "",
    assignDate: "",
  })

  const [submitForm, setSubmitForm] = useState({
    packetNo: "",
    kapanNo: "",
    partyName: "",
    weight: "",
    submissionDate: "",
  })

  const [shineEntries, setShineEntries] = useState<ShineEntry[]>([])
  const [availablePackets, setAvailablePackets] = useState<string[]>([]);

  // Fetch available packets for assignment from planning entries
  const fetchAvailablePackets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/planning/entries`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      const data = await res.json();
      // Only show packets not yet submitted
      const packets = Array.isArray(data.data)
        ? data.data.filter((entry: PlanningEntry) => entry.status !== 'submitted').map((entry: PlanningEntry) => entry.packet_no)
        : [];
      setAvailablePackets(packets);
    } catch (err) {
      console.error('Failed to fetch available packets', err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE_URL}/shine/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          packet_no: assignForm.packetNo,
          kapan_no: assignForm.kapanNo,
          party_name: assignForm.partyName,
          weight: parseFloat(assignForm.weight),
          assign_date: assignForm.assignDate
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Assigned successfully")
        fetchShineData()
        fetchAvailablePackets()
        setAssignForm({ packetNo: "", kapanNo: "", partyName: "", weight: "", assignDate: "" })
      } else {
        toast.error(data.message || "Assignment failed")
      }
    } catch (err) {
      toast.error("Error assigning packet")
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE_URL}/shine/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          packet_no: submitForm.packetNo,
          submission_date: submitForm.submissionDate
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Submitted successfully")
        fetchShineData()
        fetchAvailablePackets()
        setSubmitForm({
          packetNo: "",
          kapanNo: "",
          partyName: "",
          weight: "",
          submissionDate: "",
        })
      } else {
        toast.error(data.message || "Submission failed")
      }
    } catch (err) {
      toast.error("Error submitting packet")
      console.error(err)
    }
  }

  const fetchShineData = async () => {
    try {

      const res = await fetch(`${API_BASE_URL}/shine/entries`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      const data = await res.json();
      const mappedData: ShineEntry[] = data.map((entry: ApiShineEntry) => ({
        id: entry.id,
        packetNo: entry.packet_no,
        kapanNo: entry.kapan_no,
        partyName: entry.party_name,
        weight: entry.weight,
        status: entry.status === 'submitted' ? 'Submitted' : 'Assigned',
      }))
      setShineEntries(mappedData)
    } catch (err) {
      toast.error("Error fetching shine data")
      console.error(err)
    }
  }

  useEffect(() => {
    fetchShineData()
    fetchAvailablePackets()
  }, [])

  // Auto-fill assign form when packet_no is selected from planning entries
  useEffect(() => {
    const fetchAssignDataForAssignForm = async () => {
      if (!assignForm.packetNo.trim()) return
      try {
        const res = await fetch(`${API_BASE_URL}/planning/entries`, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        })

        if (res.ok) {
          const data = await res.json()
          const packetData = data.data?.find((entry: PlanningEntry) => entry.packet_no === assignForm.packetNo)
          
          if (packetData) {
            setAssignForm((prev) => ({
              ...prev,
              kapanNo: packetData.kapan_no || '',
              partyName: packetData.planner_name || '',
              weight: packetData.kapan_wt?.toString() || ''
            }))
          } else {
            setAssignForm((prev) => ({
              ...prev,
              kapanNo: "",
              partyName: "",
              weight: ""
            }))
          }
        }
      } catch (err) {
        console.error("Error fetching assign data for assign form", err)
      }
    }

    fetchAssignDataForAssignForm()
  }, [assignForm.packetNo])

  useEffect(() => {
    const fetchAssignData = async () => {
      if (!submitForm.packetNo.trim()) return
      try {
        const res = await fetch(`${API_BASE_URL}/planning/entries`, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        })

        if (res.ok) {
          const data = await res.json()
          const packetData = data.data?.find((entry: PlanningEntry) => entry.packet_no === submitForm.packetNo)
          
          if (packetData) {
            setSubmitForm((prev) => ({
              ...prev,
              kapanNo: packetData.kapan_no || '',
              partyName: packetData.planner_name || '',
              weight: packetData.kapan_wt?.toString() || ''
            }))
          } else {
            setSubmitForm((prev) => ({
              ...prev,
              kapanNo: "",
              partyName: "",
              weight: ""
            }))
          }
        }
      } catch (err) {
        console.error("Error fetching assign data", err)
      }
    }

    fetchAssignData()
  }, [submitForm.packetNo])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign Form */}
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-900">શાઇન સોંપો</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <Label className="form-label">પેકેટ નં</Label>
                <select
                  value={assignForm.packetNo}
                  onChange={e => setAssignForm({ ...assignForm, packetNo: e.target.value })}
                  required
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">પેકેટ પસંદ કરો</option>
                  {availablePackets.map(pkt => (
                    <option key={pkt} value={pkt}>{pkt}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="form-label">કાપણ નં</Label>
                <Input value={assignForm.kapanNo} onChange={(e) => setAssignForm({ ...assignForm, kapanNo: e.target.value })} required />
              </div>
              <div>
                <Label className="form-label">પાર્ટી નામ</Label>
                <Input value={assignForm.partyName} onChange={(e) => setAssignForm({ ...assignForm, partyName: e.target.value })} required />
              </div>
              <div>
                <Label className="form-label">વજન (ગ્રામ)</Label>
                <Input type="number" step="0.01" value={assignForm.weight} onChange={(e) => setAssignForm({ ...assignForm, weight: e.target.value })} required />
              </div>
              <div>
                <Label className="form-label">સોંપવાની તારીખ</Label>
                <Input type="date" value={assignForm.assignDate} onChange={(e) => setAssignForm({ ...assignForm, assignDate: e.target.value })} required />
              </div>
              <Button type="submit">સોંપો</Button>
            </form>
          </CardContent>
        </Card>

        {/* Submit Form */}
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-900">શાઇન સબમિટ કરો</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="form-label">પેકેટ નં</Label>
                <select
                  value={submitForm.packetNo}
                  onChange={e => setSubmitForm({ ...submitForm, packetNo: e.target.value })}
                  required
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">પેકેટ પસંદ કરો</option>
                  {availablePackets.map(pkt => (
                    <option key={pkt} value={pkt}>{pkt}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="form-label">કાપણ નં</Label>
                <Input value={submitForm.kapanNo} onChange={(e) => setSubmitForm({ ...submitForm, kapanNo: e.target.value })} required />
              </div>
              <div>
                <Label className="form-label">પાર્ટી નામ</Label>
                <Input value={submitForm.partyName} onChange={(e) => setSubmitForm({ ...submitForm, partyName: e.target.value })} required />
              </div>
              <div>
                <Label className="form-label">વજન (ગ્રામ)</Label>
                <Input type="number" step="0.01" value={submitForm.weight} onChange={(e) => setSubmitForm({ ...submitForm, weight: e.target.value })} required />
              </div>
              <div>
                <Label className="form-label">સબમિશન તારીખ</Label>
                <Input type="date" value={submitForm.submissionDate} onChange={(e) => setSubmitForm({ ...submitForm, submissionDate: e.target.value })} required />
              </div>
              <Button type="submit" >સબમિટ કરો</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Shine Entries Table */}
      <Card>
        <CardHeader className="flex items-center justify-between bg-gray-50">
          <CardTitle className="text-gray-800">શાઇન એન્ટ્રીઝ</CardTitle>
          <Button size="sm" variant="outline" onClick={fetchShineData}>
            <i className="fas fa-sync-alt mr-2"></i> રિફ્રેશ કરો
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">પેકેટ નં</th>
                <th className="p-3 text-left">કાપણ નં</th>
                <th className="p-3 text-left">પાર્ટી નામ</th>
                <th className="p-3 text-right">વજન (ગ્રામ)</th>
                <th className="p-3 text-left">સ્થિતિ</th>
              </tr>
            </thead>
            <tbody>
              {shineEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    કોઈ શાઇન એન્ટ્રીઓ મળી નથી.
                  </td>
                </tr>
              ) : (
                shineEntries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{entry.packetNo}</td>
                    <td className="p-3">{entry.kapanNo}</td>
                    <td className="p-3">{entry.partyName}</td>
                    <td className="p-3 text-right">{entry.weight}</td>
                    <td className="p-3">{entry.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
