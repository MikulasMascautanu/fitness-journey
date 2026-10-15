import type { Remote } from "./repository";
import { supabase } from "./supabase";
import type { BodyEntry, CycleEntry, FoodDay, Profile } from "./types";

async function assertSession(accountId: string) {
	const { data, error } = await supabase!.auth.getSession();
	if (error) throw error;
	if (data.session?.user.id !== accountId)
		throw new Error("Sign in to this account again to sync your changes.");
}

export const remote: Remote = {
	async pull(accountId) {
		await assertSession(accountId);
		const [profile, body, food, cycles] = await Promise.all([
			supabase!.from("profiles").select("*").eq("id", accountId).maybeSingle(),
			allRows<BodyEntry>("body_entries", accountId),
			allRows<FoodDay>("food_days", accountId),
			allRows<CycleEntry>("cycle_entries", accountId),
		]);
		if (profile.error) throw profile.error;
		return { profile: profile.data as Profile | null, body, food, cycles };
	},
	async push(write) {
		await assertSession(
			write.table === "profiles" ? write.record.id : write.record.account_id,
		);
		if (write.table === "cycle_entries" && write.deleted) {
			const { error } = await supabase!
				.from("cycle_entries")
				.delete()
				.eq("account_id", write.record.account_id)
				.eq("id", write.record.id);
			if (error) throw error;
			return;
		}
		const { error } = await supabase!
			.from(write.table)
			.upsert<
				Record<string, unknown>
			>(write.record, { onConflict: write.table === "profiles" || write.table === "cycle_entries" ? "id" : "account_id,date" });
		if (error) throw error;
	},
};

// Supabase caps a response at 1,000 rows by default. Keep the full history available.
async function allRows<T>(
	table: "body_entries" | "food_days" | "cycle_entries",
	accountId: string,
): Promise<T[]> {
	const rows: T[] = [];
	for (let offset = 0; ; offset += 1000) {
		const { data, error } = await supabase!
			.from(table)
			.select("*")
			.eq("account_id", accountId)
			.order(table === "cycle_entries" ? "start_date" : "date", {
				ascending: false,
			})
			.range(offset, offset + 999);
		if (error) throw error;
		rows.push(...(data as T[]));
		if (data.length < 1000) return rows;
	}
}
