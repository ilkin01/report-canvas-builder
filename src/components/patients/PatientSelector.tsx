import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PatientSelectorProps {
  onSelect: (patient: any) => void;
  selectedPatientId?: string | null;
}

const pageSize = 6;

const PatientSelector: React.FC<PatientSelectorProps> = ({ onSelect, selectedPatientId }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPageIndex, setPatientPageIndex] = useState(0);
  const [patientTotalCount, setPatientTotalCount] = useState(0);
  const totalPages = Math.ceil(patientTotalCount / pageSize);

  function getPageNumbers(current: number, total: number) {
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    if (current - delta > 2) range.unshift('...');
    if (current + delta < total - 1) range.push('...');
    range.unshift(1);
    if (total > 1) range.push(total);
    return range;
  }

  useEffect(() => {
    setPatientsLoading(true);
    import('@/services/apiService').then(({ apiService }) => {
      apiService.sendRequest({
        endpoint: '/api/HospitalLab/SearchPatientsForLab',
        method: 'POST',
        body: { name: patientSearch, pageIndex: patientPageIndex, pageSize },
      })
        .then((res) => {
          setPatients(res.users || []);
          setPatientTotalCount(res.totalCount || 0);
        })
        .catch(() => {
          setPatients([]);
          setPatientTotalCount(0);
        })
        .finally(() => setPatientsLoading(false));
    });
  }, [patientSearch, patientPageIndex]);

  return (
    <div>
      <input
        placeholder="Pasiyent axtar..."
        value={patientSearch}
        onChange={e => {
          setPatientSearch(e.target.value);
          setPatientPageIndex(0);
        }}
        className="mb-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 w-full px-3 py-2"
      />
      <div className="text-xs text-gray-500 italic mb-2">Bu pasiyentlər reception tərəfindən yönləndirilib.</div>
      {selectedPatientId && (
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-semibold shadow flex items-center gap-2">
            Seçilmiş: {
              (() => {
                const p = patients.find(x => String(x.id) === String(selectedPatientId));
                return p ? (p.fullName || [p.name, p.surname].filter(Boolean).join(' ')) : '';
              })()
            }
            <button
              type="button"
              className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-blue-200 hover:bg-blue-300 text-blue-700 hover:text-blue-900 transition"
              onClick={() => onSelect(null)}
              aria-label="Seçimi sil"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </span>
        </div>
      )}
      <div className="overflow-y-auto max-h-[350px]">
        {patientsLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-6 text-gray-400">Heç bir pasiyent tapılmadı</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left font-semibold">Ad Soyad</th>
                <th className="py-2 px-4 text-left font-semibold">Ata adı</th>
                <th className="py-2 px-4 text-left font-semibold">Doğum</th>
                <th className="py-2 px-4 text-left font-semibold">FIN</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p: any) => {
                const selected = selectedPatientId === String(p.id);
                return (
                  <tr
                    key={p.id}
                    className={
                      "transition cursor-pointer my-1 " +
                      (selected
                        ? "bg-blue-100/80 shadow-md rounded-lg font-semibold text-blue-900"
                        : "hover:bg-blue-50 hover:shadow-sm rounded-lg")
                    }
                    style={{ transition: 'background 0.2s, box-shadow 0.2s' }}
                    onClick={() => onSelect(p)}
                  >
                    <td className="py-2 px-4">
                      <span
                        className={
                          "underline transition " +
                          (selected
                            ? "text-blue-900 font-bold"
                            : "text-blue-700 hover:text-blue-900")
                        }
                      >
                        {p.fullName || [p.name, p.surname].filter(Boolean).join(' ')}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-500">{p.fatherName || p.middleName || p.patronymic || ''}</td>
                    <td className="py-2 px-4">{p.birthDay}</td>
                    <td className="py-2 px-4">{p.finCode}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination */}
      {patients.length > 0 && totalPages > 0 && (
        <div className="flex justify-center items-center mt-4 gap-2">
          <button
            className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 text-sm font-medium"
            onClick={() => setPatientPageIndex((p) => Math.max(0, p - 1))}
            disabled={patientPageIndex === 0}
          >Prev</button>
          <span className="mx-2 text-base">{patientPageIndex + 1} / {totalPages}</span>
          <button
            className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 text-sm font-medium"
            onClick={() => setPatientPageIndex((p) => Math.min(totalPages - 1, p + 1))}
            disabled={patientPageIndex + 1 >= totalPages}
          >Next</button>
        </div>
      )}
    </div>
  );
};

export default PatientSelector; 