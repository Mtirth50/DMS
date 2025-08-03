// components/forms/TransactionForm.tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Pencil, Trash } from "lucide-react";

type Contact = {
  id: number;
  name: string;
  mobile: string;
};

const API_BASE_URL = 'http://localhost:4000/api';

const TransactionForm = () => {

  const [veparis, setVeparis] = useState<Contact[]>([]);
  const [dalals, setDalals] = useState<Contact[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [contactType, setContactType] = useState<"vepari" | "dalal">("vepari");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formState, setFormState] = useState({ name: "", mobile: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null); // State to hold the token

  // Fetch token when component mounts (or from a global auth context)
  useEffect(() => {
    // Replace with your actual token retrieval logic (e.g., from an AuthContext, Redux, or cookie)
    const token = localStorage.getItem('authToken'); // Assuming you store it here after login
    if (token) {
      setAuthToken(token);
    } else {
      // Handle case where no token is found (e.g., redirect to login)
      setError("No authentication token found. Please log in.");
      console.error("Authentication token not found in localStorage.");
      // Potentially redirect to login page: navigate('/login');
    }
  }, []);

  // Centralized function to get headers, including authorization
  const getAuthHeaders = () => {
    if (!authToken) {
      // If no token, throw an error or return null.
      // The API call functions will then catch this.
      throw new Error("Authentication token is missing.");
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`, // Essential for your verifyToken middleware
    };
  };

  // --- Fetch Contacts on Component Mount (modified to use authToken) ---
  useEffect(() => {
    const fetchContacts = async () => {
      if (!authToken) return; // Don't fetch if no token is available yet

      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders(); // Get headers with token

        const veparisResponse = await fetch(`${API_BASE_URL}/veparis/`, { headers });
        const dalalsResponse = await fetch(`${API_BASE_URL}/dalals`, { headers });

        if (!veparisResponse.ok || !dalalsResponse.ok) {
          const veparisError = !veparisResponse.ok ? await veparisResponse.json() : null;
          const dalalsError = !dalalsResponse.ok ? await dalalsResponse.json() : null;
          throw new Error(veparisError?.message || dalalsError?.message || 'Failed to fetch contacts');
        }

        const veparisData: Contact[] = await veparisResponse.json();
        const dalalsData: Contact[] = await dalalsResponse.json();

        setVeparis(veparisData);
        setDalals(dalalsData);

      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'An unknown error occurred while fetching contacts.');
      
          if (err.message.includes('token') || err.message.includes('Unauthorized')) {
            console.error('Auth error, redirecting to login or logging out.');
            // Example: localStorage.removeItem('authToken'); navigate('/login');
          }
        } else {
          setError('An unknown error occurred while fetching contacts.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (authToken) { // Only fetch if token exists
      fetchContacts();
    }
  }, [authToken, getAuthHeaders]); // Rerun when authToken changes

  // --- API Call Functions (modified to use authToken) ---
  const addContactAPI = async (contact: Omit<Contact, 'id'>, type: "vepari" | "dalal") => {
    try {
      const response = await fetch(`${API_BASE_URL}/${type}s`, {
        method: 'POST',
        headers: getAuthHeaders(), // Use the centralized header function
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add ${type}`);
      }

      const newContact = await response.json();
      return newContact;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`Failed to add ${type}.`);
      }
      throw err;
    }
  };

  const updateContactAPI = async (contact: Contact, type: "vepari" | "dalal") => {
    try {
      const response = await fetch(`${API_BASE_URL}/${type}s/${contact.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(), // Use the centralized header function
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update ${type}`);
      }
      return response.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`Failed to add ${type}.`);
      }
      throw err;
    }
  };

  const deleteContactAPI = async (id: number, type: "vepari" | "dalal") => {
    try {
      const response = await fetch(`${API_BASE_URL}/${type}s/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(), // Use the centralized header function
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete ${type}`);
      }
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`Failed to add ${type}.`);
      }
      throw err;
    }
  };

  // ... (rest of your component code remains the same)

  const openAddModal = (type: "vepari" | "dalal") => {
    setContactType(type);
    setEditingContact(null);
    setFormState({ name: "", mobile: "" });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (contact: Contact, type: "vepari" | "dalal") => {
    setContactType(type);
    setEditingContact(contact);
    setFormState({ name: contact.name, mobile: contact.mobile });
    setError(null);
    setModalOpen(true);
  };

  const saveContact = async () => {
    const contactData: Omit<Contact, 'id'> = {
      name: formState.name.trim(),
      mobile: formState.mobile.trim(),
    };
    if (!contactData.name || !contactData.mobile) {
      setError("Name and mobile cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingContact) {
        const updatedContact: Contact = { ...contactData, id: editingContact.id };
        await updateContactAPI(updatedContact, contactType);

        const updater = contactType === "vepari" ? setVeparis : setDalals;
        const list = contactType === "vepari" ? veparis : dalals;
        updater(list.map((c) => (c.id === updatedContact.id ? updatedContact : c)));

      } else {
        const newContact = await addContactAPI(contactData, contactType);
        
        const updater = contactType === "vepari" ? setVeparis : setDalals;
        const list = contactType === "vepari" ? veparis : dalals;
        updater([...list, newContact]);
      }
      setModalOpen(false);
    }  finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (id: number, type: "vepari" | "dalal") => {
    setLoading(true);
    setError(null);
    try {
      await deleteContactAPI(id, type);
      if (type === "vepari") {
        setVeparis(veparis.filter((v) => v.id !== id));
      } else {
        setDalals(dalals.filter((d) => d.id !== id));
      }
    } 
   finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>વ્યવહારની વિગતો</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading && <p>Loading contacts...</p>}
          {error && <p className="text-red-500">Error: {error}</p>} {/* Display general error */}

          {/* Trader & Broker Management */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">વેપારી અને દલાલ મેનેજમેન્ટ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Veparis */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">વેપારીઓ</h4>
                  <Button variant="secondary" onClick={() => openAddModal("vepari")} disabled={!authToken}>
                    ઉમેરો
                  </Button>
                </div>
                <div className="space-y-2">
                  {veparis.length === 0 ? (
                    <p className="text-sm text-muted-foreground">કોઇ વેપારી નથી</p>
                  ) : (
                    veparis.map((v) => (
                      <div key={v.id} className="flex justify-between items-center border rounded p-2">
                        <div>
                          <div className="font-medium">{v.name}</div>
                          <div className="text-sm text-muted-foreground">{v.mobile}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEditModal(v, "vepari")} disabled={!authToken}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteContact(v.id, "vepari")} disabled={!authToken}>
                            <Trash className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dalals */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">દલાલો</h4>
                  <Button variant="secondary" onClick={() => openAddModal("dalal")} disabled={!authToken}>
                    ઉમેરો
                  </Button>
                </div>
                <div className="space-y-2">
                  {dalals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">કોઇ દલાલ નથી</p>
                  ) : (
                    dalals.map((d) => (
                      <div key={d.id} className="flex justify-between items-center border rounded p-2">
                        <div>
                          <div className="font-medium">{d.name}</div>
                          <div className="text-sm text-muted-foreground">{d.mobile}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEditModal(d, "dalal")} disabled={!authToken}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteContact(d.id, "dalal")} disabled={!authToken}>
                            <Trash className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact
                ? `સંપાદિત કરો (${contactType === "vepari" ? "વેપારી" : "દલાલ"})`
                : `નવો ${contactType === "vepari" ? "વેપારી" : "દલાલ"} ઉમેરો`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <Label htmlFor="contactName">નામ</Label>
              <Input
                id="contactName"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="નામ દાખલ કરો"
              />
            </div>
            <div>
              <Label htmlFor="contactMobile">મોબાઇલ નં</Label>
              <Input
                id="contactMobile"
                value={formState.mobile}
                onChange={(e) => setFormState({ ...formState, mobile: e.target.value })}
                placeholder="મોબાઇલ નં દાખલ કરો"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={loading}>
              રદ કરો
            </Button>
            <Button onClick={saveContact} disabled={loading || !authToken}>
              {loading ? 'Saving...' : (editingContact ? "સાચવો" : "ઉમેરો")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionForm;