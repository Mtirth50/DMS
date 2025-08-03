import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Packet {
  packet_no: string;
  kapan_no: string;
  party_name: string;
  weight: number;
}

interface PlanningEntry {
  packet_no: string;
  kapan_no: string;
  planner_name: string;
  kapan_wt: number;
  status: string;
}

const API_BASE_URL = "http://localhost:4000/api/polishing";
const getAuthToken = () => localStorage.getItem("authToken");

export const ProcessingForm = () => {
  // State for the Assign Form fields
  const [assignForm, setAssignForm] = useState({
    packetNo: "",
    kapanNo: "",
    partyName: "",
    weight: "",
    assignDate: new Date().toISOString().split("T")[0],
  });

  // State for the Submit Form fields
  const [submitForm, setSubmitForm] = useState({
    packetNo: "",
    kapanNo: "",
    partyName: "",
    weight: "",
    taiyarWeight: "",
    submissionDate: new Date().toISOString().split("T")[0],
  });

  // Dropdown data
  const [eligiblePackets, setEligiblePackets] = useState<Packet[]>([]); // for assign
  const [assignedPackets, setAssignedPackets] = useState<Packet[]>([]); // for submit
  const [loadingAssignDropdown, setLoadingAssignDropdown] = useState(true);
  const [loadingSubmitDropdown, setLoadingSubmitDropdown] = useState(true);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [submittingSubmit, setSubmittingSubmit] = useState(false);

  // Fetch eligible packets for assign dropdown
  const fetchEligiblePackets = useCallback(async () => {
    setLoadingAssignDropdown(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/eligible_hpht_packets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch eligible packets");
      setEligiblePackets(await res.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingAssignDropdown(false);
    }
  }, []);

  // Fetch assigned packets for submit dropdown
  const fetchAssignedPackets = useCallback(async () => {
    setLoadingSubmitDropdown(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      setAssignedPackets(data.filter((entry: PlanningEntry) => entry.status === "assigned"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingSubmitDropdown(false);
    }
  }, []);

  useEffect(() => {
    fetchEligiblePackets();
    fetchAssignedPackets();
  }, [fetchEligiblePackets, fetchAssignedPackets]);

  // When assign packet is selected, auto-fill other fields
  useEffect(() => {
    const pkt = eligiblePackets.find((p) => p.packet_no === assignForm.packetNo);
    if (pkt) {
      setAssignForm((prev) => ({
        ...prev,
        kapanNo: pkt.kapan_no || "",
        partyName: pkt.party_name || "",
        weight: pkt.weight?.toString() || "",
      }));
    } else {
      setAssignForm((prev) => ({ ...prev, kapanNo: "", partyName: "", weight: "" }));
    }
  }, [assignForm.packetNo, eligiblePackets]);

  // When submit packet is selected, auto-fill other fields
  useEffect(() => {
    const pkt = assignedPackets.find((p) => p.packet_no === submitForm.packetNo);
    if (pkt) {
      setSubmitForm((prev) => ({
        ...prev,
        kapanNo: pkt.kapan_no || "",
        partyName: pkt.party_name || "",
        weight: pkt.weight?.toString() || "",
      }));
    } else {
      setSubmitForm((prev) => ({ ...prev, kapanNo: "", partyName: "", weight: "" }));
    }
  }, [submitForm.packetNo, assignedPackets]);

  // --- Handle Assign Form Submission ---
  const handleAssignSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittingAssign(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packet_no: assignForm.packetNo,
          kapan_no: assignForm.kapanNo,
          party_name: assignForm.partyName,
          weight: parseFloat(assignForm.weight),
          assign_date: assignForm.assignDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || "Polishing assigned successfully");
      setAssignForm({
        packetNo: "",
        kapanNo: "",
        partyName: "",
        weight: "",
        assignDate: new Date().toISOString().split("T")[0],
      });
      fetchEligiblePackets();
      fetchAssignedPackets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmittingAssign(false);
    }
  };

  // --- Handle Submit Form Submission ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittingSubmit(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packet_no: submitForm.packetNo,
          taiyar_weight: parseFloat(submitForm.taiyarWeight),
          submission_date: submitForm.submissionDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || "Polishing data submitted successfully");
      setSubmitForm({
        packetNo: "",
        kapanNo: "",
        partyName: "",
        weight: "",
        taiyarWeight: "",
        submissionDate: new Date().toISOString().split("T")[0],
      });
      fetchAssignedPackets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmittingSubmit(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign Form */}
        <Card className="rounded-lg shadow-lg">
          <CardHeader className="bg-blue-100 text-blue-800 rounded-t-lg p-4">
            <CardTitle className="text-xl font-bold">પોલિશિંગ સોંપો</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <Label htmlFor="assign-packet-no" className="block text-sm font-medium text-gray-700 mb-1">પેકેટ નંબર</Label>
                <select
                  id="assign-packet-no"
                  value={assignForm.packetNo}
                  onChange={e => setAssignForm({ ...assignForm, packetNo: e.target.value })}
                  disabled={loadingAssignDropdown || submittingAssign}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">પેકેટ પસંદ કરો</option>
                  {loadingAssignDropdown ? (
                    <option value="loading" disabled>લોડ કરી રહ્યું છે...</option>
                  ) : eligiblePackets.length === 0 ? (
                    <option value="no-data" disabled>કોઈ ઉપલબ્ધ પેકેટ નથી.</option>
                  ) : (
                    eligiblePackets.map((pkt) => (
                      <option key={pkt.packet_no} value={pkt.packet_no}>
                        {pkt.packet_no} ({pkt.kapan_no})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="assign-kapan-no" className="block text-sm font-medium text-gray-700 mb-1">કાપણ નં</Label>
                <Input
                  id="assign-kapan-no"
                  value={assignForm.kapanNo}
                  readOnly
                  className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="assign-party-name" className="block text-sm font-medium text-gray-700 mb-1">પાર્ટી નામ</Label>
                <Input
                  id="assign-party-name"
                  value={assignForm.partyName}
                  readOnly
                  className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="assign-weight" className="block text-sm font-medium text-gray-700 mb-1">વજન (ગ્રામ)</Label>
                <Input
                  id="assign-weight"
                  type="number"
                  step="0.01"
                  value={assignForm.weight}
                  readOnly
                  className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={submittingAssign || !assignForm.packetNo}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out"
              >
                {submittingAssign ? "સોંપી રહ્યું છે..." : "સોંપો"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Submit Form */}
        <Card className="rounded-lg shadow-lg">
          <CardHeader className="bg-green-100 text-green-800 rounded-t-lg p-4">
            <CardTitle className="text-xl font-bold">પોલિશિંગ સબમિટ કરો</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="submit-packet-no" className="block text-sm font-medium text-gray-700 mb-1">પેકેટ નંબર</Label>
                <select
                  id="submit-packet-no"
                  value={submitForm.packetNo}
                  onChange={e => setSubmitForm({ ...submitForm, packetNo: e.target.value })}
                  disabled={loadingSubmitDropdown || submittingSubmit}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">પેકેટ પસંદ કરો</option>
                  {loadingSubmitDropdown ? (
                    <option value="loading" disabled>લોડ કરી રહ્યું છે...</option>
                  ) : assignedPackets.length === 0 ? (
                    <option value="no-data" disabled>કોઈ સોંપેલ પેકેટ નથી.</option>
                  ) : (
                    assignedPackets.map((pkt) => (
                      <option key={pkt.packet_no} value={pkt.packet_no}>
                        {pkt.packet_no} ({pkt.kapan_no})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="submit-kapan-no" className="block text-sm font-medium text-gray-700 mb-1">કાપણ નં</Label>
                <Input
                  id="submit-kapan-no"
                  value={submitForm.kapanNo}
                  readOnly
                  className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="submit-party-name" className="block text-sm font-medium text-gray-700 mb-1">પાર્ટી નામ</Label>
                <Input
                  id="submit-party-name"
                  value={submitForm.partyName}
                  readOnly
                  className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="submit-weight" className="block text-sm font-medium text-gray-700 mb-1">વજન (ગ્રામ)</Label>
                <Input
                  id="submit-weight"
                  type="number"
                  step="0.01"
                  value={submitForm.weight}
                  readOnly
                  className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="submit-taiyar-weight" className="block text-sm font-medium text-gray-700 mb-1">તૈયાર વજન (ગ્રામ)</Label>
                <Input
                  id="submit-taiyar-weight"
                  type="number"
                  step="0.01"
                  value={submitForm.taiyarWeight}
                  onChange={e => setSubmitForm({ ...submitForm, taiyarWeight: e.target.value })}
                  disabled={submittingSubmit}
                  className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label htmlFor="submit-date" className="block text-sm font-medium text-gray-700 mb-1">સબમિશન તારીખ</Label>
                <Input
                  id="submit-date"
                  type="date"
                  value={submitForm.submissionDate}
                  onChange={e => setSubmitForm({ ...submitForm, submissionDate: e.target.value })}
                  disabled={submittingSubmit}
                  className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <Button
                type="submit"
                disabled={submittingSubmit || !submitForm.packetNo}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out"
              >
                {submittingSubmit ? "સબમિટ કરી રહ્યું છે..." : "સબમિટ કરો"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcessingForm;
