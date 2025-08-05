import socket from "../socket";
import upload from "../upload";
import {store} from "../store";
import storage from "../localStorage";

socket.once("configuration", function (data) {
	store.commit("serverConfiguration", data);

	// 'theme' setting depends on serverConfiguration.themes so
	// settings cannot be applied before this point
	void store.dispatch("settings/applyAll");

	if (data.fileUpload) {
		upload.initialize();
	}

	// If localStorage contains a theme that does not exist on this server, switch
	// back to its default theme.
	const currentTheme = data.themes.find((t) => t.name === store.state.settings.theme);

	if (currentTheme === undefined) {
		void store.dispatch("settings/update", {
			name: "theme",
			value: data.defaultTheme,
			sync: true,
		});
	} else if (currentTheme.themeColor) {
		(document.querySelector('meta[name="theme-color"]') as HTMLMetaElement).content =
			currentTheme.themeColor;
	}

	// Phase 2: Apply Curia theme marker to body element after all theme initialization
	const savedTheme = storage.get("curia.theme");
	if (savedTheme) {
		document.body.setAttribute("data-curia-theme", savedTheme);
		// Also add as CSS class for additional styling flexibility
		document.body.classList.add(`curia-theme-${savedTheme}`);
	}

	if (document.body.classList.contains("public")) {
		window.addEventListener("beforeunload", (e) => {
			e.preventDefault();
			e.returnValue = "Are you sure you want to navigate away from this page?";
		});
	}
});
