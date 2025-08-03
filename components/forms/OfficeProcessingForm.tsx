// components/forms/OfficeProcessingForm.tsx

import { useFormContext } from "@/context/FormContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const OfficeProcessingForm = () => {
  const {
    formData,
    updateFormData,
    renderError,
    errors,
    markTabComplete,
  } = useFormContext();

  const [loading, setLoading] = useState(false);
  const [roughDiamonds, setRoughDiamonds] = useState<{ rough_name: string; remaining_weight: number; weight_carat: number; }[]>([]);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    const fetchRoughDiamonds = async () => {
      setLoadingStock(true);
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:4000/api/rough-diamonds", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch rough diamonds");
        const data = await res.json();
        setRoughDiamonds(data);
      }  finally {
        setLoadingStock(false);
      }
    };
    fetchRoughDiamonds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:4000/api/office-processing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          office_name: formData.office_name,
          rough_name: formData.Roughname,
          weight: parseFloat(formData.weight),
          size: formData.Size_office,
          nang_number: formData.nung_count,
          given_date: formData.sendingdate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || "Processing record added successfully");
      markTabComplete("office-processing");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🧾 Stock Display Section */}
      <div className="stock-display mb-6 p-4 border rounded bg-gray-50" id="current-stocks">
        <h3 className="text-lg font-semibold mb-2">વર્તમાન સ્ટોક સ્થિતિ</h3>
        <div id="stock-list">
          {loadingStock ? (
            <p className="text-sm text-gray-500">લોડ કરી રહ્યું છે...</p>
          ) : roughDiamonds.length === 0 ? (
            <p className="text-sm text-gray-500">કોઈ રફ ડાયમંડ ઉપલબ્ધ નથી.</p>
          ) : (
            <table className="min-w-full text-sm table-auto border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left">રફ નામ</th>
                  <th className="p-2 text-right">કુલ વજન (ct)</th>
                  <th className="p-2 text-right">બાકી વજન (ct)</th>
                </tr>
              </thead>
              <tbody>
                {roughDiamonds.map((d) => (
                  <tr key={d.rough_name}>
                    <td className="p-2">{d.rough_name}</td>
                    <td className="p-2 text-right">{d.weight_carat}</td>
                    <td className="p-2 text-right">{d.remaining_weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 📝 Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>ઓફિસ પ્રોસેસિંગ</CardTitle>
          <CardDescription>ઓફિસમાં રફ ડાયમંડની કામગીરી માટે વિગતો દાખલ કરો</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form onSubmit={handleSubmit} className="contents">
            <div className="space-y-2">
              <Label htmlFor="office_name">ઓફિસ નામ *</Label>
              <Input
                id="office_name"
                value={formData.office_name}
                onChange={(e) => updateFormData("office_name", e.target.value)}
                placeholder="ઓફિસ નામ દાખલ કરો"
                className={errors.office_name ? "border-red-500" : ""}
              />
              {renderError("office_name")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rough_name_processing">રફ નામ *</Label>
              <Select
                value={formData.Roughname}
                onValueChange={(value) => updateFormData("Roughname", value)}
              >
                <SelectTrigger className={errors.Roughname ? "border-red-500" : ""}>
                  <SelectValue placeholder="રફ પસંદ કરો" />
                </SelectTrigger>
                <SelectContent>
                  {roughDiamonds.map((d) => (
                    <SelectItem key={d.rough_name} value={d.rough_name}>
                      {d.rough_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderError("Roughname")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="processing_weight">વજન *</Label>
              <Input
                id="processing_weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => updateFormData("weight", e.target.value)}
                placeholder="0.00"
                className={errors.weight ? "border-red-500" : ""}
              />
              {renderError("weight")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="processing_size">સાઈઝ *</Label>
              <Input
                id="processing_size"
                value={formData.Size_office}
                onChange={(e) => updateFormData("Size_office", e.target.value)}
                placeholder="સાઈઝ દાખલ કરો"
                className={errors.Size_office ? "border-red-500" : ""}
              />
              {renderError("Size_office")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nang_number">નંગ નંબર *</Label>
              <Input
                id="nang_number"
                value={formData.nung_count}
                onChange={(e) => updateFormData("nung_count", e.target.value)}
                placeholder="નંગ નંબર દાખલ કરો"
                className={errors.nung_count ? "border-red-500" : ""}
              />
              {renderError("nung_count")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="given_date">આપવાનો તારીખ *</Label>
              <Input
                id="given_date"
                type="date"
                value={formData.sendingdate ? formData.sendingdate.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  updateFormData(
                    "sendingdate",
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
                className={errors.sendingdate ? "border-red-500" : ""}
              />
              {renderError("sendingdate")}
            </div>

            <div className="col-span-full">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "મોકલી રહ્યું છે..." : "પ્રોસેસિંગ મોકલાવો"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};
