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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Define the base URL for your API
const API_BASE_URL = "http://localhost:4000/api/actipart";

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
  karigarName: string; // Added karigarName
  weight: number;
  carats: number; // Kept for table display, removed from forms
  tops: number;     // Kept for table display, removed from forms
  status: string;
  assignDate: string;
  submissionDate: string | null;
  planner_name?: string;
  kapan_wt?: number;
}

// Update NungKapanData interface
interface NungKapanData {
  packet_no: string;
  kapan_no: string;
  party_name: string;
  karigar_name: string;
  weight: number;
  carats?: number;
  tops?: number;
  assign_date?: string;
  planner_name?: string;
  kapan_wt?: number;
}

interface ShineApiResponse {
  id: number;
  packet_no: string;
  kapan_no: string;
  party_name: string;
  karigar_name: string;
  weight: number;
  carats: number;
  tops: number;
  status: string;
  assign_date?: string;
  submission_date?: string;
}

export const ActiForm = () => {
  // State for the Assign Form fields
  const [assignForm, setAssignForm] = useState({
    packetNo: "",
    kapanNo: "",
    karigarName: "", // New field
    partyName: "",
    weight: "",
    assignDate: new Date().toISOString().split("T")[0], // Default to today's date
  });

  // State for the Submit Form fields
  const [submitForm, setSubmitForm] = useState({
    packetNo: "",
    kapanNo: "",
    karigarName: "", // New field
    partyName: "",
    weight: "",
    submissionDate: new Date().toISOString().split("T")[0], // Default to today's date
  });

  // State to store available Nung/Kapan numbers for the Assign form dropdowns
  // This will now fetch data for "whose lssoing is completed and submitted"
  const [availableNungKapanForAssign, setAvailableNungKapanForAssign] = useState<NungKapanData[]>([]);
  // State to store assigned Shine packets for the Submit form dropdown
  // This will now fetch data for "whose Acti part assigned"
  const [assignedShinePacketsForSubmit] = useState<NungKapanData[]>([]);
  // State to store all Shine entries for the table
  const [shineEntries, setShineEntries] = useState<ShineEntry[]>([]);

  const assignedPacketsFromEntries = shineEntries
    .filter(entry => entry.status === "Assigned")
    .map(entry => ({
      packet_no: entry.packetNo,
      kapan_no: entry.kapanNo,
      karigar_name: entry.karigarName,
      party_name: entry.partyName,
      weight: entry.weight,
      assign_date: entry.assignDate,
      planner_name: entry.planner_name,
      kapan_wt: entry.kapan_wt,
    }));

  // Loading states for various API calls
  const [loadingAssignDropdowns, setLoadingAssignDropdowns] = useState(true);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [submittingSubmit, setSubmittingSubmit] = useState(false);
  const [loadingShineEntries, setLoadingShineEntries] = useState(true);

  // --- Fetch data for dropdowns ---

  // Fetches Nung and Kapan numbers that have completed  // Fetches eligible shine packets from both planning entries and eligible shine packets
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
        fetch(`${API_BASE_URL.replace('/actipart', '')}/planning/entries`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL.replace('/actipart', '/lssoing')}/entries`, {
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
        planningData.data?.map((entry: NungKapanData) => entry.packet_no) || []
      );
      const eligiblePackets = new Set(
        eligibleData.map((packet: NungKapanData) => packet.packet_no) || []
      );

      // Find intersection of both sets
      const commonPackets = Array.from(planningPackets).filter(packet => 
        eligiblePackets.has(packet)
      );

      // Create NungKapanData objects for common packets
      const commonData: NungKapanData[] = commonPackets.map(packet_no => ({
        packet_no: packet_no as string,
        kapan_no: planningData.data?.find((entry: NungKapanData) => entry.packet_no === packet_no)?.kapan_no || '',
        party_name: planningData.data?.find((entry: NungKapanData) => entry.packet_no === packet_no)?.planner_name || '',
        weight: planningData.data?.find((entry: NungKapanData) => entry.packet_no === packet_no)?.kapan_wt || 0,
        karigar_name: ''
      }));

      setAvailableNungKapanForAssign(commonData);
    } catch (e: unknown) {
      if (e instanceof Error) {
        toast.error("પેકેટ ડેટા લાવતાં ભૂલ: " + e.message);
      } else {
        toast.error("અજાણી ભૂલ");
      }
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

      const data: ShineApiResponse[] = await res.json();
      const mappedData: ShineEntry[] = data.map((entry) => ({
        id: entry.id,
        packetNo: entry.packet_no,
        kapanNo: entry.kapan_no,
        partyName: entry.party_name,
        karigarName: entry.karigar_name, // Map new field
        weight: entry.weight,
        carats: entry.carats,
        tops: entry.tops,
        status: entry.status === "submitted" ? "Submitted" : "Assigned",
        assignDate: entry.assign_date ? new Date(entry.assign_date).toISOString().split("T")[0] : '',
        submissionDate: entry.submission_date ? new Date(entry.submission_date).toISOString().split("T")[0] : null,
      }));
      setShineEntries(mappedData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Shine entries લાવતાં ભૂલ: " + err.message);
      } else {
        toast.error("અજાણી ભૂલ");
      }
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
  const [planningEntriesData, setPlanningEntriesData] = useState<NungKapanData[]>([]);

  // Fetch planning entries data for auto-fill
  const fetchPlanningEntriesData = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL.replace('/actipart', '')}/planning/entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Planning entries લાવવામાં સમસ્યા.");
      }

      const data = await response.json();
      setPlanningEntriesData(data.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Planning entries fetch error:", err.message);
      } else {
        console.error("અજાણી ભૂલ");
      }
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

    const { packetNo, kapanNo, karigarName, partyName, weight, assignDate } = assignForm;
    const today = new Date().toISOString().split("T")[0];

    // Validation checks
    if (!packetNo || !kapanNo || !weight || !assignDate) {
      toast.error("કૃપા કરીને પેકેટ નંબર, કાપણ નંબર, વજન અને સોંપવાની તારીખ ભરો.");
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
    // Validation: Karigar name or Party name must be filled
    if (!karigarName && !partyName) {
      toast.error("કૃપા કરીને કારીગર નામ અથવા પાર્ટી નામમાંથી ઓછામાં ઓછું એક ભરો.");
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

      const res = await fetch(`${API_BASE_URL}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packet_no: packetNo,
          kapan_no: kapanNo,
          karigar_name: karigarName || null, // Send null if empty
          party_name: partyName || null,     // Send null if empty
          weight: parseFloat(weight),
          assign_date: assignDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Shine assign કરવામાં સમસ્યા.");
      }

      toast.success(data.message || "Shine સફળતાપૂર્વક assign થયું!");
      // Reset assign form and refetch data
      setAssignForm({
        packetNo: "",
        kapanNo: "",
        karigarName: "",
        partyName: "",
        weight: "",
        assignDate: today,
      });
      fetchAvailableNungKapanForAssign(); // Refresh assign dropdowns // Refresh submit dropdowns
      fetchShineData(); // Refresh table
      setSubmitForm((prev) => ({
        ...prev,
        packetNo: assignForm.packetNo,
        // The rest will be auto-filled by the onValueChange below
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Assign કરતી વખતે ભૂલ: " + err.message);
      } else {
        toast.error("અજાણી ભૂલ");
      }
      console.error(err);
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
    const assignedPacket = assignedShinePacketsForSubmit.find(
      (p) => p.packet_no === packetNo
    );

    // Assuming `assign_date` is available in `assignedPacket` from the backend
    if (assignedPacket && assignedPacket.assign_date && submissionDate < assignedPacket.assign_date) {
      toast.error("સબમિટ તારીખ એસાઇન તારીખ કરતા પેહલી ના હોઈ શકે.");
      return;
    }
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

      const res = await fetch(`${API_BASE_URL}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packet_no: packetNo,
          submission_date: submissionDate,
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
        karigarName: "",
        partyName: "",
        weight: "",
        submissionDate: today,
      });
      fetchAvailableNungKapanForAssign(); // Refresh assign dropdowns // Refresh submit dropdowns
      fetchShineData(); // Refresh table
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Submit કરતી વખતે ભૂલ: " + err.message);
      } else {
        toast.error("અજાણી ભૂલ");
      }
      console.error(err);
    } finally {
      setSubmittingSubmit(false);
    }
  };

  // Effect to auto-fill submit form fields when a Nung Number is selected
  // useEffect(() => {
  //   const selectedPacket = assignedShinePacketsForSubmit.find(
  //     (p) => p.packet_no === submitForm.packetNo
  //   );

  //   if (selectedPacket) {
  //     setSubmitForm((prev) => ({
  //       ...prev,
  //       kapanNo: selectedPacket.kapan_no,
  //       karigarName: selectedPacket.karigar_name || "", // Auto-fill karigarName
  //       partyName: selectedPacket.party_name || "",
  //       weight: selectedPacket.weight.toString(),
  //     }));
  //   } else {
  //     // Clear fields if no packet is selected or found
  //     setSubmitForm((prev) => ({
  //       ...prev,
  //       kapanNo: "",
  //       karigarName: "",
  //       partyName: "",
  //       weight: "",
  //     }));
  //   }
  // }, [submitForm.packetNo, assignedShinePacketsForSubmit]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign Form */}
        <Card className="rounded-lg shadow-lg">
          <CardHeader className="bg-blue-100 text-blue-800 rounded-t-lg p-4">
            <CardTitle className="text-xl font-bold">એકટી પાર્ટ સોંપો</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <Label htmlFor="assign-nung-no" className="block text-sm font-medium text-gray-700 mb-1">પેકેટ નંબર</Label>
                <Select
                  value={assignForm.packetNo}
                  onValueChange={(value) =>
                    setAssignForm({ ...assignForm, packetNo: value })
                  }
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
                      availableNungKapanForAssign.map((item) => (
                        <SelectItem key={item.packet_no} value={item.packet_no}>
                          {item.packet_no} ({item.kapan_no})
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
                <Label htmlFor="assign-karigar-name" className="block text-sm font-medium text-gray-700 mb-1">કારીગર નામ</Label>
                <Input
                  id="assign-karigar-name"
                  value={assignForm.karigarName}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, karigarName: e.target.value })
                  }
                  disabled={submittingAssign}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="assign-party-name" className="block text-sm font-medium text-gray-700 mb-1">પાર્ટી નામ</Label>
                <Input
                  id="assign-party-name"
                  value={assignForm.partyName}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, partyName: e.target.value })
                  }
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
            <CardTitle className="text-xl font-bold">એકટી પાર્ટ સબમિટ કરો</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="submit-nung-no" className="block text-sm font-medium text-gray-700 mb-1">પેકેટ નંબર</Label>
                <Select
                  value={submitForm.packetNo}
                  onValueChange={(value) => {
                    const pkt = assignedPacketsFromEntries.find(p => p.packet_no === value);
                    setSubmitForm({
                      packetNo: pkt?.packet_no || "",
                      kapanNo: pkt?.kapan_no || "",
                      karigarName: pkt?.karigar_name || "",
                      partyName: pkt?.party_name || "",
                      weight: pkt?.weight?.toString() || "",
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
                <Label htmlFor="submit-karigar-name" className="block text-sm font-medium text-gray-700 mb-1">કારીગર નામ</Label>
                <Input
                  id="submit-karigar-name"
                  value={submitForm.karigarName}
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
          <CardTitle className="text-xl font-bold">એકટી પાર્ટ એન્ટ્રીઝ</CardTitle>
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
                <th className="p-3 text-left font-semibold">કારીગર નામ</th> {/* New column */}
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
                  <td colSpan={10} className="p-4 text-center text-gray-500">
                    કોઈ શાઇન એન્ટ્રીઓ મળી નથી.
                  </td>
                </tr>
              ) : loadingShineEntries ? (
                <tr>
                  <td colSpan={10} className="p-4 text-center text-gray-500">
                    શાઇન એન્ટ્રીઓ લોડ કરી રહ્યું છે...
                  </td>
                </tr>
              ) : (
                shineEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                    <td className="p-3">{entry.packetNo}</td>
                    <td className="p-3">{entry.kapanNo}</td>
                    <td className="p-3">{entry.partyName}</td>
                    <td className="p-3">{entry.karigarName || '-'}</td> {/* Display karigarName */}
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

export default ActiForm;
