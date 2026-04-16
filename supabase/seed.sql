-- ============================================================
-- Delicias Leto Admin — Seed Data (Datos de Prueba)
-- Ejecutar DESPUÉS de schema.sql
-- Simula 3 semanas de operación realista
-- ============================================================

-- Configuración inicial
insert into public.business_settings (business_name, primary_color, partners_count, worker_1_name, worker_2_name)
values ('Delicias Leto', '#16a34a', 2, 'Carlos Pérez', 'Ana Gómez')
on conflict do nothing;

-- ============================================================
-- VENTAS DIARIAS — 18 días
-- Semana 1: Lun 7 Abr — Dom 13 Abr 2025
-- ============================================================
insert into public.daily_sales (date, sales_salchipapas, sales_hamburguesas, sales_picadas, sales_gaseosas, extra_expenses_day, notes)
values
  ('2025-04-07', 85000,  60000, 45000, 28000, 0,      'Lunes normal'),
  ('2025-04-08', 92000,  75000, 52000, 31000, 5000,   'Gasto empaques'),
  ('2025-04-09', 78000,  65000, 38000, 25000, 0,      null),
  ('2025-04-10', 110000, 88000, 65000, 40000, 0,      'Jueves ocupado'),
  ('2025-04-11', 125000, 102000, 78000, 48000, 8000,  'Viernes muy activo'),
  ('2025-04-12', 148000, 118000, 95000, 58000, 0,     'Sábado pico'),
  ('2025-04-13', 98000,  82000, 60000, 38000, 0,      'Domingo normal'),

-- Semana 2: Lun 14 Abr — Dom 20 Abr 2025
  ('2025-04-14', 80000,  62000, 42000, 26000, 0,      null),
  ('2025-04-15', 88000,  70000, 48000, 30000, 12000,  'Gas del mes'),
  ('2025-04-16', 72000,  58000, 35000, 22000, 0,      'Día flojo'),
  ('2025-04-17', 105000, 85000, 62000, 38000, 0,      null),
  ('2025-04-18', 118000, 95000, 72000, 45000, 6000,   'Viernes bien'),
  ('2025-04-19', 140000, 110000, 88000, 55000, 0,     'Sábado excelente'),
  ('2025-04-20', 95000,  78000, 55000, 35000, 0,      null),

-- Semana 3: Lun 21 Abr — Dom 27 Abr 2025
  ('2025-04-21', 88000,  68000, 45000, 28000, 10000,  'Transporte frutas'),
  ('2025-04-22', 94000,  75000, 52000, 32000, 0,      null),
  ('2025-04-23', 82000,  65000, 40000, 26000, 0,      null),
  ('2025-04-24', 115000, 90000, 68000, 42000, 0,      'Jueves festival cercano');

-- ============================================================
-- SURTIDOS — 8 registros en 3 semanas
-- ============================================================
insert into public.supplies (date, amount, description, supplier)
values
  ('2025-04-07', 180000, 'Papas, salchichas, aceite, empaques',        'Distribuciones Central'),
  ('2025-04-09', 95000,  'Carnes para hamburguesas, salsas',           'Carnes El Buen Sabor'),
  ('2025-04-11', 45000,  'Gaseosas y bebidas',                         'Postobón'),
  ('2025-04-14', 165000, 'Papas, salchichas, condimentos, empaques',   'Distribuciones Central'),
  ('2025-04-16', 80000,  'Carnes, quesos, vegetales',                  'Carnes El Buen Sabor'),
  ('2025-04-18', 50000,  'Gaseosas, agua, jugos',                      'Postobón'),
  ('2025-04-21', 190000, 'Surtido grande semana - todo lo necesario',  'Distribuciones Central'),
  ('2025-04-23', 75000,  'Carnes y empaques complemento',              'Carnes El Buen Sabor');

-- ============================================================
-- GASTOS EXTRAS — 12 registros
-- ============================================================
insert into public.extra_expenses (date, category, amount, description)
values
  ('2025-04-07', 'gas',        35000,  'Recarga cilindro de gas'),
  ('2025-04-08', 'empaques',   18000,  'Cajas y bolsas adicionales'),
  ('2025-04-10', 'limpieza',   12000,  'Productos limpieza cocina'),
  ('2025-04-11', 'transporte', 15000,  'Transporte surtido extra'),
  ('2025-04-14', 'servicios',  45000,  'Pago agua y luz quincenal'),
  ('2025-04-15', 'gas',        35000,  'Recarga cilindro de gas'),
  ('2025-04-17', 'empaques',   22000,  'Empaques biodegradables'),
  ('2025-04-18', 'transporte', 12000,  'Transporte ingredientes'),
  ('2025-04-21', 'transporte', 18000,  'Transporte semana 3'),
  ('2025-04-22', 'gas',        35000,  'Gas cocina'),
  ('2025-04-23', 'limpieza',   14000,  'Limpieza y desinfección'),
  ('2025-04-24', 'empaques',   20000,  'Empaques semana festiva');

-- ============================================================
-- NÓMINA SEMANAL — 3 semanas
-- ============================================================
insert into public.weekly_payroll (week_start, week_end, worker_1_name, worker_1_payment, worker_2_name, worker_2_payment, notes)
values
  ('2025-04-07', '2025-04-13', 'Carlos Pérez', 120000, 'Ana Gómez', 120000, 'Semana 1 - normal'),
  ('2025-04-14', '2025-04-20', 'Carlos Pérez', 120000, 'Ana Gómez', 120000, 'Semana 2 - pago regular'),
  ('2025-04-21', '2025-04-27', 'Carlos Pérez', 130000, 'Ana Gómez', 130000, 'Semana 3 - bonificación por festivo');
