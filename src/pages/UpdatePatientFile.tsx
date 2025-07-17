import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import PatientSelector from '@/components/patients/PatientSelector';
import { useAppDispatch } from '@/redux/hooks';
import { updatePatientFile } from '@/redux/slices/reportsSlice';
import { toast } from 'sonner';

function formatFileSize(size: number) {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDateLocal(dateStr: string) {
  const date = new Date(dateStr);
  date.setHours(date.getHours() + 4); // UTC+4
  return date.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const UpdatePatientFile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileData, setFileData] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [localLoading, setLocalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    const token = localStorage.getItem('authToken');
    fetch(`https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/PatientReportFile/GetReportFileById/${id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setFileData(data);
        setDescription(data.description || '');
        setFileName(data.fileName || '');
        setFileUrl(data.fileUrl || '');
        setSelectedPatient({
          id: data.patientId,
          name: data.patientFullname?.split(' ')[0] || '',
          surname: data.patientFullname?.split(' ').slice(1).join(' ') || '',
        });
      })
      .catch((err) => setError(err.message || 'Failed to load file'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fayl seçimi və preview üçün
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
      setFileUrl(''); // yeni fayl seçiləndə köhnə url silinsin
    }
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setFileName(e.dataTransfer.files[0].name);
      setFileUrl('');
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpdate = async () => {
    if (!selectedPatient) return;
    setLocalLoading(true);
    setErrorMsg('');
    try {
      await dispatch(
        updatePatientFile({
          id,
          file: selectedFile,
          patientId: String(selectedPatient.id),
          patientFullName: `${selectedPatient.name || ''} ${selectedPatient.surname || ''}`.trim(),
          description,
        })
      ).unwrap();
      toast.success('Fayl uğurla yeniləndi!');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err: any) {
      if (err && typeof err === 'string' && err.includes('409')) {
        toast.error('Artıq yeniləmə vaxtı bitib');
      } else {
        setErrorMsg(err || 'Fayl yenilənə bilmədi');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  if (loading) return <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl text-center">Yüklənir...</div>;
  if (error) return <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl text-center text-red-500">{error}</div>;
  if (!fileData) return null;

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">Update Patient File</h2>
      <div className="space-y-6">
        {/* File upload area */}
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1 block">File</label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center mb-2 cursor-pointer transition ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div>
                <div className="font-medium text-blue-700">{selectedFile.name}</div>
                <div className="text-xs text-gray-400 mt-1">Click or drag to change file</div>
              </div>
            ) : fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold underline break-all group">
                <Download className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Faylı yüklə ({fileName})
              </a>
            ) : (
              <div>
                <div className="text-gray-400 text-lg mb-2">Drag & Drop or <span className="text-blue-600 underline">Choose file</span> to upload</div>
                <div className="text-xs text-gray-400">Supported: PDF, DOCX, JPG, PNG, ...</div>
              </div>
            )}
          </div>
        </div>
        {/* Patient seçimi və cari seçilmiş patient card */}
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1 block">Select patient</label>
          {selectedPatient && (
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-xl border-2 border-blue-500 bg-blue-50 px-5 py-3 shadow font-bold text-lg text-blue-800 flex items-center">
                {selectedPatient.name} {selectedPatient.surname}
              </div>
            </div>
          )}
          <PatientSelector
            onSelect={setSelectedPatient}
            selectedPatientId={selectedPatient ? String(selectedPatient.id) : undefined}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">Description</label>
          <textarea
            className="w-full rounded-lg border border-gray-200 px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-blue-200 transition"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Lab işçisi qeydi..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">Created At</label>
          <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-gray-700 text-sm">{formatDateLocal(fileData.createdAt)}</div>
        </div>
      </div>
      {errorMsg && <div className="mb-4 text-red-600 font-semibold">{errorMsg}</div>}
      <div className="flex gap-2 justify-end mt-8">
        <Button variant="outline" onClick={() => navigate(-1)}>Geri</Button>
        <Button onClick={handleUpdate} disabled={localLoading}>
          {localLoading ? 'Yenilənir...' : 'Update'}
        </Button>
      </div>
    </div>
  );
};

export default UpdatePatientFile; 