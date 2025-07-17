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
      <div className="overflow-auto max-h-[300px]">
        {patientsLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-6 text-gray-400">Heç bir pasiyent tapılmadı</div>
        ) : (
          <div className="w-full">
            {selectedPatientId && (
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-semibold shadow flex items-center gap-2">
                  Seçilmiş: {(() => {
                    const p = patients.find(x => String(x.id) === String(selectedPatientId));
                    return p ? `${p.name} ${p.surname}` : '';
                  })()}
                  <button
                    type="button"
                    className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-blue-200 hover:bg-blue-300 text-blue-700 hover:text-blue-900 transition"
                    onClick={() => onSelect(null)}
                    aria-label="Seçimi sil"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            )}
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              {patients.map((p: any) => (
                <div
                  key={p.id}
                  className={`rounded-xl border-2 transition cursor-pointer p-4 shadow-sm bg-white hover:shadow-lg hover:border-blue-300 ${
                    selectedPatientId === String(p.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'
                  }`}
                  onClick={() => onSelect(p)}
                >
                  <div className="font-bold text-lg text-blue-800">{p.name} {p.surname}</div>
                  <div className="text-xs text-gray-500 mb-1">{p.fatherName}</div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span><b>Doğum:</b> {p.birthDay ? p.birthDay : '—'}</span>
                    <span><b>FIN:</b> {p.finCode ? p.finCode : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Pagination */}
      {patients.length > 0 && totalPages > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <Button
            size="icon"
            variant="outline"
            aria-label="Əvvəlki səhifə"
            disabled={patientPageIndex === 0}
            onClick={() => setPatientPageIndex(i => i - 1)}
            className="rounded-full transition hover:bg-blue-50"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </Button>
          {getPageNumbers(patientPageIndex + 1, totalPages).map((page, idx) =>
            page === '...'
              ? <span key={idx} className="px-2 text-gray-400 select-none">...</span>
              : (
                <Button
                  key={page}
                  size="icon"
                  aria-label={`Səhifə ${page}`}
                  variant={patientPageIndex + 1 === page ? 'default' : 'outline'}
                  className={
                    'rounded-full font-mono text-lg font-semibold transition ' +
                    (patientPageIndex + 1 === page
                      ? 'bg-blue-600 text-white shadow-lg scale-110'
                      : 'hover:bg-blue-50')
                  }
                  onClick={() => setPatientPageIndex(Number(page) - 1)}
                >
                  {page}
                </Button>
              )
          )}
          <Button
            size="icon"
            variant="outline"
            aria-label="Növbəti səhifə"
            disabled={patientPageIndex === totalPages - 1}
            onClick={() => setPatientPageIndex(i => i + 1)}
            className="rounded-full transition hover:bg-blue-50"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
          </Button>
        </div>
      )}
    </div>
  );
};

export default PatientSelector; 