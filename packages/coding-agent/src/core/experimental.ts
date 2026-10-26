export function areExperimentalFeaturesEnabled(): boolean {
	return process.env.NO_MISTAKES_EXPERIMENTAL === "1";
}
