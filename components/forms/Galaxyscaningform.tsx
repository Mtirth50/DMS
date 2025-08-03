import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../ui/card"; // Assuming these paths are correct
import { Label } from "../ui/label";
import { Input }
 from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

// Define your API base URL here.
// In a real application, this would be an environment variable.
const API_BASE_URL = "http://localhost:4000/api"; // Adjust if your backend runs on a different port/URL

type AssignedPacket = {
  packetNo: string;
  weight: string;
  partyName: string;
  assignDate: string;
  status: 'assigned' | 'submitted';
  submitDate?: string;
};

interface PlanningEntry {
  packet_no: string;
  kapan_no: string;
  planner_name: string;
  kapan_wt: number;
  status: string;
}

const GalaxyScanningForm = () => {
  // State to hold the authentication token, which would be set after a successful login API call.
  const [authToken, setAuthToken] = useState<string | null>(null);

  // useEffect to retrieve the auth token from localStorage on component mount.
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken'); // Assuming the token is stored under the key 'authToken'
    if (storedToken) {
      setAuthToken(storedToken);
      console.log("Auth token retrieved from localStorage.");
    } else {
      console.warn("No auth token found in localStorage. User might not be logged in.");
      showNotification("Authentication token not found. Please log in.", "error");
    }
  }, []); // Run once on component mount

  const [assignData, setAssignData] = useState({
    packetNo: "",
    weight: "",
    partyName: "",
    assignDate: "",
  });

  const [submitData, setSubmitData] = useState({
    packetNo: "",
    partyName: "",
    weight: "",
    assignDate: "",
    submitDate: "",
  });

  const [availablePacketNumbers, setAvailablePacketNumbers] = useState<string[]>([]);
  const [assignedPackets, setAssignedPackets] = useState<AssignedPacket[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to display notifications
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper function to create headers with the auth token
  const getAuthHeaders = () => {
    if (!authToken) {
      // Handle case where token is not available (e.g., user not logged in)
      throw new Error("Authentication token is not available.");
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
  };

  // Fetches all packet numbers from the nung-separation API
  // and filters out those that are already assigned/submitted in the current session.
  const fetchAvailablePackets = async () => {
    if (!authToken) {
      // Don't proceed if auth token is not yet available
      showNotification("Authentication token not available. Please wait or log in.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/nung-separation`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Assuming data is an array of objects like { packet_no: "PKT001", ... }
      const allNungPacketNumbers = data.map((item: PlanningEntry) => item.packet_no);

      // Filter out packets that are already in the assignedPackets state
      // Note: For persistent availability across sessions, you would need a GET endpoint
      // for galaxy-scanning to fetch all previously assigned/submitted packets from the DB.
      const currentlyAssignedPacketNos = new Set(assignedPackets.map(p => p.packetNo));
      const filteredAvailablePackets = allNungPacketNumbers.filter((pkt: string) =>
        !currentlyAssignedPacketNos.has(pkt)
      );

      setAvailablePacketNumbers(filteredAvailablePackets);
    } catch (error: unknown) {
      if (error instanceof Error) {
        showNotification(`Failed to fetch available packets: ${error.message}`, "error");
      } else {
        showNotification("અજાણી ભૂલ", "error");
      }
      console.error("Error fetching available packets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch available packets when component mounts or assignedPackets change
  // and also when authToken becomes available
  useEffect(() => {
    if (authToken) { // Only fetch if authToken is available
      fetchAvailablePackets();
    }
  }, [assignedPackets, authToken]); // Re-fetch when assignedPackets change or authToken becomes available

  // Handles the submission of the assign form
  const handleAssignSubmit = async () => {
    const { packetNo, weight, partyName, assignDate } = assignData;
    const today = new Date().toISOString().split("T")[0];

    // Form validation
    if (!packetNo || !weight || !partyName || !assignDate) {
      showNotification("કૃપા કરીને તમામ ફીલ્ડ ભરો.", "error");
      return;
    }
    if (parseFloat(weight) <= 0) {
      showNotification("વજન માન્ય હોવું જોઈએ.", "error");
      return;
    }
    if (assignDate > today) {
      showNotification("આજથી આગળની તારીખ માન્ય નથી.", "error");
      return;
    }
    if (!authToken) {
      showNotification("Authentication token not available. Please wait or log in.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/galaxy-scanning/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          packet_no: packetNo,
          weight: parseFloat(weight), // Ensure weight is sent as a number
          party_name: partyName,
          date: assignDate, // Backend expects 'date'
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      // On successful assignment, update local state
      const newAssignment: AssignedPacket = {
        packetNo,
        weight,
        partyName,
        assignDate,
        status: 'assigned'
      };
      setAssignedPackets(prev => [...prev, newAssignment]);

      showNotification("Galaxy scanning સફળતાપૂર્વક assign થયું!");

      // Reset assign form data
      setAssignData({
        packetNo: "",
        weight: "",
        partyName: "",
        assignDate: "",
      });

      // Pre-fill submit form with the newly assigned packet's details
      setSubmitData({
        packetNo,
        partyName,
        weight,
        assignDate,
        submitDate: today,
      });

    } catch (error: unknown) {
      if (error instanceof Error) {
        showNotification(`Failed to assign galaxy scanning: ${error.message}`, "error");
      } else {
        showNotification("અજાણી ભૂલ", "error");
      }
      console.error("Error assigning galaxy scanning:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles the submission of the submit form
  const handleSubmitFormSubmit = async () => {
    const { packetNo, partyName, submitDate } = submitData;

    // Form validation
    if (!packetNo || !submitDate) {
      showNotification("કૃપા કરીને પેકેટ નંબર અને સબમિટ તારીખ પસંદ કરો.", "error");
      return;
    }
    if (!authToken) {
      showNotification("Authentication token not available. Please wait or log in.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/galaxy-scanning/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          packet_no: packetNo,
          party_name: partyName,
          date: submitDate, // Backend expects 'date'
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      // On successful submission, update local state
      setAssignedPackets(prev =>
        prev.map(pkg =>
          pkg.packetNo === packetNo
            ? { ...pkg, status: 'submitted', submitDate }
            : pkg
        )
      );

      showNotification("Galaxy scanning સફળતાપૂર્વક સબમિટ થયું!");

      // Reset submit form data
      setSubmitData({
        packetNo: "",
        partyName: "",
        weight: "",
        assignDate: "",
        submitDate: "",
      });

    } catch (error: unknown) {
      if (error instanceof Error) {
        showNotification(`Failed to submit galaxy scanning: ${error.message}`, "error");
      } else {
        showNotification("અજાણી ભૂલ", "error");
      }
      console.error("Error submitting galaxy scanning:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filters assigned packets to show only those that are 'assigned' (not yet submitted)
  const getAssignedPacketsForSubmit = () => {
    return assignedPackets.filter(pkg => pkg.status === 'assigned');
  };

  return (
    <div>
      {/* Notification */}
      {notification && (
        <Alert className={`mb-4 ${notification.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">Processing...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign Form */}
        <Card>
          <CardHeader>
            <CardTitle>ગેલેક્સી સ્કેનિંગ એસાઇન</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="assign-packet-no">પેકેટ નંબર</Label>
                <Select
                  value={assignData.packetNo}
                  onValueChange={(value) =>
                    setAssignData({ ...assignData, packetNo: value })
                  }
                >
                  <SelectTrigger id="assign-packet-no">
                    <SelectValue placeholder="પેકેટ પસંદ કરો" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePacketNumbers.length > 0 ? (
                      availablePacketNumbers.map((pkt) => (
                        <SelectItem key={pkt} value={pkt}>
                          {pkt}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-packets" disabled>કોઈ પેકેટ ઉપલબ્ધ નથી</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assign-weight">વજન</Label>
                <Input
                  id="assign-weight"
                  type="number"
                  step="0.01"
                  value={assignData.weight}
                  onChange={(e) =>
                    setAssignData({ ...assignData, weight: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="assign-party-name">પાર્ટી નામ</Label>
                <Input
                  id="assign-party-name"
                  value={assignData.partyName}
                  onChange={(e) =>
                    setAssignData({ ...assignData, partyName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="assign-date">તારીખ</Label>
                <Input
                  id="assign-date"
                  type="date"
                  value={assignData.assignDate}
                  onChange={(e) =>
                    setAssignData({ ...assignData, assignDate: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleAssignSubmit}>એસાઇન કરો</Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit Form */}
        <Card>
          <CardHeader>
            <CardTitle>ગેલેક્સી સ્કેનિંગ સબમિટ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="submit-packet-no">પેકેટ નંબર</Label>
                <Select
                  value={submitData.packetNo}
                  onValueChange={(value) => {
                    const selectedPacket = assignedPackets.find(pkg => pkg.packetNo === value);
                    if (selectedPacket) {
                      setSubmitData({
                        packetNo: value,
                        partyName: selectedPacket.partyName,
                        weight: selectedPacket.weight,
                        assignDate: selectedPacket.assignDate,
                        submitDate: new Date().toISOString().split("T")[0],
                      });
                    }
                  }}
                >
                  <SelectTrigger id="submit-packet-no">
                    <SelectValue placeholder="પેકેટ પસંદ કરો" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAssignedPacketsForSubmit().length > 0 ? (
                      getAssignedPacketsForSubmit().map((pkg) => (
                        <SelectItem key={pkg.packetNo} value={pkg.packetNo}>
                          {pkg.packetNo}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-assigned-packets" disabled>કોઈ એસાઇન પેકેટ નથી</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="submit-party-name">પાર્ટી નામ</Label>
                <Input id="submit-party-name" value={submitData.partyName} readOnly />
              </div>
              <div>
                <Label htmlFor="submit-weight">વજન</Label>
                <Input id="submit-weight" value={submitData.weight} readOnly />
              </div>
              <div>
                <Label htmlFor="submit-assign-date">એસાઇન તારીખ</Label>
                <Input id="submit-assign-date" value={submitData.assignDate} readOnly />
              </div>
              <div>
                <Label htmlFor="submit-date">સબમિટ તારીખ</Label>
                <Input
                  id="submit-date"
                  type="date"
                  value={submitData.submitDate}
                  onChange={(e) =>
                    setSubmitData({ ...submitData, submitDate: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleSubmitFormSubmit} disabled={!submitData.packetNo}>
                સબમિટ કરો
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Display */}
      {assignedPackets.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>પેકેટ સ્ટેટસ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignedPackets.map((pkg, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{pkg.packetNo}</span> - {pkg.partyName}
                    <div className="text-sm text-gray-500">
                      Assign Date: {pkg.assignDate}
                      {pkg.submitDate && ` | Submit Date: ${pkg.submitDate}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      pkg.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {pkg.status === 'assigned' ? 'Assigned' : 'Submitted'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GalaxyScanningForm;
