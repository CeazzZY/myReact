/* eslint-disable @typescript-eslint/no-explicit-any */
import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
import ReactCurrentBatchConfig from './src/currentBatchConfig';
import { jsx, isValidElement as isValidElementFn } from './src/jsx';
//React

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useEffect(create, deps);
};

export const useTransition: Dispatcher['useTransition'] = () => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useTransition();
};

export const useRef: Dispatcher['useRef'] = (initialValue) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useRef(initialValue);
};

//内部数据共享层
export const __SECRET__INTERNALS__DO__NOT__USE__OR__YOU__WILL__BE__FIRER = {
	currentDispatcher,
	ReactCurrentBatchConfig
};

export const version = '0.0.0';
export const createElement = jsx;
export const isValidElement = isValidElementFn;
