import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useData } from "../lib/data";
import { Icon } from "./Icon";

export function Portions({ syncStatus }: { syncStatus: ReactNode }) {
	const { accountId, portions } = useData();
	const directory = [...portions].sort(
		(a, b) =>
			a.display_name.localeCompare(b.display_name) ||
			a.account_id.localeCompare(b.account_id),
	);

	return (
		<>
			<div className="page-heading">
				<div>
					<h1>Portions</h1>
				</div>
				<div className="heading-actions">
					{syncStatus}
					<span className="heading-icon">
						<Icon name="portions" size={26} />
					</span>
				</div>
			</div>
			<p className="page-intro">
				Raw ingredient weights for one portion per person.{" "}
				<NavLink to="/account">Manage your portion sizes in your profile.</NavLink>
			</p>
			<section className="card" aria-labelledby="portions-list-heading">
				<div className="card-heading">
					<h2 id="portions-list-heading">Portion sizes</h2>
					<span className="subtle-label">Per person · per portion</span>
				</div>
				{directory.length ? (
					<div className="table-scroll">
						<table className="portions-table">
							<caption className="sr-only">
								Saved raw ingredient weights for one portion per person
							</caption>
							<thead>
								<tr>
									<th scope="col">Person</th>
									<th scope="col">Meat (g raw)</th>
									<th scope="col">Carbs (g raw)</th>
								</tr>
							</thead>
							<tbody>
								{directory.map((entry) => (
									<tr key={entry.account_id}>
										<th scope="row">
											{entry.display_name}
											{entry.account_id === accountId && (
												<span className="portion-owner">You</span>
											)}
										</th>
										<td>{entry.meat_raw_g}</td>
										<td>{entry.carbs_raw_g}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="empty-history">
						No portion sizes saved yet. Set yours in your profile to appear in the
						list.
					</p>
				)}
			</section>
		</>
	);
}
