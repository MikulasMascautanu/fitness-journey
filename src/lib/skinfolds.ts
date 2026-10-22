import table from "./durnin-womersley-table.json";
import { inRange } from "./calculations";
import type { Sex } from "./types";

export const skinfoldMethod = "durnin-womersley-4-site" as const;
export const skinfoldSites = [
	"Biceps",
	"Triceps",
	"Subscapular",
	"Suprailiac",
] as const;

// Published percentage lookups: Durnin & Womersley (1974), Table 9, p. 95.
// These age bands differ from the equation coefficients in Table 5.
export function skinfoldEstimate(
	sex: Sex,
	age: number,
	sites: readonly number[],
) {
	inRange(age, 18, 120, "Age");
	if (sex !== "m" && sex !== "f")
		throw new Error("Select a sex for the calculation.");
	if (sites.length !== 4) throw new Error("Enter all four skinfold readings.");
	// Inputs use tenths of a millimetre; remove floating-point summation noise.
	const sum =
		Math.round(
			sites.reduce(
				(total, site) => total + inRange(site, 1, 100, "Skinfold (mm)"),
				0,
			) * 10,
		) / 10;
	const band = age < 30 ? 0 : age < 40 ? 1 : age < 50 ? 2 : 3;
	const ageBand = table.columns[sex][band];
	const column = 1 + (sex === "f" ? 4 : 0) + band;
	const rows = table.rows.filter((row) => row[column] !== null);
	const min = rows[0][0]!;
	const max = rows.at(-1)![0]!;
	if (sum < min || sum > max) {
		throw new Error(
			`The ${sex === "m" ? "male" : "female"} age ${ageBand} table covers totals of ${min}–${max} mm. Your total is ${sum} mm; no estimate is available.`,
		);
	}
	const upper = rows.find((row) => row[0]! >= sum)!;
	const exact = upper[0] === sum;
	const lower = exact ? upper : rows[rows.indexOf(upper) - 1];
	const percentage = exact
		? upper[column]!
		: lower[column]! +
			((upper[column]! - lower[column]!) * (sum - lower[0]!)) /
				(upper[0]! - lower[0]!);
	return {
		percentage,
		sum,
		ageBand,
		interpolated: !exact,
		lowerSum: lower[0]!,
		upperSum: upper[0]!,
	};
}
