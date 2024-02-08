import reactDomConfig from './react-dom.config.js';
import reactConfig from './react.config.js';
import reactNoopRenderer from './react-noop-renderer.config.js';

export default () => {
	return [...reactConfig, ...reactDomConfig, ...reactNoopRenderer];
};
