"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, UserPlus, User } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "office_user";
  is_active: boolean;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "office_user" as "admin" | "office_user",
  });
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    role: "office_user" as "admin" | "office_user",
    password: "",
  });

  const { user: currentUser } = useAuth();
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const getAuthToken = () => localStorage.getItem("authToken");
  

  const fetchUsers = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("યુઝર્સ લોડ કરવામાં નિષ્ફળ");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role !== "admin") {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [currentUser, router, fetchUsers]);

  const handleCreateUser = async () => {
    try {
      const token = getAuthToken();
      
      // Ensure role is exactly what backend expects
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role // Ensure lowercase
      };
      
      console.log('Creating user with payload:', payload);
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast.success("યુઝર સફળતાપૂર્વક ઉમેરાયો");
      setIsCreateModalOpen(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "office_user",
      });
      fetchUsers();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("યુઝર ઉમેરવામાં નિષ્ફળ");
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast.success("યુઝર સફળતાપૂર્વક અપડેટ થયો");
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("યુઝર અપડેટ કરવામાં નિષ્ફળ");
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast.success("યુઝર સફળતાપૂર્વક કાઢી નાખ્યો");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("યુઝર કાઢી નાખવામાં નિષ્ફળ");
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/users/${user.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_active: !user.is_active }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast.success(data.message);
      fetchUsers();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("યુઝર સફળતાપૂર્વક કાઢી નાખ્યો");
      }
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">યુઝર મેનેજમેન્ટ</h1>
            <p className="mt-2 text-sm text-gray-600">
              સિસ્ટમ યુઝર્સનું સંચાલન કરો
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            નવો યુઝર ઉમેરો
          </Button>
        </div>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>યુઝર્સ યાદી</CardTitle>
          <CardDescription>સિસ્ટમમાં નોંધાયેલા તમામ યુઝર્સ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">યુઝરનેમ</th>
                  <th className="text-left p-3 font-semibold">ઈમેલ</th>
                  <th className="text-left p-3 font-semibold">રોલ</th>
                  <th className="text-left p-3 font-semibold">સ્થિતિ</th>
                  <th className="text-left p-3 font-semibold">ક્રિયાઓ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{user.username}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === "admin" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {user.role === "admin" ? "એડમિન" : "યુઝર"}
                      </span>
                    </td>
                    <td className="p-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          className="sr-only peer"
                          checked={user.is_active}
                          onChange={() => handleToggleStatus(user)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(user)}
                          disabled={user.username === currentUser?.name}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>નવો યુઝર ઉમેરો</DialogTitle>
            <DialogDescription>
              નવા યુઝર માટે વિગતો ભરો
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">યુઝરનેમ</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="યુઝરનેમ દાખલ કરો"
              />
            </div>
            <div>
              <Label htmlFor="email">ઈમેલ</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="ઈમેલ દાખલ કરો"
              />
            </div>
            <div>
              <Label htmlFor="password">પાસવર્ડ</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="પાસવર્ડ દાખલ કરો"
              />
            </div>
            <div>
              <Label htmlFor="role">રોલ</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "office_user") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="રોલ પસંદ કરો" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office_user">યુઝર</SelectItem>
                  <SelectItem value="admin">એડમિન</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              રદ કરો
            </Button>
            <Button onClick={handleCreateUser}>યુઝર ઉમેરો</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>યુઝર સંપાદિત કરો</DialogTitle>
            <DialogDescription>
              યુઝર વિગતો અપડેટ કરો
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">યુઝરનેમ</Label>
              <Input
                id="edit-username"
                value={editFormData.username}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, username: e.target.value })
                }
                placeholder="યુઝરનેમ દાખલ કરો"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">ઈમેલ</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                placeholder="ઈમેલ દાખલ કરો"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">રોલ</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: "admin" | "office_user") =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="રોલ પસંદ કરો" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">યુઝર</SelectItem>
                  <SelectItem value="admin">એડમિન</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-password">નવો પાસવર્ડ (વૈકલ્પિક)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editFormData.password}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, password: e.target.value })
                }
                placeholder="નવો પાસવર્ડ દાખલ કરો"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditModalOpen(false)}
            >
              રદ કરો
            </Button>
            <Button onClick={handleUpdateUser}>અપડેટ કરો</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>યુઝર કાઢી નાખો</DialogTitle>
            <DialogDescription>
              શું તમે ખરેખર &apos;{selectedUser?.username}&apos; ને કાઢી નાખવા માંગો છો?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              રદ કરો
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              કાઢી નાખો
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
