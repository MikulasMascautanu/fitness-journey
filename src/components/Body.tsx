import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
	ageOn,
	bodyFat,
	formatDate,
	inRange,
	isValidDate,
	localDate,
} from "../lib/calculations";
import { errorMessage, useData } from "../lib/data";
import { measurements, type BodyEntry, type Measurement } from "../lib/types";
import { LineChart } from "./Charts";
import { CycleLog } from "./CycleLog";
import { Field, Notice } from "./Fields";
import { Icon } from "./Icon";

const metrics = [
	{ key: "weight_kg", label: "Weight", unit: "kg" },
	{ key: "body_fat_pct", label: "Body fat", unit: "%" },
	...measurements.map((key) => ({
		key,
		label: key[0].toUpperCase() + key.slice(1),
		unit: "cm",
	})),
] as const;
type Metric = "weight_kg" | "body_fat_pct" | Measurement;
type Draft = Record<
	| "weight_kg"
	| Measurement
	| "skinfold_1_mm"
	| "skinfold_2_mm"
	| "skinfold_3_mm",
	string
>;
const inputs = [
	"weight_kg",
	...measurements,
	"skinfold_1_mm",
	"skinfold_2_mm",
	"skinfold_3_mm",
] as const;
function draftFor(entry?: BodyEntry): Draft {
	return Object.fromEntries(
		inputs.map((key) => [key, entry?.[key]?.toString() ?? ""]),
	) as Draft;
}
export const signed = (value: number, digits = 1) =>
	`${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}`;

export function Body({ syncStatus }: { syncStatus: ReactNode }) {
	const { body, cycles, profile, accountId, saveBody } = useData();
	const [metric, setMetric] = useState<Metric>("weight_kg");
	const [showCycles, setShowCycles] = useState(false);
	const [date, setDate] = useState(localDate());
	const [draft, setDraft] = useState(() =>
		draftFor(body.find((x) => x.date === localDate())),
	);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState("");
	const [busy, setBusy] = useState(false);
	const [all, setAll] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);
	const latest = body[0],
		first = body.at(-1),
		latestFat = body.find((x) => x.body_fat_pct !== null);
	const selected = metrics.find((m) => m.key === metric)!;
	const points = body
		.filter((entry) => entry[metric] !== null)
		.map((entry) => ({ date: entry.date, value: entry[metric]! }));
	const existing = body.find((entry) => entry.date === date);
	const skinfolds = [
		draft.skinfold_1_mm,
		draft.skinfold_2_mm,
		draft.skinfold_3_mm,
	];
	const hasSkinfolds = skinfolds.some(Boolean);
	let estimate: number | null = null,
		estimateError = "";
	if (skinfolds.every(Boolean)) {
		try {
			estimate = bodyFat(
				profile!.sex,
				ageOn(profile!.birthdate, date),
				skinfolds.map(Number),
			);
		} catch (error) {
			estimateError = errorMessage(error);
		}
	}
	const sites =
		profile!.sex === "m"
			? ["Chest", "Abdomen", "Thigh"]
			: ["Triceps", "Suprailiac", "Thigh"];
	function changeDate(value: string) {
		setDate(value);
		setDraft(draftFor(body.find((x) => x.date === value)));
		setError("");
		setSaved("");
	}
	function update(key: keyof Draft, value: string) {
		setDraft((current) => ({ ...current, [key]: value }));
		setSaved("");
	}
	function edit(entry: BodyEntry) {
		changeDate(entry.date);
		formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		formRef.current
			?.querySelector<HTMLInputElement>('[name="weight"]')
			?.focus({ preventScroll: true });
	}
	async function submit(event: FormEvent) {
		event.preventDefault();
		setError("");
		setSaved("");
		setBusy(true);
		try {
			if (!isValidDate(date) || date > localDate())
				throw new Error("Choose today or an earlier date.");
			if (date < profile!.birthdate)
				throw new Error("The entry date must be after your birthdate.");
			if (hasSkinfolds && !skinfolds.every(Boolean))
				throw new Error("Enter all three skinfolds, or leave all three empty.");
			if (estimateError) throw new Error(estimateError);
			const optional = Object.fromEntries(
				measurements.map((key) => [
					key,
					draft[key] === ""
						? null
						: inRange(Number(draft[key]), 0.1, 300, `${key} (cm)`),
				]),
			) as Record<Measurement, number | null>;
			const entry: BodyEntry = {
				id: existing?.id ?? crypto.randomUUID(),
				account_id: accountId,
				date,
				weight_kg: inRange(Number(draft.weight_kg), 25, 400, "Weight (kg)"),
				...optional,
				skinfold_1_mm: skinfolds[0] ? Number(skinfolds[0]) : null,
				skinfold_2_mm: skinfolds[1] ? Number(skinfolds[1]) : null,
				skinfold_3_mm: skinfolds[2] ? Number(skinfolds[2]) : null,
				body_fat_pct: estimate,
			};
			await saveBody(entry);
			setSaved(
				`${existing ? "Updated" : "Saved"} your entry for ${formatDate(date)}.`,
			);
		} catch (error) {
			setError(errorMessage(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<>
			<div className="page-heading">
				<div>
					<h1>Body</h1>
				</div>
				<div className="heading-actions">
					{syncStatus}
					<span className="heading-icon">
						<Icon name="body" size={26} />
					</span>
				</div>
			</div>
			<section className="card summary-card" aria-label="Body summary">
				<div className="summary-primary">
					<span className="stat-label summary-label">Current weight</span>
					<div className="big-number">
						{latest?.weight_kg.toFixed(1) ?? "—"}
						<span>kg</span>
					</div>
					<span className="stat-caption">
						{latest
							? `Last logged ${formatDate(latest.date)}`
							: "Your starting point is one entry away"}
					</span>
				</div>
				<div className="summary-secondary">
					<div>
						<span className="stat-label">Since you started</span>
						<div className="medium-number">
							{latest && first ? signed(latest.weight_kg - first.weight_kg) : "—"}{" "}
							<small>kg</small>
						</div>
						<span className="stat-caption">
							{first ? `Since ${formatDate(first.date)}` : "Build your own baseline"}
						</span>
					</div>
					<div>
						<span className="stat-label">Body fat</span>
						<div className="medium-number">
							{latestFat?.body_fat_pct?.toFixed(1) ?? "—"} <small>%</small>
						</div>
						<span className="stat-caption">
							{latestFat
								? `Estimated ${formatDate(latestFat.date)}`
								: "Add caliper readings"}
						</span>
					</div>
				</div>
			</section>
			<section className="card chart-card">
				<div className="card-heading">
					<h2>Progress over time</h2>
					<span className="badge">All time</span>
				</div>
				<div className="metric-switcher" role="group" aria-label="Chart metric">
					{metrics.map((m) => (
						<button
							key={m.key}
							aria-pressed={metric === m.key}
							onClick={() => setMetric(m.key)}
						>
							{m.label}
						</button>
					))}
				</div>
				{profile!.sex === "f" && metric === "weight_kg" && (
					<label className="cycle-toggle">
						<input
							type="checkbox"
							checked={showCycles}
							onChange={(event) => setShowCycles(event.target.checked)}
						/>
						Show period days on chart
					</label>
				)}
				<LineChart
					points={points}
					label={selected.label}
					unit={selected.unit}
					periods={
						profile!.sex === "f" && metric === "weight_kg" && showCycles ? cycles : []
					}
				/>
				<div className="chart-caption">
					<span>
						<i className="legend-dot" />
						{selected.label} ({selected.unit})
					</span>
					<span>
						{points.length} {points.length === 1 ? "entry" : "entries"}
					</span>
				</div>
				{profile!.sex === "f" && metric === "weight_kg" && showCycles && (
					<p className="cycle-legend">
						<i />
						Shaded areas show logged period days. Unlogged days have no cycle shading.
					</p>
				)}
			</section>
			<section className="card">
				<div className="card-heading">
					<h2>{existing ? "Update your entry" : "Log an entry"}</h2>
				</div>
				<form onSubmit={submit} ref={formRef} className="entry-form">
					<div className="form-grid">
						<Field
							label="Date"
							type="date"
							required
							max={localDate()}
							min={profile!.birthdate}
							value={date}
							onChange={(e) => changeDate(e.target.value)}
						/>
						<Field
							label="Weight"
							name="weight"
							unit="kg"
							type="number"
							inputMode="decimal"
							min="25"
							max="400"
							step="0.1"
							required
							value={draft.weight_kg}
							placeholder="e.g. 86.5"
							onChange={(e) => update("weight_kg", e.target.value)}
						/>
					</div>
					<div className="form-section">
						<h3>
							Measurements <span>Optional · cm</span>
						</h3>
						<div className="form-grid three">
							{measurements.map((key) => (
								<Field
									key={key}
									label={key[0].toUpperCase() + key.slice(1)}
									unit="cm"
									type="number"
									inputMode="decimal"
									min="0.1"
									max="300"
									step="0.1"
									placeholder="—"
									value={draft[key]}
									onChange={(e) => update(key, e.target.value)}
								/>
							))}
						</div>
					</div>
					<div className="form-section">
						<h3>
							Skinfold readings <span>Optional · mm</span>
						</h3>
						<div className="form-grid three">
							{sites.map((site, i) => {
								const key = `skinfold_${i + 1}_mm` as keyof Draft;
								return (
									<Field
										key={key}
										label={site}
										unit="mm"
										type="number"
										inputMode="decimal"
										min="1"
										max="100"
										step="0.1"
										placeholder="—"
										value={draft[key]}
										onChange={(e) => update(key, e.target.value)}
									/>
								);
							})}
						</div>
						<div className="estimate" aria-live="polite">
							<div>
								<strong>Estimated body fat</strong>
								<span>
									{estimateError ||
										(hasSkinfolds && estimate === null
											? "Add all three readings to calculate."
											: "Jackson–Pollock 3-site · Siri equation")}
								</span>
							</div>
							<span className="estimate-value">
								{estimate?.toFixed(1) ?? "—"}
								<small>%</small>
							</span>
						</div>
					</div>
					{error && <Notice error>{error}</Notice>}
					{saved && <Notice>{saved}</Notice>}
					<div className="form-footer">
						<span className="muted">
							{"Saving replaces the entry for this date."}
						</span>
						<button className="button primary" disabled={busy}>
							<Icon name={existing ? "check" : "plus"} size={16} />
							{busy ? "Saving…" : existing ? "Update entry" : "Save entry"}
						</button>
					</div>
				</form>
			</section>
			<section className="card history-card">
				<div className="card-heading">
					<h2>Recent entries</h2>
					<span className="subtle-label">{body.length} total</span>
				</div>
				{body.length ? (
					<>
						<div className="table-scroll">
							<table>
								<caption className="sr-only">Body entries, most recent first</caption>
								<thead>
									<tr>
										<th>Date</th>
										<th>Weight</th>
										<th>Body fat</th>
										<th>Waist</th>
										<th>
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{(all ? body : body.slice(0, 7)).map((entry) => (
										<tr key={entry.date}>
											<th scope="row">{formatDate(entry.date, true)}</th>
											<td>
												{entry.weight_kg.toFixed(1)} <span>kg</span>
											</td>
											<td>
												{entry.body_fat_pct === null
													? "—"
													: `${entry.body_fat_pct.toFixed(1)}%`}
											</td>
											<td>{entry.waist === null ? "—" : `${entry.waist} cm`}</td>
											<td>
												<button
													className="text-button"
													aria-label={`Edit body entry for ${formatDate(entry.date, true)}`}
													onClick={() => edit(entry)}
												>
													Edit
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{body.length > 7 && (
							<button
								className="text-button history-more"
								onClick={() => setAll(!all)}
							>
								{all ? "Show recent entries" : `View all ${body.length} entries`}{" "}
								<span aria-hidden="true">↗</span>
							</button>
						)}
					</>
				) : (
					<p className="empty-history">
						Your entries will appear here. Start with today.
					</p>
				)}
			</section>
			{profile!.sex === "f" && <CycleLog />}
		</>
	);
}
