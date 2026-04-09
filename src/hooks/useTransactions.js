import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LS_KEY = 'toko_transactions_v2'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export function useTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const useSupabase = !!supabase

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (useSupabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) { setError(error.message); setLoading(false); return }
      setTransactions(data || [])
    } else {
      setTransactions(loadLocal())
    }
    setLoading(false)
  }, [useSupabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addTransaction = async (item) => {
    // Ensure all fields have defaults
    const payload = {
      nama: item.nama,
      tanggal: item.tanggal,
      jumlah: item.jumlah,
      modal: item.modal,
      jual: item.jual,
      kategori: item.kategori || 'Lainnya',
      catatan: item.catatan || '',
      nama_pembeli: item.nama_pembeli || '',
      status_pesanan: item.status_pesanan || 'Lunas',
      deadline: item.deadline || null,
      bahan_model: item.bahan_model || '',
      jenis: item.jenis || '',
      batch_id: item.batch_id || '',
      modal_lain: item.modal_lain || '',
      modal_lain_nominal: item.modal_lain_nominal || 0,
      uang_dibayarkan: item.uang_dibayarkan || 0,
    }

    if (useSupabase) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select()
        .single()
      if (error) throw new Error(error.message)
      setTransactions(prev => [data, ...prev])
      return data
    } else {
      const newItem = { ...payload, id: Date.now().toString(), created_at: new Date().toISOString() }
      const updated = [newItem, ...loadLocal()]
      saveLocal(updated)
      setTransactions(updated)
      return newItem
    }
  }

  const deleteTransaction = async (id, batchId) => {
    if (useSupabase) {
      const query = supabase.from('transactions').delete()
      if (batchId) {
        query.eq('batch_id', batchId)
      } else {
        query.eq('id', id)
      }
      const { error } = await query
      if (error) throw new Error(error.message)
    } else {
      const updated = loadLocal().filter(d => batchId ? d.batch_id !== batchId : d.id !== id)
      saveLocal(updated)
    }
    setTransactions(prev => prev.filter(d => batchId ? d.batch_id !== batchId : d.id !== id))
  }

  const deleteAll = async () => {
    if (useSupabase) {
      const { error } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw new Error(error.message)
    } else {
      saveLocal([])
    }
    setTransactions([])
  }

  const updateTransaction = async (id, updates) => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      setTransactions(prev => prev.map(d => d.id === id ? data : d))
      return data
    } else {
      const all = loadLocal()
      const updated = all.map(d => d.id === id ? { ...d, ...updates } : d)
      saveLocal(updated)
      setTransactions(updated)
      return updated.find(d => d.id === id)
    }
  }

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction, deleteAll, refetch: fetchAll, useSupabase }
}
