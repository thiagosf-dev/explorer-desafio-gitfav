export class GithubUser {
	static search(username) {
		const endpoint = `https://api.github.com/users/${username}`;

		return fetch(endpoint)
			.then((data) => data.json())
			.then(({ login, name, public_repos, followers }) => ({
				login,
				name,
				public_repos,
				followers,
			}));
	}
}

export class Favorites {
	favorites = [];

	constructor(root) {
		this.root = document.querySelector(root);
		this.load();
	}

	load() {
		this.favorites =
			JSON.parse(localStorage.getItem("@github-favorites:")) || [];
	}

	async add(username) {
		if (!username) return;

		const userExists = this.favorites.find((entry) => entry.login === username);

		try {
			if (userExists) throw new Error("Usuário já está na lista de favoritos!");

			const user = await GithubUser.search(username);

			if (!user || !user.login) throw new Error("Usuário não encontrado!");

			this.favorites = [user, ...this.favorites];

			this.update();
			this.save();
			return user;
		} catch (error) {
			alert(error.message);
		}
	}

	save() {
		localStorage.setItem("@github-favorites:", JSON.stringify(this.favorites));
	}

	delete(favorite) {
		this.favorites = this.favorites.filter(
			(entry) => favorite.login !== entry.login
		);
		this.update();
		this.save();
	}
}

export class FavoritesView extends Favorites {
	constructor(root) {
		super(root);
		this.tBody = this.root.querySelector("table tbody");
		this.tFoot = this.root.querySelector("table tfoot");
		this.update();
		this.onAdd();
	}

	onAdd() {
		const addButton = this.root.querySelector(".search button");

		addButton.onclick = () => {
			const { value } = this.root.querySelector(".search input");
			const newFavorite = this.add(value);
			this.createRow(newFavorite);
		};
	}

	update() {
		this.removeAllTr();

		if (this.favorites.length <= 0) {
			this.tFoot.classList.add("no-users");
			return;
		}

		this.tFoot.classList.remove("no-users");
		this.favorites.forEach((favorite) =>
			this.tBody.append(this.createRow(favorite))
		);
	}

	removeAllTr() {
		const trs = this.tBody.querySelectorAll("tr");
		trs.forEach((tr) => tr.remove());
	}

	createRow(favorite) {
		const row = document.createElement("tr");

		row.innerHTML = `
				<td class="user">
					<img src="https://github.com/${favorite.login}.png/" alt="imagem do perfil do GitHub">
					<a href="https://github.com/${favorite.login}/" target="_blank">
						<p>${favorite.name}</p>
						<span>${favorite.login}</span>
					</a>
				</td>

				<td class="repositories">${favorite.public_repos}</td>

				<td class="followers">${favorite.followers}</td>

				<td class="r">
					<button class="remove">
						<span>Remover</span>
					</button>
				</td>
		`;

		row.querySelector("button").addEventListener("click", () => {
			const isOk = confirm(
				`Tem certeza que deseja remover esse registro: ${favorite.name}?`
			);

			if (isOk) {
				this.delete(favorite);
				this.update();
			}
		});

		return row;
	}
}
