// ============================================================
// Tipos TypeScript para el schema de Supabase — Delicias Leto
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// --- Configuración del negocio ---
export interface BusinessSettings {
  id: string
  business_name: string
  primary_color: string
  partners_count: number
  worker_1_name: string
  worker_2_name: string
  created_at: string
  updated_at: string
}

// --- Ventas diarias ---
export interface DailySales {
  id: string
  date: string                  // ISO date: 'YYYY-MM-DD'
  sales_salchipapas: number
  sales_hamburguesas: number
  sales_picadas: number
  sales_gaseosas: number
  total_sales: number
  extra_expenses_day: number
  notes: string | null
  created_at: string
  updated_at: string
}

// --- Surtidos ---
export interface Supply {
  id: string
  date: string
  amount: number
  description: string
  supplier: string | null
  created_at: string
  updated_at: string
}

// --- Gastos extras ---
export type ExpenseCategory =
  | 'gas'
  | 'transporte'
  | 'empaques'
  | 'servicios'
  | 'limpieza'
  | 'otros'

export interface ExtraExpense {
  id: string
  date: string
  category: ExpenseCategory
  amount: number
  description: string
  created_at: string
  updated_at: string
}

// --- Nómina semanal ---
export interface WeeklyPayroll {
  id: string
  week_start: string
  week_end: string
  worker_1_name: string
  worker_1_payment: number
  worker_2_name: string
  worker_2_payment: number
  total_payroll: number
  notes: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Tipos para cálculos de lógica de negocio
// ============================================================

export interface WeeklySummary {
  week_start: string
  week_end: string
  total_sales: number
  total_supplies: number
  total_extra_expenses: number
  total_payroll: number
  weekly_utility: number
  partner_gain: number
  partners_count: number
}

export interface MonthlySummary {
  year: number
  month: number
  total_sales: number
  total_supplies: number
  total_extra_expenses: number
  total_payroll: number
  monthly_utility: number
  partner_gain: number
  partners_count: number
}

export interface DailyCashSummary {
  date: string
  total_sales: number
  supplies_that_day: number
  extra_expenses_day: number
  net_cash: number // ventas - surtido - gastos extras
}

// ============================================================
// Tipos para alertas
// ============================================================

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface BusinessAlert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
}

// ============================================================
// Tipos de formularios
// ============================================================

export type DailySalesFormData = Omit<DailySales, 'id' | 'created_at' | 'updated_at'>
export type SupplyFormData = Omit<Supply, 'id' | 'created_at' | 'updated_at'>
export type ExtraExpenseFormData = Omit<ExtraExpense, 'id' | 'created_at' | 'updated_at'>
export type WeeklyPayrollFormData = Omit<WeeklyPayroll, 'id' | 'created_at' | 'updated_at'>
export type BusinessSettingsFormData = Omit<BusinessSettings, 'id' | 'created_at' | 'updated_at'>

// ============================================================
// Tipos de Database para Supabase client tipado
// ============================================================

export interface Database {
  public: {
    Tables: {
      business_settings: {
        Row: BusinessSettings
        Insert: Omit<BusinessSettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BusinessSettings, 'id' | 'created_at' | 'updated_at'>>
      }
      daily_sales: {
        Row: DailySales
        Insert: Omit<DailySales, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DailySales, 'id' | 'created_at' | 'updated_at'>>
      }
      supplies: {
        Row: Supply
        Insert: Omit<Supply, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Supply, 'id' | 'created_at' | 'updated_at'>>
      }
      extra_expenses: {
        Row: ExtraExpense
        Insert: Omit<ExtraExpense, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ExtraExpense, 'id' | 'created_at' | 'updated_at'>>
      }
      weekly_payroll: {
        Row: WeeklyPayroll
        Insert: Omit<WeeklyPayroll, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WeeklyPayroll, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
