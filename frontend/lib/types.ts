export type ConversationStatus = 'ia_activa' | 'humano_activo' | 'esperando_humano' | 'cerrada'
export type MessageDirection = 'inbound' | 'outbound'
export type SenderType = 'customer' | 'ai' | 'human' | 'system'
export type MessageStatus = 'received' | 'sent' | 'delivered' | 'read' | 'failed'
export type MessageType = 'text' | 'image' | 'audio' | 'document' | 'location' | 'unsupported'
export type LogOrigin = 'whatsapp' | 'agent' | 'human' | 'system'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export type FunnelStage =
  | 'nuevo_lead' | 'calificando_viaje' | 'interesado'
  | 'presupuesto_en_armado' | 'presupuesto_enviado'
  | 'seguimiento' | 'ajustes_solicitados' | 'cierre'
  | 'reservado' | 'vendido' | 'pre_viaje'
  | 'viajando' | 'post_viaje' | 'perdido'

export interface Conversation {
  id: string
  whatsapp_phone: string
  whatsapp_profile_name: string | null
  customer_name: string | null
  source: string
  status: ConversationStatus
  ai_enabled: boolean
  funnel_stage: FunnelStage
  ai_summary: string | null
  next_action: string | null
  next_follow_up_at: string | null
  assigned_to: string | null
  priority: Priority
  unread_count: number
  last_message_preview: string | null
  last_message_at: string | null
  last_inbound_at: string | null
  last_outbound_at: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface TravelBudget {
  id: string
  conversation_id: string
  status: string
  origin: string | null
  destination: string | null
  secondary_destinations: string | null
  departure_date: string | null
  return_date: string | null
  date_flexibility: string | null
  nights: number | null
  adults: number | null
  children: number | null
  children_ages: string | null
  trip_type: string | null
  estimated_budget: number | null
  currency: string | null
  hotel_preference: string | null
  meal_plan: string | null
  baggage: string | null
  insurance: boolean | null
  transfers: boolean | null
  excursions: boolean | null
  notes: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  conversation_id: string
  type: string | null
  title: string
  due_at: string | null
  status: string
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  type: 'follow_up_overdue' | 'rate_expiring' | string
  conversation_id: string | null
  title: string
  detail: string | null
  status: 'pending' | 'actioned' | 'dismissed' | string
  created_at: string
  updated_at: string
}

export interface DailyReport {
  id: string
  report_date: string
  content: string | null
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  whatsapp_message_id: string | null
  direction: MessageDirection
  sender_type: SenderType
  message_type: MessageType
  text: string
  status: MessageStatus
  error_detail: string | null
  created_at: string
}

export interface LogEvent {
  id: string
  type: string
  origin: LogOrigin
  conversation_id: string | null
  detail: string | null
  status: 'success' | 'warning' | 'error'
  created_at: string
}

export interface DashboardStats {
  activeConversations: number
  waitingHuman: number
  messagesToday: number
  recentErrors: number
  whatsappStatus: 'connected' | 'pending' | 'error'
}

export type LeadStatus = 'draft' | 'cotizado' | 'confirmado' | 'cancelado'

export interface Lead {
  id: string
  conversation_id: string | null
  nombre: string
  telefono: string
  origen: string | null
  destino: string
  fecha_inicio: string | null
  noches: number | null
  pasajeros: number | null
  tipo_viaje: string | null
  resumen: string | null
  precio_base_usd: number | null
  gastos_admin_pct: number | null
  gastos_admin_usd: number | null
  total_usd: number | null
  status: LeadStatus
  created_at: string
  updated_at: string
}
