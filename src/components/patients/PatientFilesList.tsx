import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Edit, Trash } from 'lucide-react';
import { useAppDispatch } from '@/redux/hooks';
import { deletePatientFile, fetchPatientFilesPaginated } from '@/redux/slices/reportsSlice';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface PatientFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  description?: string;
  createdAt: string;
  patientFullname: string;
}

const PAGE_SIZE = 10;

const getLocalDateString = (utcString: string) => {
  const date = new Date(utcString);
  date.setHours(date.getHours() + 4); // UTC+4 üçün 4 saat əlavə et
  return date.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const PatientFilesList: React.FC = () => {
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<PatientFile | null>(null);
  const [searchName, setSearchName] = useState('');
  const [sort, setSort] = useState(true); // true: desc, false: asc
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dispatch(
        fetchPatientFilesPaginated({
          name: searchName,
          sort,
          pageIndex,
          pageSize: PAGE_SIZE,
        })
      ).unwrap();
      setFiles(data.patientReportFiles || []);
      setTotalPages(Math.max(1, Math.ceil((data.totalCount || 0) / PAGE_SIZE)));
    } catch (err: any) {
      setError(err || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPageIndex(0);
      fetchFiles();
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line
  }, [searchName]);

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, [pageIndex, sort]);

  const handleDownload = (file: PatientFile) => {
    window.open(file.fileUrl, '_blank');
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    setDeletingId(fileToDelete.id);
    try {
      await dispatch(deletePatientFile(fileToDelete.id)).unwrap();
      toast.success('Fayl silindi!');
      setShowDeleteModal(false);
      fetchFiles();
    } catch (err: any) {
      toast.error(err || 'Fayl silinə bilmədi');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = (file: PatientFile) => {
    navigate(`/update-patient-file/${file.id}`);
  };

  return (
    <div>
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faylı silmək istədiyinizə əminsiniz?</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-600">{fileToDelete?.fileName}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deletingId !== null}>İmtina</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletingId !== null}>
              {deletingId !== null ? 'Silinir...' : 'Bəli, sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by file or patient name..."
          className="border rounded px-3 py-2 w-full"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
        />
        <Button
          variant="outline"
          className="ml-2"
          onClick={() => { setSort(s => !s); setPageIndex(0); }}
        >
          Sort: {sort ? 'Newest' : 'Oldest'}
        </Button>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Yüklənir...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500 break-all">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left font-semibold">File Name</th>
                <th className="py-2 px-4 text-left font-semibold">Patient Name</th>
                <th className="py-2 px-4 text-left font-semibold">Patient Surname</th>
                <th className="py-2 px-4 text-left font-semibold">Patient Father Name</th>
                <th className="py-2 px-4 text-left font-semibold">Created At</th>
                <th className="py-2 px-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-base">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path d="M12 17v.01M12 7v6m0 8a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Hal-hazırda heç bir fayl yoxdur
                    </div>
                  </td>
                </tr>
              ) : (
                files.map((file) => {
                  // patientFullname: "Nihad Axundzade Refi" və ya "Akif Aliyev Rashid"
                  const parts = (file.patientFullname || '').split(' ');
                  const name = parts[0] || '';
                  const surname = parts[1] || '';
                  const fatherName = parts[2] || '';
                  return (
                    <tr key={file.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{file.fileName}</td>
                      <td className="py-2 px-4">{name}</td>
                      <td className="py-2 px-4">{surname}</td>
                      <td className="py-2 px-4">{fatherName}</td>
                      <td className="py-2 px-4">{file.createdAt ? getLocalDateString(file.createdAt) : ''}</td>
                      <td className="py-2 px-4 flex gap-2">
                        <Button size="icon" variant="outline" title="Download" onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" title="Update" onClick={() => handleUpdate(file)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" title="Delete" onClick={() => { setFileToDelete(file); setShowDeleteModal(true); }} disabled={deletingId === file.id}>
                          {deletingId === file.id ? <span className="w-4 h-4 animate-spin border-2 border-white border-t-red-500 rounded-full"></span> : <Trash className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {files.length > 0 && (
            <div className="flex justify-center items-center mt-4 gap-2">
              <button
                className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                Prev
              </button>
              <span className="mx-2 text-base">{pageIndex + 1} / {totalPages}</span>
              <button
                className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientFilesList; 