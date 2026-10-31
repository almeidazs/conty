import type { Command } from 'commander';

import { login } from './login';
import { logout } from './logout';
import { profiles } from './profiles';
import { switchProfile } from './switch';
import { whoami } from './whoami';

export const registerAccount = (program: Command) => {
	for (const register of [login, logout, switchProfile, profiles, whoami])
		register(program);
};
