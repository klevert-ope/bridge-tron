import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(
	fileURLToPath(import.meta.url)
);

export default defineConfig(({ mode }) => {
	const isProduction = mode === "production";

	return {
		plugins: [
			react(),
			nodePolyfills({
				protocolImports: true,
			}),
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		define: {
			global: "globalThis",
		},
		build: {
			target: "es2020",
			sourcemap: !isProduction,
			minify: isProduction ? "terser" : false,
			rollupOptions: {
				onwarn(warning, warn) {
					// Suppress sourcemap warnings for missing source files
					if (
						warning.code === "SOURCEMAP_ERROR" ||
						(warning.message &&
							warning.message.includes(
								"points to missing source files"
							))
					) {
						return;
					}
					warn(warning);
				},
			},
		},
		server: {
			port: 5173,
			host: true,
		},
	};
});
