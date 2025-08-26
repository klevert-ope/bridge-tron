import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { BridgeApp } from "./components/BridgeApp";
import "./App.css";

function App() {
	return (
		<MantineProvider
			defaultColorScheme="dark"
			theme={{
				colors: {
					dark: [
						"#C1C2C5",
						"#A6A7AB",
						"#909296",
						"#5C5F66",
						"#373A40",
						"#2C2E33",
						"#25262B",
						"#1A1B1E",
						"#141517",
						"#101113",
					],
				},
				primaryColor: "teal",
			}}
		>
			<Notifications position="top-center" />
			<ModalsProvider>
				<BridgeApp />
			</ModalsProvider>
		</MantineProvider>
	);
}

export default App;
