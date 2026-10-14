import { useRef, useState, type FormEvent } from "react";
import { NavLink } from "react-router-dom";
import {
	activities,
	energy,
	formatDate,
	goalLabel,
	goals,
	inRange,
	isValidDate,
	localDate,
	nutrition,
	validateProfile,
} from "../lib/calculations";
import { errorMessage, useData } from "../lib/data";
import type { FoodDay, Profile } from "../lib/types";
import { CalorieChart } from "./Charts";
import { Field, Notice, SelectField } from "./Fields";
import { Icon } from "./Icon";
import { signed } from "./Body";

const foodInputs = [
	{ key: "kcal", label: "Calories", unit: "kcal", max: 20000 },
	{ key: "protein_g", label: "Protein", unit: "g", max: 2000 },
	{ key: "carbs_g", label: "Carbs", unit: "g", max: 3000 },
	{ key: "fat_g", label: "Fat", unit: "g", max: 2000 },
] as const;
type FoodDraft = Record<(typeof foodInputs)[number]["key"], string>;
function draftFor(entry?: FoodDay): FoodDraft {
	return Object.fromEntries(
		foodInputs.map(({ key }) => [key, entry?.[key]?.toString() ?? ""]),
	) as FoodDraft;
}

export function Nutrition() {
	const { profile, body, food, saveFood, accountId } = useData();
	const [date, setDate] = useState(localDate());
	const [draft, setDraft] = useState(() =>
		draftFor(food.find((entry) => entry.date === localDate())),
	);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState("");
	const [busy, setBusy] = useState(false);
	const [all, setAll] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);
	const latestWeight = body[0]?.weight_kg;
	const existing = food.find((entry) => entry.date === date);
	let target: ReturnType<typeof nutrition> | undefined,
		targetError = "";
	if (latestWeight) {
		try {
			target = nutrition(profile!, latestWeight);
		} catch (error) {
			targetError = errorMessage(error);
		}
	}
	const macroEnergy =
		Number(draft.protein_g) * 4 +
		Number(draft.carbs_g) * 4 +
		Number(draft.fat_g) * 9;
	const mismatch =
		foodInputs.every(({ key }) => draft[key] !== "") &&
		Math.abs(macroEnergy - Number(draft.kcal)) >
			Math.max(100, Number(draft.kcal) * 0.05);

	function changeDate(value: string) {
		setDate(value);
		setDraft(draftFor(food.find((entry) => entry.date === value)));
		setSaved("");
		setError("");
	}
	function edit(entry: FoodDay) {
		changeDate(entry.date);
		formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		formRef.current
			?.querySelector<HTMLInputElement>('[name="kcal"]')
			?.focus({ preventScroll: true });
	}
	async function submit(event: FormEvent) {
		event.preventDefault();
		setError("");
		setSaved("");
		setBusy(true);
		try {
			if (!isValidDate(date) || date > localDate() || date < profile!.birthdate)
				throw new Error("Choose a valid date between your birthdate and today.");
			const values = Object.fromEntries(
				foodInputs.map(({ key, label, max }) => {
					if (draft[key] === "")
						throw new Error(
							`Enter ${label.toLowerCase()}, including zero if needed.`,
						);
					return [key, inRange(Number(draft[key]), 0, max, label)];
				}),
			) as Pick<FoodDay, "kcal" | "protein_g" | "carbs_g" | "fat_g">;
			await saveFood({
				id: existing?.id ?? crypto.randomUUID(),
				account_id: accountId,
				date,
				...values,
			});
			setSaved(
				`${existing ? "Updated" : "Saved"} your nutrition for ${formatDate(date)}.`,
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
					<p className="eyebrow">YOUR DAILY FUEL</p>
					<h1>Nutrition</h1>
				</div>
				<span className="heading-icon">
					<Icon name="nutrition" size={26} />
				</span>
			</div>
			<section className="card target-card" aria-label="Daily nutrition target">
				<div className="target-top">
					<div>
						<span className="stat-label">Daily target</span>
						<div className="big-number">
							{target ? Math.round(target.kcal).toLocaleString() : "—"}
							<span>kcal</span>
						</div>
						<span className="stat-caption">
							{target
								? goalLabel(profile!.goal_kg_per_week, target.tdee)
								: "Personalized to your profile and latest weight"}
						</span>
					</div>
					<div className="energy-stats">
						<div>
							<span className="stat-label">
								Maintenance <abbr title="Total daily energy expenditure">TDEE</abbr>
							</span>
							<strong>
								{target ? Math.round(target.tdee).toLocaleString() : "—"}{" "}
								<small>kcal</small>
							</strong>
						</div>
						<div>
							<span className="stat-label">
								Resting <abbr title="Basal metabolic rate">BMR</abbr>
							</span>
							<strong>
								{target ? Math.round(target.bmr).toLocaleString() : "—"}{" "}
								<small>kcal</small>
							</strong>
						</div>
					</div>
				</div>
				{target && (
					<>
						<div className="macro-bar" aria-hidden="true">
							<span
								className="protein"
								style={{ width: `${((target.protein * 4) / target.kcal) * 100}%` }}
							/>
							<span
								className="carbs"
								style={{ width: `${((target.carbs * 4) / target.kcal) * 100}%` }}
							/>
							<span className="fat" style={{ width: `${profile!.fat_pct}%` }} />
						</div>
						<div className="macro-grid">
							{[
								{ name: "Protein", key: "protein" },
								{ name: "Carbs", key: "carbs" },
								{ name: "Fat", key: "fat" },
							].map(({ name, key }) => (
								<div key={key}>
									<span className="stat-label">
										<i className={`macro-dot ${key}`} />
										{name}
									</span>
									<strong>
										{Math.round(target![key as "protein" | "carbs" | "fat"])}
										<small> g</small>
									</strong>
								</div>
							))}
						</div>
						<p className="target-basis">
							Based on {latestWeight} kg ·{" "}
							{activities
								.find((a) => a.value === profile!.activity)
								?.label.toLowerCase()}{" "}
							activity · Mifflin–St Jeor
						</p>
					</>
				)}
				{!latestWeight && (
					<Notice>
						<NavLink to="/">Log your first weight</NavLink> to calculate your daily
						calories and macros.
					</Notice>
				)}
				{targetError && (
					<Notice error>{targetError} Adjust your plan below.</Notice>
				)}
			</section>
			<PlanSettings
				key={JSON.stringify(profile)}
				profile={profile!}
				weight={latestWeight}
			/>
			<section className="card chart-card">
				<div className="card-heading">
					<h2>Daily calories</h2>
					<span className="badge">Last 14 days</span>
				</div>
				<CalorieChart entries={food} target={target?.kcal} />
				<div className="chart-caption">
					<span>
						<i className="legend-dot" />
						Logged calories <i className="legend-dash" />
						{target
							? `Target · ${Math.round(target.kcal).toLocaleString()} kcal`
							: "No target yet"}
					</span>
					<span>Above target shown lighter</span>
				</div>
				{!food.length && (
					<p className="form-note">
						Your daily entries will appear here. Dots mark days without an entry.
					</p>
				)}
			</section>
			<section className="card">
				<div className="card-heading">
					<h2>{existing ? "Update your daily log" : "Log your day"}</h2>
				</div>
				<form className="entry-form" ref={formRef} onSubmit={submit}>
					<div className="form-grid">
						<Field
							label="Date"
							type="date"
							value={date}
							required
							max={localDate()}
							min={profile!.birthdate}
							onChange={(e) => changeDate(e.target.value)}
						/>
						{foodInputs.map(({ key, label, unit, max }) => (
							<Field
								key={key}
								label={label}
								name={key}
								unit={unit}
								type="number"
								inputMode="decimal"
								min="0"
								max={max}
								step={key === "kcal" ? "1" : "0.1"}
								required
								placeholder="0"
								value={draft[key]}
								onChange={(e) => {
									setDraft((current) => ({ ...current, [key]: e.target.value }));
									setSaved("");
								}}
							/>
						))}
					</div>
					{mismatch && (
						<p className="form-note">
							These macros add up to {Math.round(macroEnergy).toLocaleString()} kcal.
							You can save your entered calorie total as-is.
						</p>
					)}
					{error && <Notice error>{error}</Notice>}
					{saved && <Notice>{saved}</Notice>}
					<div className="form-footer">
						<span className="muted">
							{existing
								? "Saving replaces the entry for this date."
								: "Nothing logged today."}
						</span>
						<button className="button primary" disabled={busy}>
							<Icon name={existing ? "check" : "plus"} size={16} />
							{busy ? "Saving…" : existing ? "Update day" : "Save day"}
						</button>
					</div>
				</form>
			</section>
			<section className="card history-card">
				<div className="card-heading">
					<h2>Recent entries</h2>
					<span className="subtle-label">Compared with your current target</span>
				</div>
				{food.length ? (
					<>
						<div className="table-scroll">
							<table>
								<caption className="sr-only">
									Daily nutrition, most recent first. P is protein, C is carbs, F is fat,
									in grams.
								</caption>
								<thead>
									<tr>
										<th>Date</th>
										<th>Calories</th>
										<th>
											P / C / F <span>(g)</span>
										</th>
										<th>vs. target</th>
										<th>
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{(all ? food : food.slice(0, 7)).map((entry) => (
										<tr key={entry.date}>
											<th scope="row">{formatDate(entry.date, true)}</th>
											<td>
												{entry.kcal.toLocaleString()} <span>kcal</span>
											</td>
											<td className="macro-cell">
												{entry.protein_g} / {entry.carbs_g} / {entry.fat_g}
											</td>
											<td>
												<span className="difference">
													{target ? `${signed(entry.kcal - target.kcal, 0)} kcal` : "—"}
												</span>
											</td>
											<td>
												<button
													className="text-button"
													aria-label={`Edit nutrition for ${formatDate(entry.date, true)}`}
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
						{food.length > 7 && (
							<button
								className="text-button history-more"
								onClick={() => setAll(!all)}
							>
								{all ? "Show recent entries" : `View all ${food.length} entries`}{" "}
								<span aria-hidden="true">↗</span>
							</button>
						)}
					</>
				) : (
					<p className="empty-history">
						One day at a time. Your nutrition history starts with your first log.
					</p>
				)}
			</section>
		</>
	);
}

function PlanSettings({
	profile,
	weight,
}: {
	profile: Profile;
	weight?: number;
}) {
	const { saveProfile } = useData();
	const [settings, setSettings] = useState(profile);
	const [protein, setProtein] = useState(String(profile.protein_g_per_kg));
	const [fat, setFat] = useState(String(profile.fat_pct));
	const draft = {
		...settings,
		protein_g_per_kg: protein === "" ? NaN : Number(protein),
		fat_pct: fat === "" ? NaN : Number(fat),
	};
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const changed = JSON.stringify(draft) !== JSON.stringify(profile);
	let preview: ReturnType<typeof nutrition> | undefined,
		previewError = "";
	let tdee: number | undefined;
	if (weight) {
		try {
			tdee = energy(draft, weight).tdee;
			preview = nutrition(draft, weight);
		} catch (error) {
			previewError = errorMessage(error);
		}
	}
	const [expanded, setExpanded] = useState(Boolean(previewError));
	function update<K extends keyof Profile>(key: K, value: Profile[K]) {
		setSettings((current) => ({ ...current, [key]: value }));
		setError("");
	}
	async function submit(event: FormEvent) {
		event.preventDefault();
		setError("");
		setBusy(true);
		try {
			validateProfile(draft);
			if (previewError) throw new Error(previewError);
			await saveProfile(draft);
		} catch (error) {
			setError(errorMessage(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<details
			className="card plan-card"
			open={expanded}
			onToggle={(event) => setExpanded(event.currentTarget.open)}
		>
			<summary>
				<span>
					<strong>Your plan</strong>
					<span>
						{goalLabel(profile.goal_kg_per_week, tdee)} ·{" "}
						{activities.find((a) => a.value === profile.activity)?.label} activity
					</span>
				</span>
				<span className="text-button">
					Adjust <span aria-hidden="true">⌄</span>
				</span>
			</summary>
			<form onSubmit={submit} className="plan-form">
				<SelectField
					label="Activity level"
					value={draft.activity}
					onChange={(e) =>
						update("activity", Number(e.target.value) as Profile["activity"])
					}
				>
					{activities.map((a) => (
						<option key={a.value} value={a.value}>
							{a.label} — {a.detail}
						</option>
					))}
				</SelectField>
				<fieldset className="goal-fieldset">
					<legend>Weekly goal</legend>
					<div className="goal-options">
						{goals.map((goal) => {
							const percentage = tdee
								? Math.round(((goal * 1100) / tdee) * 100)
								: null;
							return (
								<label
									key={goal}
									className={draft.goal_kg_per_week === goal ? "selected" : ""}
								>
									<input
										type="radio"
										name="weekly-goal"
										value={goal}
										checked={draft.goal_kg_per_week === goal}
										onChange={() => update("goal_kg_per_week", goal)}
									/>
									<strong>
										{goal === 0 ? "Maintain" : `${goal > 0 ? "+" : "−"}${Math.abs(goal)}`}
									</strong>
									<span>{goal === 0 ? "0 kg/wk" : "kg/week"}</span>
									<small>
										{percentage === null
											? "—"
											: `${percentage > 0 ? "+" : ""}${percentage}%`}
									</small>
								</label>
							);
						})}
					</div>
					<p className="form-note">
						Percentages are relative to your maintenance calories.
					</p>
				</fieldset>
				<div className="form-grid">
					{[
						{ label: "Protein target", value: protein, setValue: setProtein, min: 0.1, max: 5, step: 0.1, unit: "g/kg", presets: [1.6, 2, 2.4] },
						{ label: "Fat target", value: fat, setValue: setFat, min: 15, max: 30, step: 1, unit: "%", presets: [20, 25, 30] },
					].map(({ label, value, setValue, min, max, step, unit, presets }) => (
						<div key={label}>
							<Field
								label={label}
								unit={unit}
								type="number"
								inputMode={step < 1 ? "decimal" : "numeric"}
								min={min}
								max={max}
								step={step}
								required
								value={value}
								onChange={(e) => {
									setValue(e.target.value);
									setError("");
								}}
							/>
							<div className="target-presets" role="group" aria-label={`${label} presets`}>
								{presets.map((preset) => (
									<button
										key={preset}
										type="button"
										className="text-button"
										aria-pressed={Number(value) === preset}
										onClick={() => {
											setValue(String(preset));
											setError("");
										}}
									>
										{preset} {unit}
									</button>
								))}
							</div>
						</div>
					))}
				</div>
				{previewError && <Notice error>{previewError}</Notice>}
				{error && <Notice error>{error}</Notice>}
				<div className="form-footer">
					<span className="muted">
						{changed && preview
							? `Preview: ${Math.round(preview.kcal).toLocaleString()} kcal · P ${Math.round(preview.protein)} / C ${Math.round(preview.carbs)} / F ${Math.round(preview.fat)} g`
							: "Carbs fill the remaining calories."}
					</span>
					<button className="button primary" disabled={busy || !changed}>
						{busy ? "Saving…" : "Save targets"}
					</button>
				</div>
			</form>
		</details>
	);
}
