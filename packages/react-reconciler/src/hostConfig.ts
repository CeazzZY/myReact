/* eslint-disable @typescript-eslint/no-explicit-any */
export type Container = any;

export const createInstance = function (...args: any) {
	console.log(args);
	return {} as any;
};

export const appendInitialChild = function (...args: any) {
	console.log(args);
	return {} as any;
};

export const createTextInstance = function (...args: any) {
	console.log(args);
	return {} as any;
};

export const appendChildToContainer = function (...args: any) {
	console.log(args);
	return {} as any;
};
