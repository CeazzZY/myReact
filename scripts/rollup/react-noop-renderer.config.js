import { getBaseRollupPlugin, getPackageJSON, resolvePkgPath } from './utils';
import generatePackJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const { name, module, peerDependencies } = getPackageJSON(
	'react-noop-renderer'
);
//react-noop-renderer包的路径
const pkgPath = resolvePkgPath(name);
//react-noop-renderer产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
	//react-noop-renderer
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'ReactNoopRenderer',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies), 'scheduler'],
		plugins: [
			...getBaseRollupPlugin({
				typescript: {
					exclude: ['./packages/react-dom/**/*'],
					tsconfigOverride: {
						compilerOptions: {
							paths: {
								hostConfig: [`./${name}/src/hostConfig.ts`]
							}
						}
					}
				}
			}),
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	}
];
