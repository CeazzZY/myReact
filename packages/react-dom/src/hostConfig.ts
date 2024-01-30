import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

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

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;
			return commitTextUpdate(fiber.stateNode, text);
		default:
			if (__DEV__) {
				console.warn('未实现的Update类型', fiber);
			}
			break;
	}
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}
