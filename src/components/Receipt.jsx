import React, { forwardRef } from 'react';
import { fmt } from '../lib/utils';

const Receipt = forwardRef(({ transaction }, ref) => {
  if (!transaction) return null;

  const {
    nama,
    tanggal,
    nama_pembeli,
    items = [],
    totalJual,
    dibayar,
    kurang,
    catatan,
    bahan_model
  } = transaction;

  // Fill up to 10 rows for aesthetic consistency with the sample image
  const displayItems = [...items];
  while (displayItems.length < 8) {
    displayItems.push({ jenis: '', jumlah: '', jual: '', total: '' });
  }

  return (
    <div className="bg-gray-100 p-8 flex justify-center overflow-auto">
      {/* Container specifically for capture, fixed width for consistent rendering */}
      <div
        ref={ref}
        className="bg-white w-[800px] shadow-lg p-6 font-sans text-gray-900 overflow-hidden relative"
        style={{ minHeight: '1000px' }}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            {/* Logo Image */}
            <div className="flex items-center justify-center w-32 h-32 overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo"
                className="object-contain w-full h-full"
              //  style={{ filter: 'brightness(0) invert(1)' }} 
              />
            </div>

            <div>
              <h1 className="text-3xl font-black text-black leading-tight">TS CLOTHING STORE</h1>
              <p className="text-[14px] font-bold tracking-widest text-gray-800 border-b border-gray-800 pb-1 mb-2">
                SABLON SATUAN - LUSINAN - BORDIR KOMPUTER
              </p>
              <div className="text-[12px] font-bold leading-normal uppercase space-y-0.5">
                <p>Email: <span className="text-blue-600 underline">customyouridea21@gmail.com</span></p>
                <div className="flex">
                  <span className="min-w-[55px]">Alamat:</span>
                  <div>
                    <p>Peterongan Jombang</p>
                    <p>Ngunut Tulungagung</p>
                  </div>
                </div>
                <p>G.Maps: TS Clothing / Custom Your Idea</p>
                <p>HP / WA: 081336027807 / 081330349577</p>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <div className="text-[14px] font-bold flex gap-2">
              <span>Date :</span>
              <span className="border-b border-dotted border-gray-400 min-w-[120px] text-center">{tanggal}</span>
            </div>
            <div className="text-[14px] font-bold flex flex-col items-start mt-2">
              <span className="mb-1">Kepada Yth.</span>
              <div className="border border-black w-48 min-h-[48px] p-2 text-sm font-bold flex items-center justify-center text-center leading-tight">
                {nama_pembeli || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Bar */}
        <div className="relative h-12 mb-6">
          <div className="absolute inset-y-0 left-0 right-0 bg-red-600 translate-y-1"></div>
          <div className="absolute top-0 right-4 bg-white px-2 py-0 border-x-4 border-b-4 border-white">
            <h2 className="text-4xl font-black text-black tracking-tighter italic">INVOICE</h2>
          </div>
        </div>

        {/* Table Section */}
        <div className="border-2 border-black overflow-hidden mb-6">
          <table className="w-full border-collapse">
            <thead className="bg-[#FFFF00] border-b-2 border-black">
              <tr>
                <th className="border-r-2 border-black py-2 px-4 text-sm font-black text-center uppercase tracking-widest w-[40%]">Item</th>
                <th className="border-r-2 border-black py-2 px-2 text-sm font-black text-center uppercase tracking-widest w-[15%]">Quantity</th>
                <th className="border-r-2 border-black py-2 px-2 text-sm font-black text-center uppercase tracking-widest w-[20%]">Price</th>
                <th className="py-2 px-2 text-sm font-black text-center uppercase tracking-widest w-[25%]">Total</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((it, idx) => (
                <tr key={idx} className="border-b border-gray-300 last:border-b-0">
                  <td className="border-r-2 border-black px-4 py-2 text-sm font-bold uppercase leading-tight">
                    {it.jumlah || it.jual ? (it.jenis ? `${nama} ${it.jenis}` : nama) : ''}
                  </td>
                  <td className="border-r-2 border-black px-2 text-sm font-bold text-center">{it.jumlah || ''}</td>
                  <td className="border-r-2 border-black px-2 text-sm font-bold text-right">{it.jual ? fmt(it.jual).replace('Rp ', '') : ''}</td>
                  <td className="px-2 text-sm font-bold text-right">{it.jumlah && it.jual ? fmt(it.jumlah * it.jual).replace('Rp ', '') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div className="flex justify-between items-start mt-4">
          <div className="text-[14px] font-bold leading-tight">
            <p className="mb-1 uppercase tracking-tight">Rekening Pembayaran</p>
            <p>BRI : 0023 01 088774 50 4</p>
            <p>DANA : 0813 3602 7807</p>
            <p>(A/N M Syahru Tsani Syafiq)</p>

            {catatan && (
              <div className="mt-4 border-t border-gray-200 pt-1 italic text-gray-500">
                Catatan: {catatan}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0 w-[300px]">
            <div className="flex border-2 border-black border-b-0">
              <div className="flex-1 px-4 py-1 text-xs font-bold uppercase tracking-tighter flex items-center">Total</div>
              <div className="flex-1 px-4 py-1 text-lg font-black text-right border-l-2 border-black">{fmt(totalJual).replace('Rp ', '')}</div>
            </div>
            <div className="flex border-2 border-black border-b-0">
              <div className="flex-1 px-4 py-1 text-xs font-bold uppercase tracking-tighter flex items-center">Uang Muka</div>
              <div className="flex-1 px-4 py-1 text-lg font-black text-right border-l-2 border-black">{dibayar ? fmt(dibayar).replace('Rp ', '') : '-'}</div>
            </div>
            <div className="flex border-2 border-black bg-gray-50">
              <div className="flex-1 px-4 py-1 text-xs font-bold uppercase tracking-tighter flex items-center">Sisa Pembayaran</div>
              <div className="flex-1 px-4 py-1 text-lg font-black text-right border-l-2 border-black">{kurang > 0 ? fmt(kurang).replace('Rp ', '') : 'LUNAS'}</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-around items-end mt-12 mb-8">
          <div className="text-center w-40">
            <p className="text-[14px] font-black uppercase mb-16 tracking-widest">Tanda Terima</p>
            <div className="border-b-2 border-dotted border-black"></div>
          </div>
          <div className="text-center w-40">
            <p className="text-[14px] font-black uppercase mb-16 tracking-widest">Hormat Kami</p>
            <div className="border-b-2 border-dotted border-black"></div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] text-gray-300 font-mono tracking-widest uppercase">
          Toko Track - Digital Invoice System
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;
