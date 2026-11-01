import { useState, type FormEvent } from "react";
import { errorMessage, useData } from "../lib/data";
import { Field, Notice } from "./Fields";

type Draft = { name: string; meat: string; carbs: string };

export function PortionSettingsForm() {
	const { accountId, portions, savePortions, demo } = useData();
	const own = portions.find((entry) => entry.account_id === accountId);
	const [draft, setDraft] = useState<Draft | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState(false);
	const savedDraft: Draft = {
		name: own?.display_name ?? "",
		meat: own?.meat_raw_g.toString() ?? "",
		carbs: own?.carbs_raw_g.toString() ?? "",
	};
	const values = draft ?? savedDraft;
	const changed = Object.keys(savedDraft).some(
		(key) => values[key as keyof Draft] !== savedDraft[key as keyof Draft],
	);

	function change(key: keyof Draft, value: string) {
		setDraft({ ...values, [key]: value });
		setError("");
		setSaved(false);
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError("");
		setSaved(false);
		setBusy(true);
		try {
			const name = values.name.trim();
			if (!name || name.length > 80)
				throw new Error("Enter a name between 1 and 80 characters.");
			const grams = (value: string, label: string) => {
				const number = Number(value);
				if (
					!value.trim() ||
					!Number.isFinite(number) ||
					number < 0 ||
					number > 5000 ||
					Math.abs(number * 10 - Math.round(number * 10)) > 0.000001
				)
					throw new Error(
						`${label} must be between 0 and 5,000 grams, in steps of 0.1 g.`,
					);
				return number;
			};
			await savePortions({
				account_id: accountId,
				display_name: name,
				meat_raw_g: grams(values.meat, "Meat"),
				carbs_raw_g: grams(values.carbs, "Carbs"),
			});
			setDraft(null);
			setSaved(true);
		} catch (cause) {
			setError(errorMessage(cause));
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="card" aria-labelledby="your-portions-heading">
			<div className="card-heading">
				<h2 id="your-portions-heading">Your portion sizes</h2>
			</div>
			<p className="form-note">
				Meat is weighed raw. Carbs means the weight of an uncooked carb ingredient,
				such as dry rice or pasta, rather than grams of carbohydrate. Enter zero if
				you do not use one.
			</p>
			<form onSubmit={submit}>
				<fieldset className="portion-fields" disabled={busy}>
					<Field
						label="Name shown in the list"
						required
						maxLength={80}
						autoComplete="nickname"
						value={values.name}
						onChange={(event) => change("name", event.target.value)}
					/>
					<div className="form-grid">
						<Field
							label="Meat per portion"
							unit="g raw"
							type="number"
							inputMode="decimal"
							required
							min="0"
							max="5000"
							step="0.1"
							placeholder="150"
							value={values.meat}
							onChange={(event) => change("meat", event.target.value)}
						/>
						<Field
							label="Carbs per portion"
							unit="g raw"
							type="number"
							inputMode="decimal"
							required
							min="0"
							max="5000"
							step="0.1"
							placeholder="75"
							value={values.carbs}
							onChange={(event) => change("carbs", event.target.value)}
						/>
					</div>
				</fieldset>
				<p className="form-note">
					{demo
						? "Demo changes stay in this browser."
						: "Your chosen name and portion sizes are visible to other registered users. Only you can edit your sizes."}
				</p>
				{error && <Notice error>{error}</Notice>}
				{saved && <Notice>Portions saved.</Notice>}
				<div className="form-footer portion-footer">
					<button
						className="button secondary"
						type="button"
						disabled={busy || !changed}
						onClick={() => {
							setDraft(null);
							setError("");
							setSaved(false);
						}}
					>
						Cancel
					</button>
					<button className="button primary" disabled={busy || !changed}>
						{busy ? "Saving…" : "Save portions"}
					</button>
				</div>
			</form>
		</section>
	);
}
