/* eslint-disable */
export default function (w) {
  return {
    name: 'XbrlParser',
    runMode: 'onsave',
    files: ['package.json', './*.js', 'src/**/*.js', 'test/**/*.{txt,xml,idx}'],
    tests: ['test/index.spec.js'],
    env: {
      type: 'node'
    },
    testFramework: 'mocha',
    workers: { restart: true }
  };
}
