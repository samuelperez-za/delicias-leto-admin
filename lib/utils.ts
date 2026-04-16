import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ExpenseCategory } from '@/types/database'

// --- Formateo de fechas ---

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM yyyy", { locale: es })
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy')
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return format(date, 'MMMM yyyy', { locale: es })
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function currentWeekRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  }
}

export function currentMonthRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

// --- Labels de categoría ---

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  gas: 'Gas',
  transporte: 'Transporte',
  empaques: 'Empaques',
  servicios: 'Servicios',
  limpieza: 'Limpieza',
  otros: 'Otros',
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'gas',
  'transporte',
  'empaques',
  'servicios',
  'limpieza',
  'otros',
]

// --- CSV Export ---

export function exportToCSV(
  data: Record<string, string | number>[],
  filename: string
): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h]
        return typeof val === 'string' && val.includes(',')
          ? `"${val}"`
          : String(val)
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// --- Misc ---

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Convierte string numérico de formulario en número seguro */
export function safeNum(val: string | number): number {
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val
  return isNaN(n) ? 0 : n
}
