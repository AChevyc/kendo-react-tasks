const commonTasks = require('@telerik/kendo-common-tasks');
const path = require('path');

const sourceExtensions = [ '.tsx', '.ts' ];
const nodeModulesPath = path.join(__dirname, 'node_modules');

const resolve = commonTasks.resolveConfig(sourceExtensions, nodeModulesPath);

const packageInfo = require(path.join(process.cwd(), 'package.json'));

const tsLoader = (compilerOptions, loaderOptions = {}) => ({
    test: /\.tsx?$/,
    exclude: /(node_modules)/,
    loader: require.resolve('ts-loader'),
    query: {
        compilerOptions
    },
    options: Object.assign({
        transpileOnly: true
    }, loaderOptions)
});

const babelLoader = {
    test: /\.jsx?$/,
    exclude: /(node_modules|bower_components)/,
    loader: require.resolve('babel-loader'),
    plugins: [
        require.resolve('babel-plugin-add-module-exports')
    ],
    query: {
        presets: [
            require.resolve('babel-preset-react'),
            require.resolve('babel-preset-es2015'),
            require.resolve('babel-preset-stage-1') // Note: stage-1 should be after es2015 in order to work
        ],
        plugins: [
            require.resolve('babel-plugin-transform-object-assign')
        ]
    }
};

const packageDependencies = () => (
    Object.keys(packageInfo["dependencies"] || {})
        .filter(x => x !== "@progress/kendo-theme-default")
);

module.exports = {
    CDN: commonTasks.webpackThemeConfig({ extract: true }, {
        resolve,

        output: { libraryTarget: 'umd' },

        externals: {
            "react": "React",
            "react-dom": "ReactDOM",
            "react-transition-group": {
                "root": [ "React", "TransitionGroup" ],
                "commonjs": true,
                "commonjs2": true,
                "amd": true
            },
            "react-css-transition-group": {
                "root": [ "React", "CSSTransitionGroup" ],
                "commonjs": true,
                "commonjs2": true,
                "amd": true
            }
        },
        plugins: [
            commonTasks.uglifyJsPlugin()
        ],

        module: {
            loaders: [
                tsLoader({
                    declaration: false
                }, {
                    transpileOnly: false
                })
            ]
        }
    }), // CDN

    npmPackage: commonTasks.webpackThemeConfig({ extract: true }, {
        resolve,

        output: { libraryTarget: 'commonjs2' },

        externals: [ 'react', 'react-dom', 'react-transition-group', /^\.\// ].concat(packageDependencies()),

        module: {
            loaders: [ babelLoader ]
        }
    }), // npmPackage

    dev: commonTasks.webpackDevConfig({
        resolve,
        loaders: [ tsLoader({ sourceMap: true }) ],
        entries: 'examples/**/*.tsx'
    }), // dev

    test: commonTasks.webpackThemeConfig({ stubResources: true }, {
        resolve: Object.assign({}, resolve, {
            alias: {
                "windowStub": require.resolve("./window-stub.js"),
                "documentStub": require.resolve("./document-stub.js")
            }
        }),

        externals: {
            'react/addons': true,
            'react/lib/ExecutionEnvironment': true,
            'react/lib/ReactContext': true,
            'react-addons-test-utils': 'react-dom'
        },

        plugins: [
            // skin deep needs this
            // https://github.com/glenjamin/skin-deep#errors-when-bundling
            new commonTasks.webpack.IgnorePlugin(/ReactContext/),
            new commonTasks.webpack.ProvidePlugin({
                "window": "windowStub",
                "document": "documentStub"
            })
        ],

        module: {
            loaders: [
                tsLoader(),
                { test: /\.json$/, loader: require.resolve('json-loader') }
            ]
        }
    }), // test

    e2e: commonTasks.webpackThemeConfig({ stubResources: true }, {
        resolve: {
            cache: false,
            fallback: resolve.fallback,
            alias: {
                "./e2e": process.cwd() + "/e2e",
                "e2e-utils": require.resolve("./e2e-utils.js"),
                [packageInfo.name]: '../src/main'
            },
            extensions: [ '', '.jsx', '.js', '.json', '.scss' ]
        },
        devtool: 'inline-source-map',
        module: {
            preLoaders: [
                {
                    test: /\.js$/,
                    loader: require.resolve("source-map-loader")
                }
            ],
            loaders: [
                babelLoader,
                { test: /\.json$/, loader: require.resolve('json-loader') }
            ]
        },
        stats: { colors: true, reasons: true },
        debug: false,
        plugins: [
            new commonTasks.webpack.ContextReplacementPlugin(/\.\/e2e/, process.cwd() + '/e2e')
        ]
    }),

    e2eNpmPackage: commonTasks.webpackThemeConfig({ stubResources: true }, {
        resolve: {
            cache: false,
            fallback: resolve.fallback,
            alias: {
                "./e2e": process.cwd() + "/e2e",
                "e2e-utils": require.resolve("./e2e-utils.js"),
                [packageInfo.name]: '../dist/npm/js/main'
            },
            extensions: [ '', '.jsx', '.js', '.json', '.scss' ]
        },
        devtool: 'inline-source-map',
        module: {
            preLoaders: [
                {
                    test: /\.js$/,
                    loader: require.resolve("source-map-loader")
                }
            ],
            loaders: [
                babelLoader,
                { test: /\.json$/, loader: require.resolve('json-loader') }
            ]
        },
        stats: { colors: true, reasons: true },
        debug: false,
        plugins: [
            new commonTasks.webpack.ContextReplacementPlugin(/\.\/e2e/, process.cwd() + '/e2e')
        ]
    })


}; // module.exports
