import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
    entry: './src/index.tsx',
    output: {
        path: resolve(__dirname, '../webview/dist'),
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js','.css'],
    },
    module: {
        rules: [
          {
            test: /\.(ts|tsx)$/,
            exclude: /node_modules/,
            use: {
              loader: 'ts-loader',
              options: {
                transpileOnly: true
              }
            }
          },
          {
              test: /\.css$/, // Add this rule for CSS files
              use: ['style-loader', 'css-loader'], // Use both style-loader and css-loader
          }
        ]
      },
    mode: 'production',
};

export default config;
