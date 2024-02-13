/* eslint-disable @typescript-eslint/no-explicit-any */
import { WakeAble } from 'shared/ReactTypes';
import { FiberRootNode } from './fiber';
import { Lane, markRootPinged } from './fiberLanes';
import { ensureRootIsScheduled, markRootUpdated } from './workLoop';
import { ShouldCapture } from './fiberFlags';
import { getSuspenseHandler } from './suspenseContext';

export function throwException(root: FiberRootNode, value: any, lane: Lane) {
	if (
		value !== null &&
		typeof value === 'object' &&
		typeof value.then === 'function'
	) {
		const weakAble: WakeAble<any> = value;

		const suspenseBoundary = getSuspenseHandler();
		if (suspenseBoundary) {
			suspenseBoundary.flags |= ShouldCapture;
		}
		attachPingListener(root, weakAble, lane);
	}
}

function attachPingListener(
	root: FiberRootNode,
	wakeAble: WakeAble<any>,
	lane: Lane
) {
	let pingCache = root.pingCache;
	let threadIDs: Set<Lane> | undefined;

	if (pingCache === null) {
		threadIDs = new Set<Lane>();
		pingCache = root.pingCache = new WeakMap<WakeAble<any>, Set<Lane>>();
		pingCache.set(wakeAble, threadIDs);
	} else {
		threadIDs = pingCache.get(wakeAble);
		if (threadIDs === undefined) {
			threadIDs = new Set<Lane>();
			pingCache.set(wakeAble, threadIDs);
		}
	}
	function ping() {
		if (pingCache !== null) {
			pingCache.delete(wakeAble);
		}
		markRootPinged(root, lane);
		markRootUpdated(root, lane);
		ensureRootIsScheduled(root);
	}
	if (!threadIDs.has(lane)) {
		// 第一次进入
		threadIDs.add(lane);
		wakeAble.then(ping, ping);
	}
}
