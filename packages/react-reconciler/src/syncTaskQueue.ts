// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncQueue: ((...args: any) => void)[] | null = null;
let isFlushingSyncQueue = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scheduleSyncCallback(callback: (...args: any) => void) {
	if (syncQueue === null) {
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
}

export function flushSyncCallbacks() {
	if (!isFlushingSyncQueue && syncQueue) {
		isFlushingSyncQueue = true;
		try {
			syncQueue.forEach((callback) => {
				callback();
			});
		} catch (e) {
			if (__DEV__) {
				console.error('flushSyncCallback报错', e);
			}
		} finally {
			isFlushingSyncQueue = false;
			syncQueue = null;
		}
	}
}
