CREATE TABLE `holidays` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `holidays_date_key` ON `holidays` (`date`);--> statement-breakpoint
-- Calendário Nacif 2025–2026 (canvas da política de descanso remunerado) e 01/01/2027.
INSERT INTO `holidays` (`id`, `date`, `name`, `created_at`) VALUES
	('holiday-2025-03-03', '2025-03-03', 'Carnaval', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-03-04', '2025-03-04', 'Carnaval', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-04-18', '2025-04-18', 'Paixão de Cristo', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-04-21', '2025-04-21', 'Tiradentes', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-05-01', '2025-05-01', 'Dia do Trabalhador', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-11-20', '2025-11-20', 'Dia da Consciência Negra', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-12-25', '2025-12-25', 'Natal', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-12-29', '2025-12-29', 'Recesso Nacif', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-12-30', '2025-12-30', 'Recesso Nacif', '2026-11-20T00:00:00.000Z'),
	('holiday-2025-12-31', '2025-12-31', 'Recesso Nacif', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-01-01', '2026-01-01', 'Confraternização Universal', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-01-02', '2026-01-02', 'Recesso Nacif', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-02-16', '2026-02-16', 'Carnaval', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-02-17', '2026-02-17', 'Carnaval', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-04-03', '2026-04-03', 'Paixão de Cristo', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-04-21', '2026-04-21', 'Tiradentes', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-05-01', '2026-05-01', 'Dia do Trabalhador', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-06-04', '2026-06-04', 'Corpus Christi', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-09-07', '2026-09-07', 'Independência do Brasil', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-10-12', '2026-10-12', 'Nossa Senhora Aparecida', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-11-02', '2026-11-02', 'Finados', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-11-15', '2026-11-15', 'Proclamação da República', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-11-20', '2026-11-20', 'Dia da Consciência Negra', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-12-25', '2026-12-25', 'Natal', '2026-11-20T00:00:00.000Z'),
	('holiday-2026-12-31', '2026-12-31', 'Descanso Nacif', '2026-11-20T00:00:00.000Z'),
	('holiday-2027-01-01', '2027-01-01', 'Confraternização Universal', '2026-11-20T00:00:00.000Z');
