
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  status: string;
}

const RegistrationRequests: React.FC = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const reqs = await api.users.getRegistrationRequests();
        setRequests(reqs || []);
      } catch (err) {
        setActionMessage('Gagal memuat permintaan registrasi.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleApprove = async (request: RegistrationRequest) => {
    setActionMessage(null);
    try {
      await api.users.approveRegistrationRequest(request.id, { email: request.email, full_name: request.name });
      setActionMessage('User baru berhasil diapprove dan ditambahkan.');
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      setActionMessage('Gagal approve user baru.');
    }
  };

  const handleReject = async (request: RegistrationRequest) => {
    setActionMessage(null);
    try {
      await api.users.rejectRegistrationRequest(request.id);
      setActionMessage('Permintaan registrasi ditolak.');
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      setActionMessage('Gagal menolak permintaan registrasi.');
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
        Permintaan Registrasi User Baru
      </h2>
      {loading ? (
        <div className="text-slate-500">Memuat data...</div>
      ) : requests.length === 0 ? (
        <div className="text-slate-500">Tidak ada permintaan registrasi baru.</div>
      ) : (
        <table className="w-full border rounded mb-4">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="p-2">Nama</th>
              <th className="p-2">Email</th>
              <th className="p-2">Status</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-b">
                <td className="p-2">{req.name}</td>
                <td className="p-2">{req.email}</td>
                <td className="p-2">{req.status}</td>
                <td className="p-2 flex gap-2">
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded"
                    onClick={() => handleApprove(req)}
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={() => handleReject(req)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {actionMessage && (
        <div className="text-sm text-center text-slate-700 dark:text-slate-200 mb-2">
          {actionMessage}
        </div>
      )}
    </div>
  );
};

export default RegistrationRequests;
