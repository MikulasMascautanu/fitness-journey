import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "prompt",
			includeAssets: ["favicon.svg", "icon-180.png"],
			manifest: {
				id: "/",
				name: "Fitness Journey — Body & Nutrition",
				short_name: "Fitness Journey",
				description: "Your body progress and daily nutrition, one day at a time.",
				start_url: "/",
				scope: "/",
				display: "standalone",
				theme_color: "#427354",
				background_color: "#f6f7f4",
				icons: [
					{
						src: "/icon-192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
				navigateFallback: "/index.html",
				navigateFallbackDenylist: [/^\/reference\//],
				cleanupOutdatedCaches: true,
			},
		}),
	],
});
