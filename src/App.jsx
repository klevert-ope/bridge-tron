import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { BridgeApp } from "./components/BridgeApp";
import "./App.css";

function App() {
	return (
		<MantineProvider>
			<Notifications position="top-center" />
			<ModalsProvider>
				<BridgeApp />
			</ModalsProvider>
		</MantineProvider>
	);
}

export default App;
