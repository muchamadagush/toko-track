import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LS_KEY = 'toko_categories_v1'
const DEFAULT_CATEGORIES = [
  'Makanan & Minuman', 'Sembako', 'Elektronik', 'Pakaian & Tekstil',
  'Kosmetik & Perawatan', 'Peralatan Rumah', 'Alat Tulis & Kantor',
  'Obat-obatan', 'Lainnya'
]

function loadLocal() {
  try {
    const data = localStorage.getItem(LS_KEY)
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES.map(name => ({ id: name, name }))
  } catch {
    return DEFAULT_CATEGORIES.map(name => ({ id: name, name }))
  }
}

function saveLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export function useCategories(profile) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const useSupabase = !!supabase

  const fetchAll = useCallback(async () => {
    if (useSupabase && !profile) {
      setCategories([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    if (useSupabase) {
      const query = supabase
        .from('categories_view')
        .select('*')
      
      if (profile?.store_id) {
        query.eq('store_id', profile.store_id)
      }
      
      const { data, error } = await query
        .order('name', { ascending: true })
        
      if (error) { setError(error.message); setLoading(false); return }
      setCategories(data || [])
    } else {
      setCategories(loadLocal())
    }
    setLoading(false)
  }, [useSupabase, profile])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addCategory = async (name, modal = 0, modal_lain = '', modal_lain_nominal = 0) => {
    if (useSupabase) {
      const payload = {
        name,
        store_id: profile?.store_id || null,
        modal: parseFloat(modal) || 0,
        modal_lain: modal_lain || '',
        modal_lain_nominal: parseFloat(modal_lain_nominal) || 0
      }
      const { data, error } = await supabase
        .from('categories')
        .insert([payload])
        .select()
        .single()
      if (error) throw new Error(error.message)
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    } else {
      const newItem = { 
        id: Date.now().toString(), 
        name, 
        modal: parseFloat(modal) || 0, 
        modal_lain: modal_lain || '', 
        modal_lain_nominal: parseFloat(modal_lain_nominal) || 0 
      }
      const updated = [...loadLocal(), newItem].sort((a, b) => a.name.localeCompare(b.name))
      saveLocal(updated)
      setCategories(updated)
      return newItem
    }
  }


  const updateCategory = async (id, name, modal = 0, modal_lain = '', modal_lain_nominal = 0) => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('categories')
        .update({ 
          name, 
          modal: parseFloat(modal) || 0, 
          modal_lain: modal_lain || '', 
          modal_lain_nominal: parseFloat(modal_lain_nominal) || 0 
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      setCategories(prev => prev.map(c => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name)))
      return data
    } else {
      const updated = loadLocal().map(c => c.id === id ? { 
        ...c, 
        name, 
        modal: parseFloat(modal) || 0, 
        modal_lain: modal_lain || '', 
        modal_lain_nominal: parseFloat(modal_lain_nominal) || 0 
      } : c).sort((a, b) => a.name.localeCompare(b.name))
      saveLocal(updated)
      setCategories(updated)
      return updated.find(c => c.id === id)
    }
  }

  const deleteCategory = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw new Error(error.message)
    } else {
      const updated = loadLocal().filter(c => c.id !== id)
      saveLocal(updated)
    }
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return { categories, loading, error, addCategory, updateCategory, deleteCategory, refetch: fetchAll }
}
