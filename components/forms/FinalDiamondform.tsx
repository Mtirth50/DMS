// components/forms/FinalDiamondform.tsx

import { useEffect, useState } from "react";
import { useFormContext } from "@/context/FormContext";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


interface OfficeProcessingRecord {
  office_name: string;
  rough_name: string;
  // Add more fields if needed later
}


export const FinalDiamondform = () => {
  const {
    formData,
    updateFormData,
    markTabComplete,
    renderError,
  } = useFormContext();

  const [totalWeight, setTotalWeight] = useState(0);
  const [officeRecords, setOfficeRecords] = useState<OfficeProcessingRecord[]>([]);
  const [officeNames, setOfficeNames] = useState<string[]>([]);
  const [roughNames, setRoughNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const total =
      Number(formData.topi || 0) +
      Number(formData.patti || 0) +
      Number(formData.simcard || 0);
    setTotalWeight(Number(total.toFixed(2)));
  }, [formData.topi, formData.patti, formData.simcard]);

  // Fetch office processing records on mount
  useEffect(() => {
    const fetchOfficeRecords = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:4000/api/office-processing", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch office processing");
        const data = await res.json();
        setOfficeRecords(data);
        // Unique office names
        setOfficeNames(Array.from(new Set(data.map((d : OfficeProcessingRecord) => String(d.office_name)))));
      } catch (e: unknown) {
        if (e instanceof Error) {
          toast.error("Office records લાવતાં ભૂલ: " + e.message);
        } else {
          toast.error("અજાણી ભૂલ");
        }
      }
    };
    fetchOfficeRecords();
  }, []);

  // Update rough names when office_name_final changes
  useEffect(() => {
    if (!formData.office_name_final) {
      setRoughNames([]);
      return;
    }
    const filtered = officeRecords.filter(
      (rec) => rec.office_name === formData.office_name_final
    );
    setRoughNames(Array.from(new Set(filtered.map((d : OfficeProcessingRecord) => String(d.rough_name)))));
    // If current rough is not in the new list, clear it
    if (!roughNames.includes(formData.Roughnamefinal)) {
      updateFormData("Roughnamefinal", "");
    }
    // eslint-disable-next-line
  }, [formData.office_name_final, officeRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:4000/api/final-diamonds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          office_name: formData.office_name_final,
          rough_name: formData.Roughnamefinal,
          submitted_date: formData.submitdate,
          size: formData.finalsize,
          tops_weight: Number(formData.topi),
          patti_weight: Number(formData.patti),
          simcard_weight: Number(formData.simcard),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || "Final diamond record added successfully");
      markTabComplete("measurements");
    } catch (e: unknown) {
      if (e instanceof Error) {
        toast.error("Final diamond સફળતાપૂર્વક submit થયું!" + e.message);
      } else {
        toast.error("અજાણી ભૂલ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit}>
          {/* --- Final Diamond Collection Section --- */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">ફાઇનલ ડાયમંડ કલેક્શન</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="final_office_name">ઓફિસ નામ</Label>
                <select
                  id="final_office_name"
                  value={formData.office_name_final}
                  onChange={e => updateFormData("office_name_final", e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">ઓફિસ પસંદ કરો</option>
                  {officeNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {renderError("office_name_final")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="final_rough_name">રફ નામ</Label>
                <select
                  id="final_rough_name"
                  value={formData.Roughnamefinal}
                  onChange={e => updateFormData("Roughnamefinal", e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  disabled={!formData.office_name_final}
                >
                  <option value="">રફ પસંદ કરો</option>
                  {roughNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {renderError("Roughnamefinal")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="submitted_date">સબમિટ તારીખ</Label>
                <Input
                  id="submitted_date"
                  type="date"
                  value={
                    formData.submitdate
                      ? formData.submitdate.toISOString?.().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    updateFormData(
                      "submitdate",
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                />
                {renderError("submitdate")}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="final_size">સાઈઝ</Label>
              <Input
                id="final_size"
                value={formData.finalsize}
                onChange={(e) => updateFormData("finalsize", e.target.value)}
                placeholder="સાઈઝ દાખલ કરો"
              />
              {renderError("finalsize")}
            </div>

            <div className="mt-6 border p-4 rounded bg-gray-50">
              <div className="text-base font-medium mb-4">માકબલ વજનો</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tops_weight">1. ટોપીઓ</Label>
                  <Input
                    id="tops_weight"
                    type="number"
                    step="0.01"
                    value={formData.topi}
                    onChange={(e) => updateFormData("topi", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patti_weight">2. પટ્ટીઓ</Label>
                  <Input
                    id="patti_weight"
                    type="number"
                    step="0.01"
                    value={formData.patti}
                    onChange={(e) => updateFormData("patti", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="simcard_weight">3. સિમકાર્ડ</Label>
                  <Input
                    id="simcard_weight"
                    type="number"
                    step="0.01"
                    value={formData.simcard}
                    onChange={(e) => updateFormData("simcard", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 font-semibold">
                Total Weight: <span>{totalWeight}</span> Carat
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-6">
            {loading ? "મોકલી રહ્યું છે..." : "માપ પૂર્ણ કરો"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
