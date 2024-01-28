/* eslint-disable @typescript-eslint/no-explicit-any */
export type Container = Element;
export type Instance = Element;

export const createInstance = function (type: string, props: any): Instance {
	console.log(props);
	//TODO 处理props
	const element = document.createElement(type);
	return element;
};

export const appendInitialChild = function (
	parent: Instance | Container,
	child: Instance
) {
	parent.appendChild(child);
};

export const createTextInstance = function (content: string) {
	return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;
