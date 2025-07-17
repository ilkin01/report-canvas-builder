import React, { useState } from 'react';
import PatientSelector from '@/components/patients/PatientSelector';
import { useAppDispatch } from '@/redux/hooks';
import { uploadPatientFile } from '@/redux/slices/reportsSlice';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SendFileToPatient: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const dispatch = useAppDispatch();
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Drag & drop və ya klikləmə ilə fayl seçimi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Göndərmə funksiyası
  const handleSend = async () => {
    if (selectedFile && selectedPatient) {
      setLocalLoading(true);
      setErrorMsg('');
      try {
        await dispatch(
          uploadPatientFile({
            file: selectedFile,
            patientId: String(selectedPatient.id),
            patientFullName: `${selectedPatient.name || ''} ${selectedPatient.surname || ''}`.trim(),
            description: description,
          })
        ).unwrap();
        toast.success('Fayl uğurla göndərildi!');
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } catch (err: any) {
        setErrorMsg(err || 'Fayl göndərilə bilmədi');
      } finally {
        setLocalLoading(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-lg shadow p-8">
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium border border-gray-200 transition"
          onClick={() => navigate('/')}
          type="button"
        >
          Back to dashboard
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-2">Send a file to patient</h2>
      <p className="text-gray-500 mb-6">Lab işçisi pasiyentə analiz və ya digər fayl göndərə bilər. Faylı əlavə edib, pasiyenti seçin və göndərin.</p>

      {/* File upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center mb-6 cursor-pointer ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
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
        ) : (
          <div>
            <div className="text-gray-400 text-lg mb-2">Drag & Drop or <span className="text-blue-600 underline">Choose file</span> to upload</div>
            <div className="text-xs text-gray-400">Supported: PDF, DOCX, JPG, PNG, ...</div>
          </div>
        )}
      </div>

      {/* Description area */}
      <div className="mb-6">
        <label className="block font-semibold mb-1" htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          className="w-full rounded border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 resize-none min-h-[80px]"
          placeholder="Lab işçisi öz qeydlərini yaza bilər..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Patient selection area */}
      <div className="mb-6">
        <div className="font-semibold mb-2">Select patient</div>
        <PatientSelector
          onSelect={setSelectedPatient}
          selectedPatientId={selectedPatient ? String(selectedPatient.id) : undefined}
        />
      </div>

      {errorMsg && <div className="mb-4 text-red-600 font-semibold">{errorMsg}</div>}

      <button
        className="w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        disabled={!selectedFile || !selectedPatient || localLoading}
        onClick={handleSend}
      >
        {localLoading ? 'Göndərilir...' : 'Send'}
      </button>
    </div>
  );
};

export default SendFileToPatient; 