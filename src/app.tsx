import { useMutation, useQuery } from "convex/react";
import "./app.css";
import { useLocation } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { useMemo } from "react";
import { Input } from "./input";
import classnames from "classnames";
import { Item } from "./item";

export function App() {
	const { pathname: route } = useLocation();
	const todos = useQuery(api.todo.listItems) || [];
	const addItem = useMutation(api.todo.addItem);
	const removeCompleted = useMutation(api.todo.removeCompleted);
	const toggleAll = useMutation(api.todo.toggleAll);

	const visibleTodos = useMemo(
		() =>
			todos.filter((todo) => {
				if (route === "/active") return !todo.completed;

				if (route === "/completed") return todo.completed;

				return todo;
			}),
		[todos, route],
	);

	const activeTodos = useMemo(
		() => todos.filter((todo) => !todo.completed),
		[todos],
	);

	return (
		<>
			<header className="header" data-testid="header">
				<h1>todos</h1>
				<Input
					onSubmit={(value) => addItem({ title: value })}
					label="New Todo Input"
					placeholder="What needs to be done?"
				/>
			</header>
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
			{todos.length > 0 && (
				<footer className="footer" data-testid="footer">
					<span className="todo-count">{`${activeTodos.length} ${activeTodos.length === 1 ? "item" : "items"} left!`}</span>
					<ul className="filters" data-testid="footer-navigation">
						<li>
							<a className={classnames({ selected: route === "/" })} href="#/">
								All
							</a>
						</li>
						<li>
							<a
								className={classnames({ selected: route === "/active" })}
								href="#/active"
							>
								Active
							</a>
						</li>
						<li>
							<a
								className={classnames({ selected: route === "/completed" })}
								href="#/completed"
							>
								Completed
							</a>
						</li>
					</ul>
					<button
						className="clear-completed"
						disabled={activeTodos.length === todos.length}
						onClick={() => removeCompleted()}
					>
						Clear completed
					</button>
				</footer>
			)}
		</>
	);
}
