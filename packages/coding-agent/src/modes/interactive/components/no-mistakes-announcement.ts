import { Container, Spacer, Text } from "@no-mistakes/tui";
import { theme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";

export class NoMistakesAnnouncementComponent extends Container {
	constructor() {
		super();

		this.addChild(new DynamicBorder((text) => theme.fg("accent", text)));
		this.addChild(new Text(theme.bold(theme.fg("accent", "no-mistakes")), 1, 0));
		this.addChild(new Spacer(1));
		this.addChild(
			new Text(theme.fg("muted", 'Stop telling your agent to "make no mistakes." Now it\'s built-in.'), 1, 0),
		);
		this.addChild(new DynamicBorder((text) => theme.fg("accent", text)));
	}
}
