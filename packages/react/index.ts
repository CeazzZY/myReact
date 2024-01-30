/* eslint-disable @typescript-eslint/no-explicit-any */
import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
import { jsx, isValidElement as isValidElementFn } from './src/jsx';
//React

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

//内部数据共享层
export const __SECRET__INTERNALS__DO__NOT__USE__OR__YOU__WILL__BE__FIRER = {
	currentDispatcher
};

export const version = '0.0.0';
export const createElement = jsx;
export const isValidElement = isValidElementFn;
