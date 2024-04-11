import { useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";

import { Item } from "./item";
import classnames from "classnames";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function Main() {
	const { pathname: route } = useLocation();
	const todos = useQuery(api.todo.listItems) || [];
	const visibleTodos = useMemo(
		() =>
			todos.filter((todo) => {
				if (route === "/active") return !todo.completed;

				if (route === "/completed") return todo.completed;

				return todo;
			}),
		[todos, route],
	);

	const toggleAll = useMutation(api.todo.toggleAll);

	return (
		<main className="main" data-testid="main">
			{visibleTodos.length > 0 ? (
				<div className="toggle-all-container">
					<input
						className="toggle-all"
						type="checkbox"
						data-testid="toggle-all"
						checked={visibleTodos.every((todo) => todo.completed)}
						onChange={(e) => toggleAll({ completed: e.target.checked })}
					/>
					<label className="toggle-all-label" htmlFor="toggle-all">
						Toggle All Input
					</label>
				</div>
			) : null}
			<ul className={classnames("todo-list")} data-testid="todo-list">
				{visibleTodos.map((todo) => (
					<Item todo={todo} key={todo.id} />
				))}
			</ul>
		</main>
	);
}
