import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LS_KEY = 'toko_progress_steps'
const DEFAULT_STEPS = [
  { id: '1', name: 'DP', urutan: 1 },
  { id: '2', name: 'Desain', urutan: 2 },
  { id: '3', name: 'Layout', urutan: 3 },
  { id: '4', name: 'Cetak', urutan: 4 },
  { id: '5', name: 'Cutting', urutan: 5 },
  { id: '6', name: 'Jahit', urutan: 6 },
  { id: '7', name: 'Packing', urutan: 7 }
]

function loadLocal() {
  try { 
    const stored = localStorage.getItem(LS_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_STEPS
  } catch { 
    return DEFAULT_STEPS 
  }
}

function saveLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export function useProgressSteps(profile) {
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const useSupabase = !!supabase

  const fetchAll = useCallback(async () => {
    if (useSupabase && !profile) {
      setSteps([])
      setLoading(false)
      return
    }
    setLoading(true)
    if (useSupabase) {
      const { data, error } = await supabase
        .from('progress_steps')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('urutan', { ascending: true })
      
      if (!error && data) {
        // Jika kosong di database, mungkin belum diset, bisa dikasih default?
        // Untuk sekarang biarkan kosong jika memang tidak ada.
        setSteps(data)
      } else {
        setSteps([])
      }
    } else {
      setSteps(loadLocal().sort((a, b) => a.urutan - b.urutan))
    }
    setLoading(false)
  }, [useSupabase, profile])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addStep = async (name) => {
    const nextUrutan = steps.length > 0 ? Math.max(...steps.map(s => s.urutan)) + 1 : 1
    const payload = {
      name,
      urutan: nextUrutan,
      store_id: profile?.store_id || null
    }

    if (useSupabase) {
      const { data, error } = await supabase
        .from('progress_steps')
        .insert([payload])
        .select()
        .single()
      if (error) throw new Error(error.message)
      setSteps(prev => [...prev, data])
      return data
    } else {
      const newItem = { ...payload, id: Date.now().toString() }
      const updated = [...steps, newItem]
      saveLocal(updated)
      setSteps(updated)
      return newItem
    }
  }

  const updateStep = async (id, name) => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('progress_steps')
        .update({ name })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      setSteps(prev => prev.map(s => s.id === id ? data : s))
    } else {
      const updated = steps.map(s => s.id === id ? { ...s, name } : s)
      saveLocal(updated)
      setSteps(updated)
    }
  }

  const deleteStep = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('progress_steps').delete().eq('id', id)
      if (error) throw new Error(error.message)
      setSteps(prev => prev.filter(s => s.id !== id))
    } else {
      const updated = steps.filter(s => s.id !== id)
      saveLocal(updated)
      setSteps(updated)
    }
  }

  const reorderSteps = async (newOrderedSteps) => {
    // newOrderedSteps is an array of steps in the new order
    const updatedWithOrder = newOrderedSteps.map((s, index) => ({ ...s, urutan: index + 1 }))
    
    // Update local state optimistically
    setSteps(updatedWithOrder)

    if (useSupabase) {
      // Supabase doesn't have bulk update natively without a function, so we loop
      for (const step of updatedWithOrder) {
        await supabase.from('progress_steps').update({ urutan: step.urutan }).eq('id', step.id)
      }
    } else {
      saveLocal(updatedWithOrder)
    }
  }

  return { steps, loading, addStep, updateStep, deleteStep, reorderSteps }
}
