const API_BASE = ''

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  getConversations: (params?: { status?: string; search?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return fetchAPI<any[]>(`/api/conversations${qs ? '?' + qs : ''}`)
  },
  getConversation: (id: string) => fetchAPI<any>(`/api/conversations/${id}`),
  getMessages: (id: string) => fetchAPI<any[]>(`/api/conversations/${id}/messages`),
  sendMessage: (id: string, text: string, pauseAi = false) =>
    fetchAPI<any>(`/api/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, pause_ai: pauseAi }),
    }),
  takeover: (id: string) =>
    fetchAPI<any>(`/api/conversations/${id}/takeover`, { method: 'POST' }),
  releaseToAI: (id: string) =>
    fetchAPI<any>(`/api/conversations/${id}/release-to-ai`, { method: 'POST' }),
  pauseAI: (id: string) =>
    fetchAPI<any>(`/api/conversations/${id}/pause-ai`, { method: 'POST' }),
  activateAI: (id: string) =>
    fetchAPI<any>(`/api/conversations/${id}/activate-ai`, { method: 'POST' }),
  markRead: (id: string) =>
    fetchAPI<any>(`/api/conversations/${id}/mark-read`, { method: 'POST' }),
  updateNotes: (id: string, notes: string) =>
    fetchAPI<any>(`/api/conversations/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ internal_notes: notes }),
    }),
  getDashboard: () => fetchAPI<any>('/api/dashboard'),
  getLogs: (params?: { origin?: string; status?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return fetchAPI<any[]>(`/api/logs${qs ? '?' + qs : ''}`)
  },
  getLeads: (params?: { status?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return fetchAPI<any[]>(`/api/leads${qs ? '?' + qs : ''}`)
  },
  updateLead: (id: string, data: Record<string, unknown>) =>
    fetchAPI<any>(`/api/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteLead: (id: string) =>
    fetchAPI<any>(`/api/leads/${id}`, { method: 'DELETE' }),
  updateFunnelStage: (convId: string, stage: string, motivo = '') =>
    fetchAPI<any>(`/api/conversations/${convId}/funnel`, {
      method: 'PATCH',
      body: JSON.stringify({ funnel_stage: stage, motivo }),
    }),
  getTravelBudget: (convId: string) =>
    fetchAPI<any>(`/api/conversations/${convId}/travel-budget`),
  getTasks: (convId: string) =>
    fetchAPI<any[]>(`/api/conversations/${convId}/tasks`),
  updateTask: (taskId: string, data: { status?: string; title?: string }) =>
    fetchAPI<any>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getAlerts: (status?: string) => {
    const qs = status ? `?status=${status}` : ''
    return fetchAPI<any[]>(`/api/alerts${qs}`)
  },
  dismissAlert: (id: string) =>
    fetchAPI<any>(`/api/alerts/${id}/dismiss`, { method: 'POST' }),
  sendFollowup: (id: string) =>
    fetchAPI<any>(`/api/alerts/${id}/send-followup`, { method: 'POST' }),
  getDailyReport: () =>
    fetchAPI<any>('/api/daily-report/latest'),
}
