import { fmt } from '../lib/utils'

export default function DaftarPengeluaran({ expenses, onDelete, onDeleteAll, loading }) {
  if (loading) return <div className="text-center py-12 text-gray-400">Memuat data...</div>

  const total = expenses.reduce((acc, curr) => acc + (parseFloat(curr.nominal) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-600">{fmt(total)}</p>
        </div>
        {expenses.length > 0 && (
          <button onClick={() => { if(confirm('Hapus semua pengeluaran?')) onDeleteAll() }}
            className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-all">
            Hapus Semua
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Belum ada pengeluaran tercatat</td>
                </tr>
              ) : (
                expenses.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{new Date(ex.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{ex.keterangan}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">{fmt(ex.nominal)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { if(confirm('Hapus pengeluaran ini?')) onDelete(ex.id) }}
                        className="text-gray-300 hover:text-red-500 transition-colors text-lg">
                        ×
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
