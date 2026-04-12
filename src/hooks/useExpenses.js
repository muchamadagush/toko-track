import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LS_KEY = 'toko_expenses_v1'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const useSupabase = !!supabase

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (useSupabase) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) { setError(error.message); setLoading(false); return }
      setExpenses(data || [])
    } else {
      setExpenses(loadLocal())
    }
    setLoading(false)
  }, [useSupabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addExpense = async (item) => {
    const payload = {
      tanggal: item.tanggal,
      nominal: parseFloat(item.nominal) || 0,
      keterangan: item.keterangan.trim(),
    }

    if (useSupabase) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([payload])
        .select()
        .single()
      if (error) throw new Error(error.message)
      setExpenses(prev => [data, ...prev])
      return data
    } else {
      const newItem = { ...payload, id: Date.now().toString(), created_at: new Date().toISOString() }
      const updated = [newItem, ...loadLocal()]
      saveLocal(updated)
      setExpenses(updated)
      return newItem
    }
  }

  const deleteExpense = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw new Error(error.message)
    } else {
      const updated = loadLocal().filter(d => d.id !== id)
      saveLocal(updated)
    }
    setExpenses(prev => prev.filter(d => d.id !== id))
  }

  const deleteAll = async () => {
    if (useSupabase) {
      const { error } = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw new Error(error.message)
    } else {
      saveLocal([])
    }
    setExpenses([])
  }

  const updateExpense = async (id, updates) => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      setExpenses(prev => prev.map(d => d.id === id ? data : d))
      return data
    } else {
      const all = loadLocal()
      const updated = all.map(d => d.id === id ? { ...d, ...updates } : d)
      saveLocal(updated)
      setExpenses(updated)
      return updated.find(d => d.id === id)
    }
  }

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense, deleteAll, refetch: fetchAll, useSupabase }
}
