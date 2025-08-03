// components/forms/NungSeparationForm.tsx

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from 'sonner'; // Assuming you have shadcn/ui toast or similar for notifications

interface Packet {
  id: number;
  packet_no: string; // Changed to match backend 'packet_no'
  weight: number;
  status: string;
  created_at: string | null; // Changed to match backend 'created_at' for consistent display
}

export const NungSeparationForm = () => {
  const [packetNo, setPacketNo] = useState("");
  const [weight, setWeight] = useState("");
  const [packets, setPackets] = useState<Packet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- API Base URL ---
  // Make sure this matches your backend API's base URL
  const API_BASE_URL = "http://localhost:4000/api"; // Adjust if your backend runs on a different port or domain

  // --- Auth Token (Placeholder) ---
  // You'll need to replace this with how you actually get the JWT token.
  // For example, from localStorage after a successful login.
  const getAuthToken = () => {
    return localStorage.getItem("authToken"); // Replace with your actual token retrieval
  };

  // --- Fetch existing packets on component mount ---
  useEffect(() => {
    const fetchPackets = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) {
          setError("Authentication token not found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/nung-separation`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Send token in Authorization header
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch packets.");
        }

        const data: Packet[] = await response.json();
        setPackets(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
        setError(err.message);
        toast.error("Error fetching packet: ");
      } 
      } finally {
        setLoading(false);
      }
    };

    fetchPackets();
  }, []); // Empty dependency array means this runs once on mount

  // --- Handle form submission (POST to backend) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!packetNo || !weight) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setSubmitting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/nung-separation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Send token in Authorization header
        },
        body: JSON.stringify({
          packet_no: packetNo, // Ensure keys match backend
          weight: parseFloat(weight),
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to add packet.");
      }

      toast.success(responseData.message || "Nung separation added successfully!");

      // After successful submission, clear the form and refetch the list
      setPacketNo("");
      setWeight("");

      // Re-fetch packets to update the list with the newly added item
      // This is a simple way; for larger apps, you might optimize by just adding the new item to state.
      const updatedResponse = await fetch(`${API_BASE_URL}/nung-separation`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const updatedData: Packet[] = await updatedResponse.json();
      setPackets(updatedData);

    } catch (err: unknown) {
      if (err instanceof Error) {
      setError(err.message);
      toast.error("Error adding packet: ");
    } 
  }finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Add Packet */}
      <Card>
        <CardHeader>
          <CardTitle>નવો પેકેટ ઉમેરો</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="packet_no">પેકેટ નંબર</Label>
              <Input
                id="packet_no"
                value={packetNo}
                onChange={(e) => setPacketNo(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="weight">વજન</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "સેવ કરી રહ્યું છે..." : "સેવ કરો"}
            </Button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Packet List */}
      <Card>
        <CardHeader>
          <CardTitle>પેકેટ્સની યાદી</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="text-center p-4">Loading packets...</div>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2">પેકેટ નંબર</th>
                  <th className="p-2">વજન</th>
                  <th className="p-2">સ્થિતિ</th>
                  <th className="p-2">તારીખ</th>
                </tr>
              </thead>
              <tbody>
                {packets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      કોઈ પેકેટ ઉમેરેલ નથી
                    </td>
                  </tr>
                ) : (
                  packets.map((pkt) => (
                    <tr key={pkt.id} className="border-b">
                      <td className="p-2">{pkt.packet_no}</td>
                      <td className="p-2">{pkt.weight}</td>
                      <td className="p-2">{pkt.status}</td>
                      <td className="p-2">{pkt.created_at ? format(new Date(pkt.created_at), "dd-MM-yyyy HH:mm:ss") : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};