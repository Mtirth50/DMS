import { useState, useEffect, useCallback } from "react";
import { useFormContext } from "@/context/FormContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"; // Assuming sonner is configured for toasts

// Define the base URL for your API
const API_BASE_URL = "http://localhost:4000/api/lssoing";

// Helper function to get the authentication token from local storage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Interface for a Shine entry record (for the table display)
interface ShineEntry {
  id: number;
  packetNo: string;
  kapanNo: string;
  partyName: string;
  weight: number;
  carats: number;
  tops: number;
  status: string;
  assignDate: string;
  submissionDate: string | null;
}

// Interface for data coming from backend for available Nung/Kapan numbers
interface ShinePacket {
  packet_no: string;
  kapan_no: string;
}

export const LssoingForm = () => {
  // State for the Assign Form fields
  const [assignForm, setAssignForm] = useState({
    packetNo: "",
    kapanNo: "",
    partyName: "",
    weight: "",
    carats: "",
    tops: "",
    assignDate: new Date().toISOString().split("T")[0], // Default to today's date
  });

  // State for the Submit Form fields
  const [submitForm, setSubmitForm] = useState({
    packetNo: "",
    kapanNo: "",
    partyName: "",
    weight: "",
    carats: "",
    tops: "",
    submissionDate: new Date().toISOString().split("T")[0], // Default to today's date
  });

  // State to store available Nung/Kapan numbers for the Assign form dropdowns
  const [availableNungKapanForAssign, setAvailableNungKapanForAssign] = useState<ShinePacket[]>([]);
  // State to store all Shine entries for the table
  const [shineEntries, setShineEntries] = useState<ShineEntry[]>([]);

  // Loading states for various API calls
  const [loadingAssignDropdowns, setLoadingAssignDropdowns] = useState(true);
  const [loadingSubmitDropdown, setLoadingSubmitDropdown] = useState(true);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [submittingSubmit, setSubmittingSubmit] = useState(false);
  const [loadingShineEntries, setLoadingShineEntries] = useState(true);

  // --- Fetch data for dropdowns ---

  // Fetches eligible shine packets from both planning entries and eligible shine packets
  const fetchAvailableNungKapanForAssign = useCallback(async () => {
    setLoadingAssignDropdowns(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("ટોકન મળ્યું નથી. કૃપા કરીને લોગિન કરો.");
        return;
      }

      // Fetch from both endpoints
      const [planningResponse, eligibleResponse] = await Promise.all([
        fetch(`${API_BASE_URL.replace('/lssoing', '')}/planning/entries`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/eligible_shine_packets`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      ]);

      if (!planningResponse.ok || !eligibleResponse.ok) {
        throw new Error("ડેટા લાવવામાં સમસ્યા.");
      }

      const planningData = await planningResponse.json();
      const eligibleData = await eligibleResponse.json();

      // Get packet numbers from both sources
      const planningPackets = new Set(
        planningData.data?.map((entry: any) => entry.packet_no) || []
      );
      const eligiblePackets = new Set(
        eligibleData.map((packet: ShinePacket) => packet.packet_no) || []
      );

      // Find intersection of both sets
      const commonPackets = Array.from(planningPackets).filter(packet => 
        eligiblePackets.has(packet)
      );

      // Create ShinePacket objects for common packets
      const commonData: ShinePacket[] = commonPackets.map(packet_no => ({
        packet_no: packet_no as string,
        kapan_no: planningData.data?.find((entry: any) => entry.packet_no === packet_no)?.kapan_no || ''
      }));

      setAvailableNungKapanForAssign(commonData);
    } catch (e: any) {
      toast.error("પેકેટ ડેટા લાવતાં ભૂલ: " + e.message);
    } finally {
      setLoadingAssignDropdowns(false);
    }
  }, []);

  // Fetches all shine entries for the table display
  const fetchShineData = useCallback(async () => {
    setLoadingShineEntries(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("ટોકન મળ્યું નથી. કૃપા કરીને લોગિન કરો.");
        setLoadingShineEntries(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Shine entries લાવવામાં સમસ્યા.");
      }

      const data = await res.json();
      const mappedData: ShineEntry[] = data.map((entry: any) => ({
        id: entry.id,
        packetNo: entry.packet_no,
        kapanNo: entry.kapan_no,
        partyName: entry.party_name,
        weight: entry.weight,
        carats: entry.carats,
        tops: entry.tops,
        status: entry.status === "submitted" ? "Submitted" : "Assigned",
        assignDate: entry.assign_date ? new Date(entry.assign_date).toISOString().split("T")[0] : '',
        submissionDate: entry.submission_date ? new Date(entry.submission_date).toISOString().split("T")[0] : null,
      }));
      setShineEntries(mappedData);
    } catch (err: any) {
      toast.error("Shine entries લાવતાં ભૂલ: " + err.message);
      console.error("Failed to fetch shine data", err);
    } finally {
      setLoadingShineEntries(false);
    }
  }, []);

  // Initial data fetching on component mount
  useEffect(() => {
    fetchAvailableNungKapanForAssign();
    fetchShineData();
  }, [fetchAvailableNungKapanForAssign, fetchShineData]);

  // Auto-fill form fields when packet_no is selected
  const [planningEntriesData, setPlanningEntriesData] = useState<any[]>([]);

  // Fetch planning entries data for auto-fill
  const fetchPlanningEntriesData = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL.replace('/lssoing', '')}/planning/entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Planning entries લાવવામાં સમસ્યા.");
      }

      const data = await response.json();
      setPlanningEntriesData(data.data || []);
    } catch (err: any) {
      console.error("Planning entries fetch error:", err.message);
    }
  }, []);

  // Auto-fill assign form when packet_no is selected
  useEffect(() => {
    if (assignForm.packetNo && planningEntriesData.length > 0) {
      const packetData = planningEntriesData.find(
        (entry) => entry.packet_no === assignForm.packetNo
      );
      
      if (packetData) {
        setAssignForm((prev) => ({
          ...prev,
          kapanNo: packetData.kapan_no || '',
          partyName: packetData.planner_name || '',
          weight: packetData.kapan_wt?.toString() || '',
        }));
      }
    }
  }, [assignForm.packetNo, planningEntriesData]);

  // Auto-fill submit form when packet_no is selected
  useEffect(() => {
    if (submitForm.packetNo && planningEntriesData.length > 0) {
      const packetData = planningEntriesData.find(
        (entry) => entry.packet_no === submitForm.packetNo
      );
      
      if (packetData) {
        setSubmitForm((prev) => ({
          ...prev,
          kapanNo: packetData.kapan_no || '',
          partyName: packetData.planner_name || '',
          weight: packetData.kapan_wt?.toString() || '',
        }));
      }
    }
  }, [submitForm.packetNo, planningEntriesData]);

  // Fetch planning entries when component mounts
  useEffect(() => {
    fetchPlanningEntriesData();
  }, [fetchPlanningEntriesData]);

  // --- Handle Assign Form Submission ---
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { packetNo, kapanNo, partyName, weight, carats, tops, assignDate } = assignForm;
    const today = new Date().toISOString().split("T")[0];

    // Validation checks
    if (!packetNo || !kapanNo || !partyName || !weight || !assignDate) {
      toast.error("કૃપા કરીને પેકેટ નંબર, કાપણ નંબર, પાર્ટી નામ, વજન અને સોંપવાની તારીખ ભરો.");
      return;
    }
    if (parseFloat(weight) <= 0) {
      toast.error("વજન માન્ય હોવું જોઈએ.");
      return;
    }
    if (assignDate > today) {
      toast.error("આજથી આગળની તારીખ માન્ય નથી.");
      return;
    }
    if (!carats && !tops) {
      toast.error("કેરેટ અથવા ટોપ્સમાંથી ઓછામાં ઓછું એક ભરવું આવશ્યક છે.");
      return;
    }
    if (carats && parseFloat(carats) <= 0) {
      toast.error("કેરેટ માન્ય હોવા જોઈએ.");
      return;
    }
    if (tops && parseFloat(tops) <= 0) {
      toast.error("ટોપ્સ માન્ય હોવા જોઈએ.");
      return;
    }

    setSubmittingAssign(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("ટોકન મળ્યું નથી. કૃપા કરીને લોગિન કરો.");
        setSubmittingAssign(false);
        return;
      }

      console.log('Assigning with:', assignForm);
      const res = await fetch(`${API_BASE_URL}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packet_no: assignForm.packetNo, // Use packetNo
          kapan_no: assignForm.kapanNo,
          party_name: assignForm.partyName,
          weight: parseFloat(assignForm.weight),
          carats: carats ? parseFloat(carats) : null, // Send null if not filled
          tops: tops ? parseFloat(tops) : null,       // Send null if not filled
          assign_date: assignForm.assignDate,
        }),
      });

      const data = await res.json();
      //console.log(data);
      if (!res.ok) {
        throw new Error(data.message || "Shine assign કરવામાં સમસ્યા.");
      }

      toast.success(data.message || "LSSoing સફળતાપૂર્વક assign થયું!");
      // Reset assign form and refetch data
      setAssignForm({
        packetNo: "",
        kapanNo: "",
        partyName: "",
        weight: "",
        carats: "",
        tops: "",
        assignDate: today,
      });
      fetchAvailableNungKapanForAssign(); // Refresh assign dropdowns
      fetchShineData(); // Refresh table
    } catch (err: any) {
      toast.error("Assign કરતી વખતે ભૂલ: " + err.message);
      //console.error(err);
    } finally {
      setSubmittingAssign(false);
    }
  };

  // --- Handle Submit Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { packetNo, submissionDate } = submitForm;
    const today = new Date().toISOString().split("T")[0];

    // Validation checks
    if (!packetNo || !submissionDate) {
      toast.error("કૃપા કરીને પેકેટ નંબર અને સબમિશન તારીખ પસંદ કરો.");
      return;
    }

    // Find the assigned packet details to get its assign_date for validation
    const assignedPacket = shineEntries.find(
      (p) => p.packetNo === packetNo
    );

    
    if (submissionDate > today) {
      toast.error("આજથી આગળની તારીખ માન્ય નથી.");
      return;
    }


    setSubmittingSubmit(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("ટોકન મળ્યું નથી. કૃપા કરીને લોગિન કરો.");
        setSubmittingSubmit(false);
        return;
      }

      console.log('Submitting with:', submitForm);
      const res = await fetch(`${API_BASE_URL}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packet_no: submitForm.packetNo, // Use packetNo
          carats: submitForm.carats,
          tops: submitForm.tops,
          submission_date: submitForm.submissionDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Shine submit કરવામાં ભૂલ.");
      }

      toast.success(data.message || "Shine સફળતાપૂર્વક submit થયું!");
      // Reset submit form and refetch data
      setSubmitForm({
        packetNo: "",
        kapanNo: "",
        partyName: "",
        weight: "",
        carats: "",
        tops: "",
        submissionDate: today,
      });
      fetchAvailableNungKapanForAssign(); // Refresh assign dropdowns
      fetchShineData(); // Refresh table
    } catch (err: any) {
      toast.error("Submit કરતી વખતે ભૂલ: " + err.message);
      console.error(err);
    } finally {
      setSubmittingSubmit(false);
    }
  };

  // Effect to auto-fill submit form fields when a Nung Number is selected
  useEffect(() => {
    const selectedPacket = shineEntries.find(
      (p) => p.packetNo === submitForm.packetNo
    );

    if (selectedPacket) {
      setSubmitForm((prev) => ({
        ...prev,
        kapanNo: selectedPacket.kapanNo,
        partyName: selectedPacket.partyName,
        weight: selectedPacket.weight.toString(),
        carats: selectedPacket.carats ? selectedPacket.carats.toString() : '',
        tops: selectedPacket.tops ? selectedPacket.tops.toString() : '',
      }));
    } else {
      // Clear fields if no packet is selected or found
      setSubmitForm((prev) => ({
        ...prev,
        kapanNo: "",
        partyName: "",
        weight: "",
        carats: "",
        tops: "",
      }));
    }
  }, [submitForm.packetNo, shineEntries]);

  // When setting submitForm from a ShinePacket, only use packet_no and kapan_no. Set other fields to empty string or default values.
  const handleAssignedPacketSelect = (packet_no: string) => {
    const pkt = shineEntries.find(p => p.packetNo === packet_no);
    setSubmitForm({
      ...submitForm,
      packetNo: pkt?.packetNo || '',
      kapanNo: pkt?.kapanNo || '',
      partyName: pkt?.partyName || '',
      weight: pkt?.weight?.toString() || '',
      carats: pkt?.carats ? pkt.carats.toString() : '',
      tops: pkt?.tops ? pkt.tops.toString() : '',
    });
  };

  // 1. Remove assignedShinePacketsForSubmit state and its fetcher if not needed elsewhere
  // const [assignedShinePacketsForSubmit, setAssignedShinePacketsForSubmit] = useState<ShinePacket[]>([]);

  // 2. In the Submit Form, filter assigned packets from shineEntries:
  const assignedPacketsFromEntries = shineEntries
    .filter(entry => entry.status === "Assigned")
    .map(entry => ({
      packet_no: entry.packetNo,
      kapan_no: entry.kapanNo,
      party_name: entry.partyName,
      weight: entry.weight,
      carats: entry.carats,
      tops: entry.tops,
    }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign Form */}
        <Card className="rounded-lg shadow-lg">
          <CardHeader className="bg-blue-100 text-blue-800 rounded-t-lg p-4">
            <CardTitle className="text-xl font-bold">LSSoing સોંપો</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <Label htmlFor="assign-nung-no" className="block text-sm font-medium text-gray-700 mb-1">પેકેટ નંબર</Label>
                <Select
                  value={assignForm.packetNo}
                  onValueChange={(value) => setAssignForm({ ...assignForm, packetNo: value })}
                  disabled={loadingAssignDropdowns || submittingAssign}
                >
                  <SelectTrigger id="assign-nung-no" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="પેકેટ પસંદ કરો" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md shadow-lg">
                    {loadingAssignDropdowns ? (
                      <SelectItem value="loading" disabled>
                        લોડ કરી રહ્યું છે...
                      </SelectItem>
                    ) : availableNungKapanForAssign.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        કોઈ ઉપલબ્ધ પેકેટ નથી.
                      </SelectItem>
                    ) : (
                      availableNungKapanForAssign.map((pkt) => (
                        <SelectItem key={pkt.packet_no} value={pkt.packet_no}>
                          {pkt.packet_no} ({pkt.kapan_no})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assign-kapan-no" className="block text-sm font-medium text-gray-700 mb-1">કાપણ નં</Label>
                <Select
                  value={assignForm.kapanNo}
                  onValueChange={(value) =>
                    setAssignForm({ ...assignForm, kapanNo: value })
                  }
                  disabled={loadingAssignDropdowns || submittingAssign}
                >
                  <SelectTrigger id="assign-kapan-no" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="કાપણ પસંદ કરો" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md shadow-lg">
                    {loadingAssignDropdowns ? (
                      <SelectItem value="loading" disabled>
                        લોડ કરી રહ્યું છે...
                      </SelectItem>
                    ) : availableNungKapanForAssign.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        કોઈ ઉપલબ્ધ કાપણ નથી.
                      </SelectItem>
                    ) : (
                      // Filter unique kapan numbers from available data
                      Array.from(new Set(availableNungKapanForAssign.map(item => item.kapan_no))).map((kapan) => (
                        <SelectItem key={kapan} value={kapan}>
                          {kapan}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assign-party-name" className="block text-sm font-medium text-gray-700 mb-1">પાર્ટી નામ</Label>
                <Input
                  id="assign-party-name"
                  value={assignForm.partyName}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, partyName: e.target.value })
                  }
                  required
                  disabled={submittingAssign}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="assign-weight" className="block text-sm font-medium text-gray-700 mb-1">વજન (ગ્રામ)</Label>
                <Input
                  id="assign-weight"
                  type="number"
                  step="0.01"
                  value={assignForm.weight}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, weight: e.target.value })
                  }
                  required
                  disabled={submittingAssign}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assign-carats" className="block text-sm font-medium text-gray-700 mb-1">કેરેટ</Label>
                  <Input
                    id="assign-carats"
                    type="number"
                    step="0.01"
                    value={assignForm.carats}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, carats: e.target.value })
                    }
                    disabled={submittingAssign}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="assign-tops" className="block text-sm font-medium text-gray-700 mb-1">ટોપ્સ</Label>
                  <Input
                    id="assign-tops"
                    type="number"
                    step="0.01"
                    value={assignForm.tops}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, tops: e.target.value })
                    }
                    disabled={submittingAssign}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="assign-date" className="block text-sm font-medium text-gray-700 mb-1">સોંપવાની તારીખ</Label>
                <Input
                  id="assign-date"
                  type="date"
                  value={assignForm.assignDate}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, assignDate: e.target.value })
                  }
                  required
                  disabled={submittingAssign}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button
                type="submit"
                disabled={submittingAssign}
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
            <CardTitle className="text-xl font-bold">LSSoing સબમિટ કરો</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="submit-nung-no" className="block text-sm font-medium text-gray-700 mb-1">પેકેટ નંબર</Label>
                <Select
                  value={submitForm.packetNo}
                  onValueChange={(value) => {
                    // Find the selected packet's details
                    const pkt = assignedPacketsFromEntries.find(p => p.packet_no === value);
                    setSubmitForm({
                      packetNo: pkt?.packet_no || "",
                      kapanNo: pkt?.kapan_no || "",
                      partyName: pkt?.party_name || "",
                      weight: pkt?.weight?.toString() || "",
                      carats: pkt?.carats?.toString() || "",
                      tops: pkt?.tops?.toString() || "",
                      submissionDate: submitForm.submissionDate,
                    });
                  }}
                  disabled={loadingShineEntries || submittingSubmit}
                >
                  <SelectTrigger id="submit-nung-no" className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    <SelectValue placeholder="પેકેટ પસંદ કરો" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md shadow-lg">
                    {loadingShineEntries ? (
                      <SelectItem value="loading" disabled>
                        લોડ કરી રહ્યું છે...
                      </SelectItem>
                    ) : assignedPacketsFromEntries.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        કોઈ સોંપેલ પેકેટ નથી.
                      </SelectItem>
                    ) : (
                      assignedPacketsFromEntries.map((item) => (
                        <SelectItem key={item.packet_no} value={item.packet_no}>
                          {item.packet_no}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                  value={submitForm.weight}
                  readOnly
                  className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="submit-carats" className="block text-sm font-medium text-gray-700 mb-1">કેરેટ</Label>
                  <Input
                    id="submit-carats"
                    value={submitForm.carats}
                    readOnly
                    className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="submit-tops" className="block text-sm font-medium text-gray-700 mb-1">ટોપ્સ</Label>
                  <Input
                    id="submit-tops"
                    value={submitForm.tops}
                    readOnly
                    className="rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="submit-date" className="block text-sm font-medium text-gray-700 mb-1">સબમિશન તારીખ</Label>
                <Input
                  id="submit-date"
                  type="date"
                  value={submitForm.submissionDate}
                  onChange={(e) =>
                    setSubmitForm({ ...submitForm, submissionDate: e.target.value })
                  }
                  required
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

      {/* Shine Entries Table */}
      <Card className="rounded-lg shadow-lg">
        <CardHeader className="flex items-center justify-between bg-gray-100 text-gray-800 rounded-t-lg p-4">
          <CardTitle className="text-xl font-bold">શાઇન એન્ટ્રીઝ</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchShineData}
            disabled={loadingShineEntries}
            className="flex items-center space-x-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            {loadingShineEntries ? "લોડ કરી રહ્યું છે..." : "રિફ્રેશ કરો"}
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full text-sm table-auto border-collapse">
            <thead className="bg-gray-200 text-gray-700 border-b border-gray-300">
              <tr>
                <th className="p-3 text-left font-semibold">પેકેટ નં</th>
                <th className="p-3 text-left font-semibold">કાપણ નં</th>
                <th className="p-3 text-left font-semibold">પાર્ટી નામ</th>
                <th className="p-3 text-right font-semibold">વજન (ગ્રામ)</th>
                <th className="p-3 text-right font-semibold">કેરેટ</th>
                <th className="p-3 text-right font-semibold">ટોપ્સ</th>
                <th className="p-3 text-left font-semibold">સ્થિતિ</th>
                <th className="p-3 text-left font-semibold">સોંપવાની તારીખ</th>
                <th className="p-3 text-left font-semibold">સબમિશન તારીખ</th>
              </tr>
            </thead>
            <tbody>
              {shineEntries.length === 0 && !loadingShineEntries ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    કોઈ શાઇન એન્ટ્રીઓ મળી નથી.
                  </td>
                </tr>
              ) : loadingShineEntries ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    શાઇન એન્ટ્રીઓ લોડ કરી રહ્યું છે...
                  </td>
                </tr>
              ) : (
                shineEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                    <td className="p-3">{entry.packetNo}</td>
                    <td className="p-3">{entry.kapanNo}</td>
                    <td className="p-3">{entry.partyName}</td>
                    <td className="p-3 text-right">{entry.weight.toFixed(2)}</td>
                    <td className="p-3 text-right">{entry.carats ? entry.carats.toFixed(2) : '-'}</td>
                    <td className="p-3 text-right">{entry.tops ? entry.tops.toFixed(2) : '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        entry.status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-3">{entry.assignDate}</td>
                    <td className="p-3">{entry.submissionDate || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LssoingForm;
