/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, ReactContext, Usable } from 'shared/ReactTypes';

export type Dispatch<State> = (action: Action<State>) => void;

export interface Dispatcher {
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
	useEffect: (callback: () => void | void, deps: any[]) => void;
	useTransition: () => [boolean, (callback: () => void) => void];
	useRef: <T>(initialValue: T) => { current: T };
	useContext: <T>(context: ReactContext<T>) => T;
	use: <T>(usable: Usable<T>) => T;
}

export const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export const resolveDispatcher = (): Dispatcher => {
	const dispatch = currentDispatcher.current;

	if (dispatch === null) {
		throw new Error('hook只能在函数组件中执行');
	}

	return dispatch!;
};

export default currentDispatcher;
