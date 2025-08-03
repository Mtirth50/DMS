// components/forms/DiamondDetailsForm.tsx

'use client';

import { useEffect, useState } from 'react';
import { useFormContext } from '@/context/FormContext';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react'; // for loading spinner

interface Props {
  markTabComplete: (tabId: string) => void;
}

type ContactItem = {
  id: number;
  name: string;
  mobile: string;
};

const API_BASE_URL = 'http://localhost:4000/api'; // Ensure this is correct and matches your backend

export const DiamondDetailsForm: React.FC<Props> = ({ markTabComplete }) => {
  const {
    formData,
    updateFormData,
    errors,
    setErrors,
    renderError,
  } = useFormContext();

  const [vepariList, setVepariList] = useState<ContactItem[]>([]);
  const [dalalList, setDalalList] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Effect to retrieve auth token
  useEffect(() => {
    const token = localStorage.getItem('authToken'); // Ensure this key matches your login process
    if (token) {
      setAuthToken(token);
    } else {
      console.warn("Frontend: No authentication token found in localStorage.");
      setDropdownError("Authentication token not found. Please log in.");
    }
  }, []);

  // Helper to get authorization headers
  const getAuthHeaders = () => {
    if (!authToken) {
      console.error("Frontend: Auth token is null when trying to get headers.");
      throw new Error("Authentication token is missing.");
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
  };

  // Effect to fetch vepari and dalal lists
  useEffect(() => {
    const fetchLists = async () => {
      if (!authToken) {
        setDropdownError("Authentication token is missing. Cannot fetch lists.");
        setDropdownLoading(false);
        return;
      }

      setDropdownLoading(true);
      setDropdownError(null); // Clear previous errors
      try {
        const headers = getAuthHeaders();

        // Fetch Veparis
        const vepariRes = await fetch(`${API_BASE_URL}/veparis`, { headers });
        if (!vepariRes.ok) {
          const errorText = await vepariRes.text(); // Read as text for better error debugging
          throw new Error(`Failed to fetch Veparis: ${vepariRes.status} ${vepariRes.statusText || ''} - ${errorText}`);
        }
        const veparis = await vepariRes.json();
        if (!Array.isArray(veparis)) {
            throw new Error("Veparis data format is incorrect: Expected array.");
        }
        setVepariList(veparis);

        // Fetch Dalals
        const dalalRes = await fetch(`${API_BASE_URL}/dalals`, { headers });
        if (!dalalRes.ok) {
          const errorText = await dalalRes.text(); // Read as text for better error debugging
          throw new Error(`Failed to fetch Dalals: ${dalalRes.status} ${dalalRes.statusText || ''} - ${errorText}`);
        }
        const dalals = await dalalRes.json();
        if (!Array.isArray(dalals)) {
            throw new Error("Dalals data format is incorrect: Expected array.");
        }
        setDalalList(dalals);

      } catch (error: unknown) {
        if (error instanceof Error) {
        setDropdownError(`Failed to load contact lists: ${error.message}`);
        } else {
          console.error('Frontend: Error fetching lists:', error);
        }
      } finally {
        setDropdownLoading(false);
      }
    };

    if (authToken) { // Only fetch if token is available
      fetchLists();
    }
  }, [authToken, getAuthHeaders]); // Rerun when authToken changes

  // Form validation logic (unchanged)
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.Roughname || formData.Roughname.length < 3) {
      newErrors.Roughname = 'હીરાની ID ઓછામાં ઓછી 3 અક્ષરની હોવી જોઈએ';
    }
    if (!formData.carat || isNaN(Number(formData.carat)) || Number(formData.carat) <= 0) {
      newErrors.carat = 'માન્ય કેરેટ વજન દાખલ કરો';
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'માન્ય ખરીદી કિંમત દાખલ કરો';
    }
    const colorNum = Number(formData.color);
    if (isNaN(colorNum) || colorNum < 0 || colorNum > 100) {
      newErrors.color = 'કલર 0 થી 100% વચ્ચે હોવો જોઈએ';
    }
    const whitenessNum = Number(formData.whiteness);
    if (formData.whiteness && (isNaN(whitenessNum) || whitenessNum < 0 || whitenessNum > 100)) {
      newErrors.whiteness = 'સફેદ 0 થી 100% વચ્ચે હોવો જોઈએ';
    }
    if (!formData.vepariname) {
      newErrors.vepariname = 'વેપારી પસંદ કરો';
    }
    if (!formData.dalalname) {
      newErrors.dalalname = 'દલાલ પસંદ કરો';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  // Inside components/forms/DiamondDetailsForm.tsx, locate the handleSubmit function

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const payload = {
      // ... your payload as before ...
      rough_name: formData.Roughname,
      purchase_price: Number(formData.price),
      weight_carat: Number(formData.carat),
      size: formData.Size || '',
      quality: formData.Quality || '',
      color_percent: Number(formData.color),
      whiteness_percent: Number(formData.whiteness) || 0,
      vepari_name: formData.vepariname,
      vepari_mobile: formData.veparicontact || '',
      dalal_name: formData.dalalname,
      dalal_mobile: formData.dalalcontact || '',
    };

    try {
      console.log('Frontend: Sending rough diamond payload:', payload);

      if (!authToken) {
        alert("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/rough-diamonds`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('Frontend: Raw response object received:', res);
      console.log('Frontend: Response status:', res.status, 'Response OK:', res.ok);

      const contentType = res.headers.get('content-type');
      console.log('Frontend: Response Content-Type header:', contentType);

      // --- CRITICAL CHANGE HERE ---
      // We read the body ONCE, and handle the potential parsing error immediately
      let result;
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await res.json(); // Attempt to parse JSON
          console.log('Frontend: Successfully parsed JSON result:', result);

          if (res.ok && result.success) {
            markTabComplete('diamond-details');
            alert('રફ ડાયમંડ સફળતાપૂર્વક ઉમેરાયો!');
            // Optionally reset form fields here
          } else {
            console.error('Frontend: Backend reported non-success or specific error:', result);
            alert(result.message || 'રફ ડાયમંડ ઉમેરવામાં એરર આવી');
          }
        } catch (jsonParseError: unknown) {
          if (jsonParseError instanceof Error) {
            alert(`સર્વર પ્રતિભાવનું પૃથ્થકરણ કરવામાં ભૂલ: ${jsonParseError.message}. કૃપા કરીને કન્સોલ તપાસો.`);
          } else {
            alert(`સર્વર પ્રતિભાવનું પૃથ્થકરણ કરવામાં ભૂલ: અજાણી ભૂલ. કૃપા કરીને કન્સોલ તપાસો.`);
          }
        }
      } else {
        // If content type is not JSON, read it as text
        const textResponse = await res.text();
        console.error('Frontend: Received non-JSON response from server (Content-Type mismatch):', textResponse);
        alert('સર્વર તરફથી અપેક્ષિત JSON પ્રતિસાદ મળ્યો નથી. કૃપા કરીને કન્સોલ તપાસો.');
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`નેટવર્ક એરર આવી અથવા સર્વર સાથે કનેક્ટ કરી શકાયું નહીં: ${err.message || 'અજાણી ભૂલ'}`);
      } else {
        alert(`નેટવર્ક એરર આવી અથવા સર્વર સાથે કનેક્ટ કરી શકાયું નહીં: અજાણી ભૂલ`);
      }
      // This catch block is for true network errors (server down, CORS before response)
    }finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>રફ ડાયમંડની વિગતો ઉમેરો</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="Roughname">રફ નામ *</Label>
            <Input
              id="Roughname"
              value={formData.Roughname || ''}
              onChange={(e) => updateFormData('Roughname', e.target.value)}
              placeholder="રફ નામ દાખલ કરો"
              className={errors.Roughname ? 'border-red-500' : ''}
            />
            {renderError('Roughname')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="carat">કેરેટ વજન *</Label>
            <Input
              id="carat"
              type="number"
              value={formData.carat || ''}
              onChange={(e) => updateFormData('carat', e.target.value)}
              placeholder="0.00"
              className={errors.carat ? 'border-red-500' : ''}
            />
            {renderError('carat')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">ખરીદી કિંમત *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price || ''}
              onChange={(e) => updateFormData('price', e.target.value)}
              placeholder="0.00"
              className={errors.price ? 'border-red-500' : ''}
            />
            {renderError('price')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">કલર (%) *</Label>
            <Input
              id="color"
              type="number"
              value={formData.color || ''}
              onChange={(e) => updateFormData('color', e.target.value)}
              placeholder="0.00"
              className={errors.color ? 'border-red-500' : ''}
            />
            {renderError('color')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="Size">સાઈઝ</Label>
            <Input
              id="Size"
              value={formData.Size || ''}
              onChange={(e) => updateFormData('Size', e.target.value)}
              placeholder="સાઈઝ દાખલ કરો"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Quality">ક્વોલિટી</Label>
            <Input
              id="Quality"
              value={formData.Quality || ''}
              onChange={(e) => updateFormData('Quality', e.target.value)}
              placeholder="ક્વોલિટી"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whiteness">સફેદાશ (%)</Label>
            <Input
              id="whiteness"
              type="number"
              value={formData.whiteness || ''}
              onChange={(e) => updateFormData('whiteness', e.target.value)}
              placeholder="0.00"
            />
            {renderError('whiteness')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vepariname">વેપારીનું નામ *</Label>
            <Select
              value={formData.vepariname || ''}
              onValueChange={(value) => {
                updateFormData('vepariname', value);
                if (errors.vepariname) setErrors((prev) => ({ ...prev, vepariname: '' }));
                const selected = vepariList.find((v) => v.name === value);
                updateFormData('veparicontact', selected?.mobile || '');
              }}
              disabled={dropdownLoading || !!dropdownError || !authToken}
            >
              <SelectTrigger className={errors.vepariname ? 'border-red-500' : ''}>
                <SelectValue placeholder={
                  dropdownLoading ? 'લોડ થઈ રહ્યું છે...' :
                  dropdownError ? `એરર: ${dropdownError}` :
                  'વેપારી પસંદ કરો'
                } />
              </SelectTrigger>
              <SelectContent>
                {dropdownError ? (
                  <SelectItem value="error" disabled className="text-red-500">
                    {dropdownError}
                  </SelectItem>
                ) : dropdownLoading ? (
                  <SelectItem value="loading" disabled>
                    લોડ થઈ રહ્યું છે...
                  </SelectItem>
                ) : vepariList.length === 0 ? (
                  <SelectItem value="no-veparis" disabled>
                    કોઈ વેપારી ઉપલબ્ધ નથી
                  </SelectItem>
                ) : (
                  vepariList.map((vepari) => (
                    <SelectItem key={vepari.id} value={vepari.name}>
                      {vepari.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {renderError('vepariname')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="veparicontact">વેપારીનો મોબાઈલ</Label>
            <Input
              id="veparicontact"
              type="text"
              value={formData.veparicontact || ''}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dalalname">દલાલનું નામ *</Label>
            <Select
              value={formData.dalalname || ''}
              onValueChange={(value) => {
                updateFormData('dalalname', value);
                if (errors.dalalname) setErrors((prev) => ({ ...prev, dalalname: '' }));
                const selected = dalalList.find((d) => d.name === value);
                updateFormData('dalalcontact', selected?.mobile || '');
              }}
              disabled={dropdownLoading || !!dropdownError || !authToken}
            >
              <SelectTrigger className={errors.dalalname ? 'border-red-500' : ''}>
                <SelectValue placeholder={
                  dropdownLoading ? 'લોડ થઈ રહ્યું છે...' :
                  dropdownError ? `એરર: ${dropdownError}` :
                  'દલાલ પસંદ કરો'
                } />
              </SelectTrigger>
              <SelectContent>
                {dropdownError ? (
                  <SelectItem value="error" disabled className="text-red-500">
                    {dropdownError}
                  </SelectItem>
                ) : dropdownLoading ? (
                  <SelectItem value="loading" disabled>
                    લોડ થઈ રહ્યું છે...
                  </SelectItem>
                ) : dalalList.length === 0 ? (
                  <SelectItem value="no-dalals" disabled>
                    કોઈ દલાલ ઉપલબ્ધ નથી
                  </SelectItem>
                ) : (
                  dalalList.map((dalal) => (
                    <SelectItem key={dalal.id} value={dalal.name}>
                      {dalal.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {renderError('dalalname')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dalalcontact">દલાલનો મોબાઈલ</Label>
            <Input
              id="dalalcontact"
              type="text"
              value={formData.dalalcontact || ''}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} className="w-full mt-4" disabled={loading || dropdownLoading || !!dropdownError || !authToken}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            ઉમેરાઈ રહ્યું છે...
          </span>
        ) : (
          'રફ ડાયમંડ ઉમેરો'
        )}
      </Button>
    </>
  );
};